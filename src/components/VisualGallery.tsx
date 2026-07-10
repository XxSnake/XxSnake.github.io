import { useState } from "react";
import { insights, works } from "../data/content";
import { PlaceholderVisual } from "./PlaceholderVisual";
import { SectionHeader } from "./SectionHeader";

export function VisualGallery() {
  const [openWork, setOpenWork] = useState<number | null>(null);
  const [insightIndex, setInsightIndex] = useState(0);

  const nextInsight = () => {
    if (insights.length < 2) return;
    let next = insightIndex;
    while (next === insightIndex) next = Math.floor(Math.random() * insights.length);
    setInsightIndex(next);
  };

  return (
    <section className="section reveal" id="works">
      <SectionHeader number="04" label="VISUAL NOTES" title="认知与视觉作品" intro="不是传统博客列表，而是一面持续生长的视觉观点墙。" />
      <div className="works-grid">
        {works.map((work, index) => (
          <article className="work-card" key={work.title}>
            <PlaceholderVisual title={work.title} index={index} accent={work.accent} />
            <div className="work-copy">
              <span>VISUAL NOTE / 0{index + 1}</span>
              <h3>{work.title}</h3>
              <p>{work.viewpoint}</p>
              <button onClick={() => setOpenWork(openWork === index ? null : index)} aria-expanded={openWork === index}>
                {openWork === index ? "收起说明" : "展开说明"}<span>{openWork === index ? "−" : "+"}</span>
              </button>
              {openWork === index && <div className="work-description">{work.description}</div>}
            </div>
          </article>
        ))}
      </div>
      <div className="insight-panel">
        <div className="insight-meta"><span>RANDOM INSIGHT</span><span>{String(insightIndex + 1).padStart(2, "0")} / {String(insights.length).padStart(2, "0")}</span></div>
        <p key={insightIndex}>“{insights[insightIndex]}”</p>
        <button className="button button-primary" onClick={nextInsight}>换一个角度看世界 <span>↻</span></button>
      </div>
    </section>
  );
}
