type Props = { title: string; index: number; accent?: string };

export function PlaceholderVisual({ title, index, accent = "neutral" }: Props) {
  return (
    // TODO: ASSET_REPLACE — 用 Snake 的真实作品替换此统一占位视觉，建议比例 4:3。
    <div className={`placeholder-visual placeholder-${accent}`} aria-label={`${title}作品占位图`}>
      <span className="placeholder-grid" aria-hidden="true" />
      <span className="placeholder-index">0{index + 1}</span>
      <span className="placeholder-shape" aria-hidden="true" />
      <span className="placeholder-label">VISUAL PLACEHOLDER</span>
    </div>
  );
}
