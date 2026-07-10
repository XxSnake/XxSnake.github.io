import { profile } from "../data/content";

export function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-meta hero-enter delay-1">
        <span>PERSONAL DIGITAL HOME</span>
        <span>EST. 2026</span>
      </div>
      <div className="hero-grid">
        <div className="hero-copy">
          <p className="hero-positioning hero-enter delay-2">{profile.positioning}</p>
          <h1 className="hero-enter delay-3">你好，<br />我是 <em>{profile.name}</em>。</h1>
          <p className="hero-headline hero-enter delay-4">{profile.headline}</p>
          <div className="hero-intro hero-enter delay-5">
            {profile.introduction.map((line) => <p key={line}>{line}</p>)}
          </div>
          <div className="hero-actions hero-enter delay-5">
            <a className="button button-primary" href="#projects">查看我的项目 <span>↘</span></a>
            <a className="button button-secondary" href="#research">了解我在研究什么 <span>↓</span></a>
          </div>
        </div>
        <div className="hero-visual hero-enter delay-4" aria-hidden="true">
          <div className="blueprint-box">
            <span className="axis axis-x" /><span className="axis axis-y" />
            <div className="orbit orbit-one" /><div className="orbit orbit-two" />
            <div className="core-mark">S</div>
            <span className="coordinate coord-a">X / 24.08</span>
            <span className="coordinate coord-b">Y / 06.17</span>
            <span className="coordinate coord-c">COGNITION<br />IN PROGRESS</span>
          </div>
        </div>
      </div>
      <blockquote className="hero-belief hero-enter delay-5">
        <span>“</span>{profile.belief}
      </blockquote>
    </section>
  );
}
