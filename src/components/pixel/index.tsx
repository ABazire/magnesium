import PixelSprite from "./PixelSprite";
import * as S from "./sprites";

export function CoinIcon({ size = 24 }: { size?: number }) {
  return (
    <PixelSprite grid={S.SPRITE_COIN} palette={S.PALETTE_COIN} size={size} />
  );
}
export function ChestIcon({ size = 48 }: { size?: number }) {
  return (
    <PixelSprite grid={S.SPRITE_CHEST} palette={S.PALETTE_CHEST} size={size} />
  );
}
export function SwordIcon({ size = 20 }: { size?: number }) {
  return (
    <PixelSprite grid={S.SPRITE_SWORD} palette={S.PALETTE_SWORD} size={size} />
  );
}
export function ArmorIcon({ size = 20 }: { size?: number }) {
  return (
    <PixelSprite grid={S.SPRITE_ARMOR} palette={S.PALETTE_ARMOR} size={size} />
  );
}
export function BootsIcon({ size = 20 }: { size?: number }) {
  return (
    <PixelSprite grid={S.SPRITE_BOOTS} palette={S.PALETTE_BOOTS} size={size} />
  );
}
export function AmuletIcon({ size = 20 }: { size?: number }) {
  return (
    <PixelSprite
      grid={S.SPRITE_AMULET}
      palette={S.PALETTE_AMULET}
      size={size}
    />
  );
}
export function HeartIcon({ size = 20 }: { size?: number }) {
  return (
    <PixelSprite grid={S.SPRITE_HEART} palette={S.PALETTE_HEART} size={size} />
  );
}
export function WolfIcon({ size = 48 }: { size?: number }) {
  return (
    <PixelSprite grid={S.SPRITE_WOLF} palette={S.PALETTE_WOLF} size={size} />
  );
}
export function BearIcon({ size = 48 }: { size?: number }) {
  return (
    <PixelSprite grid={S.SPRITE_BEAR} palette={S.PALETTE_BEAR} size={size} />
  );
}
export function PersonnageIcon({
  size = 48,
  couleur = "#10b981",
}: {
  size?: number;
  couleur?: string;
}) {
  return (
    <PixelSprite
      grid={S.spritePersonnage()}
      palette={S.palettePersonnage(couleur)}
      size={size}
    />
  );
}
