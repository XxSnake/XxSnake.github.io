import { useMemo, useState } from "react";
import { projects, type ProjectCategory } from "../data/content";
import { SectionHeader } from "./SectionHeader";

const filters: Array<"全部" | ProjectCategory> = ["全部", "工程", "AI", "视觉", "知识系统"];

export function Projects() {
  const [active, setActive] = useState<(typeof filters)[number]>("全部");
  const filtered = useMemo(() => active === "全部" ? projects : projects.filter((project) => project.categories.includes(active)), [active]);

  return (
    <section className="section reveal" id="projects">
      <SectionHeader number="03" label="PROJECTS" title="精选项目" intro="从工程现场到视觉系统，关注能被验证、沉淀和复用的实践。" />
      <div className="filters" role="group" aria-label="项目分类筛选">
        {filters.map((filter) => <button className={active === filter ? "active" : ""} aria-pressed={active === filter} onClick={() => setActive(filter)} key={filter}>{filter}</button>)}
      </div>
      <div className="projects-grid" aria-live="polite">
        {filtered.map((project) => (
          <article className="project-card" key={project.number}>
            <div className="project-head"><span>{project.number}</span><div>{project.categories.map((category) => <span key={category}>{category}</span>)}</div></div>
            <h3>{project.title}</h3>
            <p>{project.description}</p>
            {project.stats && <div className="project-stats">{project.stats.map((stat) => <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div>}
            <div className="project-tags">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            {project.note && <aside>{project.note}</aside>}
            {project.href && <a className="project-link" href={project.href} aria-label={`打开${project.title}`}>打开工具 <span aria-hidden="true">↗</span></a>}
          </article>
        ))}
      </div>
    </section>
  );
}
