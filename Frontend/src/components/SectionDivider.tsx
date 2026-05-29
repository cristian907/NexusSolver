export function SectionDivider({ label }: { label: string }) {
  return (
    <div className="section-divider">
      <div className="section-divider-line" />
      <div className="section-divider-label">{label}</div>
      <div className="section-divider-line" />
    </div>
  );
}
