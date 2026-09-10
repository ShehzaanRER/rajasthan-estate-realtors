export default function ProjectDetailLoading() {
  return (
    <main className="animate-pulse bg-white">
      <div className="border-b border-slate-200 bg-[#F7F5F1] py-5">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">
          <div className="h-4 w-32 bg-slate-200" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8 sm:px-10 sm:py-10 md:px-16 lg:px-8">
        <div className="h-[420px] w-full bg-slate-100 sm:h-[520px]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-16 sm:px-10 md:px-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <div className="h-3 w-24 bg-slate-100" />
            <div className="h-10 w-2/3 bg-slate-100" />
            <div className="h-4 w-1/3 bg-slate-100" />
          </div>
          <div className="h-64 border border-slate-200 bg-slate-50" />
        </div>
      </div>
    </main>
  );
}
