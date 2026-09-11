import BrochureConvertForm from './BrochureConvertForm';

export function BrochureConvertView() {
  return (
    <div style={{ padding: '32px 24px', maxWidth: 860 }}>
      <h1 style={{ marginBottom: 8 }}>Brochure Convert</h1>
      <p style={{ marginBottom: 24, color: 'var(--theme-elevation-500, #666)' }}>
        Paste the project JSON produced by the RER Claude Skill to validate it against this site&apos;s schema and
        create a draft project. The result is always created as an unpublished draft — nothing is ever published
        automatically. Review and complete the draft in the normal project editor before publishing.
      </p>
      <BrochureConvertForm />
    </div>
  );
}
