import type { ArtworkStyle } from "@/data/catalog";

const labels: Record<ArtworkStyle, string> = {
  valorant: "V",
  arena: "ARENA",
  genshin: "GI",
  hades: "HADES",
  stardew: "STARDEW",
  cyberpunk: "2077",
};

export function GameArt({ style, compact = false }: { style: ArtworkStyle; compact?: boolean }) {
  return (
    <div className={`game-art art-${style}${compact ? " game-art-compact" : ""}`} aria-hidden="true">
      <span className="art-light" />
      <span className="art-shape art-shape-one" />
      <span className="art-shape art-shape-two" />
      <span className="art-mark">{labels[style]}</span>
      <span className="art-grain" />
    </div>
  );
}
