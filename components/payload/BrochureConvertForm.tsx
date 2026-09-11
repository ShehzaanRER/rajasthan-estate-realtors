'use client';

import { useState } from 'react';
import { Banner, Button, toast } from '@payloadcms/ui';

type ExtractedConfiguration = {
  name: string | null;
  carpetArea: number | null;
  minArea: number | null;
  maxArea: number | null;
  areaUnit: string | null;
  startingPrice: number | null;
  maxPrice: number | null;
  priceLabel: string | null;
  notes: string | null;
};

type ExtractedProjectData = {
  name: string | null;
  developer: string | null;
  location: {
    address: string | null;
    locality: string | null;
    area: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
  };
  legal: { reraNumber: string | null; reraInfo: string | null };
  description: string | null;
  highlights: string[];
  configurations: ExtractedConfiguration[];
  projectDetails: Record<string, unknown>;
  amenities: string[];
  specifications: { label: string; value: string }[];
};

type DuplicateCandidate = {
  id: number;
  name: string;
  developer: string;
  locality: string | null;
  status: string;
  slug: string;
  matchedOn: string[];
};

type ValidateResponse = {
  data: ExtractedProjectData;
  reviewFlags: string[];
  amenityMatch: { matchedIds: number[]; matchedNames: string[]; unmatched: string[] };
  duplicates: DuplicateCandidate[];
  suggestedSlug: string;
  source: { sourceType: 'pasted-text'; sourceFilename: string | null };
};

type CreatedProject = { id: number; slug: string; projectId: string };

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return typeof body.message === 'string' && body.message ? body.message : fallback;
  } catch {
    return fallback;
  }
}

function BrochureConvertForm() {
  const [pastedJson, setPastedJson] = useState('');

  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<ValidateResponse | null>(null);

  const [name, setName] = useState('');
  const [developer, setDeveloper] = useState('');
  const [slug, setSlug] = useState('');
  const [amenitySelection, setAmenitySelection] = useState<Record<number, boolean>>({});
  const [duplicateAcknowledged, setDuplicateAcknowledged] = useState(false);

  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<CreatedProject | null>(null);

  const reset = () => {
    setPastedJson('');
    setResult(null);
    setName('');
    setDeveloper('');
    setSlug('');
    setAmenitySelection({});
    setDuplicateAcknowledged(false);
    setCreated(null);
  };

  const handleValidate = async () => {
    if (!pastedJson.trim()) {
      toast.error('Paste the project JSON first.');
      return;
    }

    setValidating(true);
    setResult(null);
    setCreated(null);

    try {
      const response = await fetch('/api/brochure-convert/validate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: pastedJson }),
      });

      if (!response.ok) {
        toast.error(await readErrorMessage(response, 'Validation failed.'));
        return;
      }

      const json = (await response.json()) as ValidateResponse;
      setResult(json);
      setName(json.data.name ?? '');
      setDeveloper(json.data.developer ?? '');
      setSlug(json.suggestedSlug);
      setDuplicateAcknowledged(json.duplicates.length === 0);

      const selection: Record<number, boolean> = {};
      for (const id of json.amenityMatch.matchedIds) {
        selection[id] = true;
      }
      setAmenitySelection(selection);

      toast.success('JSON validated. Review the details below before creating the draft.');
    } catch {
      toast.error('Unable to reach the server.');
    } finally {
      setValidating(false);
    }
  };

  const handleCreate = async () => {
    if (!result) {
      return;
    }

    if (result.duplicates.length > 0 && !duplicateAcknowledged) {
      toast.error('Acknowledge the possible duplicates before creating a draft.');
      return;
    }

    if (!name.trim()) {
      toast.error('A project name is required.');
      return;
    }

    setCreating(true);

    try {
      const amenityIds = Object.entries(amenitySelection)
        .filter(([, checked]) => checked)
        .map(([id]) => Number(id));

      const response = await fetch('/api/brochure-convert/create', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { ...result.data, name: name.trim(), developer: developer.trim() },
          amenityIds,
          slug: slug.trim(),
          reviewFlags: result.reviewFlags,
          source: result.source,
        }),
      });

      if (!response.ok) {
        toast.error(await readErrorMessage(response, 'Unable to create the draft project.'));
        return;
      }

      const json = (await response.json()) as CreatedProject;
      setCreated(json);
      toast.success('Draft project created.');
    } catch {
      toast.error('Unable to reach the server.');
    } finally {
      setCreating(false);
    }
  };

  if (created) {
    return (
      <div>
        <Banner type="success">
          Draft project created ({created.projectId}). It is not published — open it in the editor to review and
          complete it.
        </Banner>
        <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
          <a href={`/admin/collections/projects/${created.id}`}>
            <Button buttonStyle="primary">Open in Editor</Button>
          </a>
          <Button buttonStyle="secondary" onClick={reset}>
            Import Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label>
        Project JSON (from the RER Claude Skill)
        <textarea
          value={pastedJson}
          onChange={(event) => setPastedJson(event.target.value)}
          disabled={validating}
          rows={14}
          style={{ width: '100%', marginTop: 8, marginBottom: 16, fontFamily: 'monospace', fontSize: 13 }}
          placeholder="Paste the JSON object here..."
        />
      </label>

      <Button buttonStyle="primary" disabled={validating} onClick={handleValidate}>
        {validating ? 'Validating…' : 'Validate JSON'}
      </Button>

      {result ? (
        <div style={{ marginTop: 32 }}>
          <h3>Review Before Creating Draft</h3>

          {result.duplicates.length > 0 ? (
            <Banner type="error">
              <strong>Possible duplicate projects found:</strong>
              <ul>
                {result.duplicates.map((duplicate) => (
                  <li key={duplicate.id}>
                    {duplicate.name} — {duplicate.developer}
                    {duplicate.locality ? ` (${duplicate.locality})` : ''} — status: {duplicate.status} — matched on:{' '}
                    {duplicate.matchedOn.join(', ')}
                  </li>
                ))}
              </ul>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <input
                  type="checkbox"
                  checked={duplicateAcknowledged}
                  onChange={(event) => setDuplicateAcknowledged(event.target.checked)}
                />
                I&apos;ve reviewed these and want to create a new draft anyway.
              </label>
            </Banner>
          ) : null}

          {result.reviewFlags.length > 0 ? (
            <Banner type="info">
              <strong>Needs manual review after creation:</strong>
              <ul>
                {result.reviewFlags.map((flag) => (
                  <li key={flag}>{flag}</li>
                ))}
              </ul>
            </Banner>
          ) : null}

          <div style={{ display: 'grid', gap: 12, marginTop: 16, maxWidth: 480 }}>
            <label>
              Project Name
              <input type="text" value={name} onChange={(event) => setName(event.target.value)} style={{ width: '100%' }} />
            </label>
            <label>
              Developer / Builder
              <input
                type="text"
                value={developer}
                onChange={(event) => setDeveloper(event.target.value)}
                style={{ width: '100%' }}
              />
            </label>
            <label>
              Draft Slug
              <input type="text" value={slug} onChange={(event) => setSlug(event.target.value)} style={{ width: '100%' }} />
            </label>
          </div>

          {result.amenityMatch.matchedNames.length > 0 || result.amenityMatch.unmatched.length > 0 ? (
            <div style={{ marginTop: 16 }}>
              <h4>Amenities</h4>
              {result.amenityMatch.matchedIds.map((id, index) => (
                <label key={id} style={{ display: 'block' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(amenitySelection[id])}
                    onChange={(event) =>
                      setAmenitySelection((previous) => ({ ...previous, [id]: event.target.checked }))
                    }
                  />{' '}
                  {result.amenityMatch.matchedNames[index]}
                </label>
              ))}
              {result.amenityMatch.unmatched.length > 0 ? (
                <p style={{ color: 'var(--theme-elevation-500, #666)' }}>
                  Not matched to an existing Amenity (not added): {result.amenityMatch.unmatched.join(', ')}
                </p>
              ) : null}
            </div>
          ) : null}

          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <Button buttonStyle="primary" disabled={creating} onClick={handleCreate}>
              {creating ? 'Creating Draft…' : 'Create Draft Project'}
            </Button>
            <Button buttonStyle="secondary" disabled={creating} onClick={reset}>
              Start Over
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default BrochureConvertForm;
