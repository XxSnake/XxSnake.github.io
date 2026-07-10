import { researchAreas } from "../data/content";
import { SectionHeader } from "./SectionHeader";

export function ResearchAreas() {
  return (
    <section className="section reveal" id="research">
      <SectionHeader number="02" label="WHAT I DO" title="我在做什么" intro="四条长期研究线，围绕真实工作、知识积累与表达展开。" />
      <div className="research-list">
        {researchAreas.map((area) => (
          <article className="research-row" key={area.title}>
            <span className="research-number">{area.number}</span>
            <div className="research-main"><h3>{area.title}</h3><p>{area.summary}</p>{area.note && <aside>{area.note}</aside>}</div>
            <ul>{area.items.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
        ))}
      </div>
    </section>
  );
}
