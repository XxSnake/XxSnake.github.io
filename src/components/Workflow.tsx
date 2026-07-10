import { workflow } from "../data/content";
import { SectionHeader } from "./SectionHeader";

export function Workflow() {
  return (
    <section className="section reveal" id="system">
      <SectionHeader number="05" label="SYSTEM" title="工具与工作方式" intro="不同工具承担不同角色，人的判断始终位于流程中心。" />
      <div className="workflow">
        {workflow.map((step, index) => (
          <div className="workflow-step" key={step.title}>
            <span className="workflow-index">{String(index + 1).padStart(2, "0")}</span>
            <div><h3>{step.title}</h3><p>{step.role}</p></div>
            {index < workflow.length - 1 && <span className="workflow-arrow" aria-hidden="true">↓</span>}
          </div>
        ))}
      </div>
      <div className="role-split">
        <div><span>HUMAN</span><h3>人负责</h3><p>判断、选择与最终决策</p></div>
        <div><span>AI</span><h3>AI 负责</h3><p>辅助分析、执行与整理</p></div>
      </div>
    </section>
  );
}
