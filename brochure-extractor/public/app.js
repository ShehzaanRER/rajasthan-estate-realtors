(() => {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const chooseBtn = document.getElementById("choose-btn");
  const fileInfo = document.getElementById("file-info");
  const fileNameEl = document.getElementById("file-name");
  const pageCountEl = document.getElementById("page-count");
  const convertBtn = document.getElementById("convert-btn");
  const resetBtn = document.getElementById("reset-btn");
  const errorBox = document.getElementById("error-box");

  const uploadSection = document.getElementById("upload-section");
  const progressSection = document.getElementById("progress-section");
  const resultsSection = document.getElementById("results-section");

  const projectNameInput = document.getElementById("project-name");
  const grid = document.getElementById("grid");
  const downloadBtn = document.getElementById("download-btn");
  const downloadError = document.getElementById("download-error");
  const startOverBtn = document.getElementById("start-over-btn");

  let state = { sessionId: null, pageCount: 0, pages: [], selectedFile: null };

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.hidden = false;
  }
  function clearError() {
    errorBox.hidden = true;
    errorBox.textContent = "";
  }

  function resetToUpload() {
    if (state.sessionId) {
      fetch(`/api/session/${state.sessionId}`, { method: "DELETE" }).catch(() => {});
    }
    state = { sessionId: null, pageCount: 0, pages: [], selectedFile: null };
    fileInput.value = "";
    fileInfo.hidden = true;
    clearError();
    uploadSection.hidden = false;
    progressSection.hidden = true;
    resultsSection.hidden = true;
    grid.innerHTML = "";
  }

  function humanLabel(category) {
    return category.replace(/-/g, " ");
  }

  // ---- Upload / inspect ----------------------------------------------------
  async function handleFile(file) {
    clearError();
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      showError("Please select a PDF file.");
      return;
    }
    state.selectedFile = file;

    const form = new FormData();
    form.append("pdf", file);

    fileNameEl.textContent = file.name;
    pageCountEl.textContent = "Reading PDF…";
    fileInfo.hidden = false;
    convertBtn.disabled = true;

    try {
      const res = await fetch("/api/inspect", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to read PDF.");

      state.sessionId = data.sessionId;
      state.pageCount = data.pageCount;
      pageCountEl.textContent = `${data.pageCount} page${data.pageCount === 1 ? "" : "s"}`;
      projectNameInput.value = data.projectName;
      convertBtn.disabled = false;
    } catch (err) {
      showError(err.message);
      fileInfo.hidden = true;
    }
  }

  chooseBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => handleFile(e.target.files[0]));

  ["dragenter", "dragover"].forEach((evt) =>
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    })
  );
  ["dragleave", "drop"].forEach((evt) =>
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
    })
  );
  dropzone.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    handleFile(file);
  });

  resetBtn.addEventListener("click", resetToUpload);
  startOverBtn.addEventListener("click", resetToUpload);

  // ---- Convert ---------------------------------------------------------------
  convertBtn.addEventListener("click", async () => {
    if (!state.sessionId) return;
    clearError();
    uploadSection.hidden = true;
    progressSection.hidden = false;

    try {
      const res = await fetch(`/api/convert/${state.sessionId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Conversion failed.");

      state.pages = data.pages;
      renderResults();
      progressSection.hidden = true;
      resultsSection.hidden = false;
    } catch (err) {
      progressSection.hidden = true;
      uploadSection.hidden = false;
      showError(err.message);
    }
  });

  // ---- Results grid ------------------------------------------------------------
  function renderResults() {
    grid.innerHTML = "";
    for (const page of state.pages) {
      const cardEl = document.createElement("div");
      cardEl.className = "card-item" + (page.failed ? " failed" : "");
      cardEl.dataset.index = page.index;

      if (page.failed) {
        cardEl.innerHTML = `
          <div class="thumb-wrap"><span class="muted">No preview</span></div>
          <div class="body">
            <div class="page-no">Page ${page.pageNumber}</div>
            <div class="category">Render failed</div>
            <div class="failed-note">This page could not be rendered and will be skipped.</div>
          </div>`;
      } else {
        cardEl.innerHTML = `
          <div class="thumb-wrap"><img src="${page.previewUrl}" alt="Page ${page.pageNumber} preview" loading="lazy" /></div>
          <div class="body">
            <div class="page-no">Page ${page.pageNumber}</div>
            <div class="category">${humanLabel(page.category)}</div>
            <input class="filename" type="text" value="${page.filename}" data-index="${page.index}" />
          </div>`;
      }
      grid.appendChild(cardEl);
    }
    grid.querySelectorAll("input.filename").forEach((input) => {
      input.addEventListener("input", checkDuplicates);
    });
    checkDuplicates();
  }

  function checkDuplicates() {
    const inputs = Array.from(grid.querySelectorAll("input.filename"));
    const counts = {};
    inputs.forEach((i) => {
      const v = i.value.trim().toLowerCase();
      counts[v] = (counts[v] || 0) + 1;
    });
    let hasDuplicate = false;
    inputs.forEach((i) => {
      const v = i.value.trim().toLowerCase();
      const isDup = counts[v] > 1 || v === "";
      i.classList.toggle("duplicate", isDup);
      if (isDup) hasDuplicate = true;
    });
    downloadBtn.disabled = hasDuplicate;
    return !hasDuplicate;
  }

  // ---- Download ZIP -------------------------------------------------------------
  downloadBtn.addEventListener("click", async () => {
    downloadError.hidden = true;
    if (!checkDuplicates()) {
      downloadError.textContent = "Please fix duplicate or empty filenames before downloading.";
      downloadError.hidden = false;
      return;
    }

    const files = Array.from(grid.querySelectorAll("input.filename")).map((i) => ({
      index: parseInt(i.dataset.index, 10),
      filename: i.value.trim(),
    }));

    downloadBtn.disabled = true;
    downloadBtn.textContent = "Preparing ZIP…";
    try {
      const res = await fetch(`/api/zip/${state.sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName: projectNameInput.value, files }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate ZIP.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(projectNameInput.value || "brochure").trim()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      state.sessionId = null; // server already cleaned up temp files
    } catch (err) {
      downloadError.textContent = err.message;
      downloadError.hidden = false;
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.textContent = "Download ZIP";
    }
  });
})();
