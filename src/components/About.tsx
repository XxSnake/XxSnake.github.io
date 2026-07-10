import { identities } from "../data/content";
import { SectionHeader } from "./SectionHeader";

export function About() {
  return (
    <section className="section reveal" id="about">
      <SectionHeader number="01" label="ABOUT" title="三个身份，一条路径" intro="工程给我尺度，AI 给我杠杆，视觉帮助我把思考说清楚。" />
      <div className="identity-grid">
        {identities.map((item, index) => (
          <article className="identity-card" key={item.title}>
            <div className="card-top"><span>{item.number}</span><span>{item.label}</span></div>
            <div className={`identity-symbol symbol-${index + 1}`} aria-hidden="true"><span /></div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
      <div className="equation" aria-label="工程乘以人工智能乘以视觉">
        <strong>工程</strong><span>×</span><strong>AI</strong><span>×</span><strong>视觉</strong>
      </div>
    </section>
  );
}
