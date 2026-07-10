type Props = { number: string; label: string; title: string; intro?: string };

export function SectionHeader({ number, label, title, intro }: Props) {
  return (
    <header className="section-heading">
      <div className="section-kicker"><span>{number}</span><span>/</span><span>{label}</span></div>
      <div className="section-title-row">
        <h2>{title}</h2>
        {intro && <p>{intro}</p>}
      </div>
    </header>
  );
}
