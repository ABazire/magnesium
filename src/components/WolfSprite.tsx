"use client";

import styles from "./WolfSprite.module.css";

type Anim = "idle" | "attack";

const CONFIG: Record<Anim, { src: string; frames: number; fps: number }> = {
  idle: { src: "/sprites/wolf/Idle.png", frames: 8, fps: 8 },
  attack: { src: "/sprites/wolf/Attack_1.png", frames: 6, fps: 12 },
};

export default function WolfSprite({
  anim,
  flip = false,
}: {
  anim: Anim;
  flip?: boolean;
}) {
  const { src, frames, fps } = CONFIG[anim];
  const duree = frames / fps;

  return (
    <div
      className={styles.frame}
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
    >
      <div
        className={styles.sheet}
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: `${frames * 100}% 100%`,
          animation: `${styles.play} ${duree}s steps(${frames}) infinite`,
        }}
      />
    </div>
  );
}
