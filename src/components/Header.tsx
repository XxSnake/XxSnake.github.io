import { useEffect, useState } from "react";

const links = [
  ["首页", "top"],
  ["关于", "about"],
  ["项目", "projects"],
  ["作品", "works"],
  ["联系", "contact"],
];

type Props = { theme: "light" | "dark"; onToggleTheme: () => void };

export function Header({ theme, onToggleTheme }: Props) {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  return (
    <header className="site-header">
      <div className="reading-progress" style={{ width: `${progress}%` }} />
      <a className="brand" href="#top" aria-label="返回首页">
        <strong>SNAKE</strong><span>工程 × AI × 视觉</span>
      </a>
      <nav className={open ? "nav-links is-open" : "nav-links"} aria-label="主导航">
        {links.map(([label, id]) => (
          <a key={id} href={`#${id}`} onClick={() => setOpen(false)}>{label}</a>
        ))}
      </nav>
      <div className="header-actions">
        <button className="theme-toggle" onClick={onToggleTheme} aria-label={`切换到${theme === "light" ? "深色" : "浅色"}模式`}>
          <span aria-hidden="true">{theme === "light" ? "◐" : "◑"}</span>
          <span className="theme-text">{theme === "light" ? "深色" : "浅色"}</span>
        </button>
        <button className="menu-toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="打开或关闭导航">
          <span /><span />
        </button>
      </div>
    </header>
  );
}
