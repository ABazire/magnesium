"use client";

import { useEffect, useState } from "react";
import PixelSprite from "./PixelSprite";
import type { Animation, Animations } from "./animations";

export function AnimatedSprite({
  animations,
  etat,
  palette,
  size = 64,
  flip = false,
}: {
  animations: Animations;
  etat: string;
  palette: Record<string, string>;
  size?: number;
  flip?: boolean;
}) {
  const [etatRendu, setEtatRendu] = useState(etat);
  const [frame, setFrame] = useState(0);

  // Ajustement d'état pendant le rendu (pattern React) plutôt que dans un effet.
  if (etat !== etatRendu) {
    setEtatRendu(etat);
    setFrame(0);
  }

  const anim = animations[etat] ?? animations.idle;

  // L'appelant construit souvent les animations à la volée : on ne dépend que
  // de valeurs primitives, sinon l'intervalle serait relancé à chaque rendu et
  // la frame n'avancerait jamais.
  const nbFrames = anim?.frames.length ?? 0;
  const fps = anim?.fps ?? 1;
  const loop = anim?.loop ?? false;

  useEffect(() => {
    if (nbFrames <= 1) return;

    const timer = setInterval(() => {
      setFrame((f) => {
        const suivant = f + 1;
        if (suivant >= nbFrames) return loop ? 0 : f;
        return suivant;
      });
    }, 1000 / fps);

    return () => clearInterval(timer);
  }, [etat, nbFrames, fps, loop]);

  const grid = anim?.frames[Math.min(frame, nbFrames - 1)];
  if (!grid) return null;

  return (
    <div style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <PixelSprite grid={grid} palette={palette} size={size} />
    </div>
  );
}

export function EffetSprite({
  frames,
  palette,
  size = 64,
  fps = 12,
}: {
  frames: string[][];
  palette: Record<string, string>;
  size?: number;
  fps?: number;
}) {
  const animation: Animation = { frames, fps, loop: false };

  return (
    <AnimatedSprite
      animations={{ idle: animation }}
      etat="idle"
      palette={palette}
      size={size}
    />
  );
}
