import { socialLinks } from "../data/content";

export function Contact() {
  return (
    <footer className="contact" id="contact">
      <div className="contact-top">
        <span>06 / CONTACT</span>
        <p>如果你也在思考工程、AI 与视觉表达，欢迎保持关注。</p>
      </div>
      <h2>让实践成为<br />下一次思考的起点。</h2>
      {socialLinks.length > 0 ? (
        <div className="social-links">{socialLinks.map((link) => <a key={link.label} href={link.href}>{link.label} ↗</a>)}</div>
      ) : (
        // TODO: CONTACT_REPLACE — 待 Snake 提供公开社交账号后，在 src/data/content.ts 的 socialLinks 中补充。
        <p className="contact-placeholder">公开联系方式将在后续补充。</p>
      )}
      <nav className="quiz-entries" aria-label="工程检测刷题入口">
        <div className="quiz-entries-heading"><span>练习与巩固</span><h3>工程检测随机题库</h3></div>
        <div className="quiz-entries-grid">
          <a href="/steel-quiz/"><strong>钢结构检测</strong><span>规范重点条文 · 随机练习</span><b aria-hidden="true">↗</b></a>
          <a href="/energy-quiz/"><strong>建筑节能检测</strong><span>规范重点条文 · 随机练习</span><b aria-hidden="true">↗</b></a>
        </div>
      </nav>
      <div className="footer-line"><strong>SNAKE</strong><span>工程 × AI × 视觉</span><span>© 2026</span><a href="#top">回到顶部 ↑</a></div>
    </footer>
  );
}

