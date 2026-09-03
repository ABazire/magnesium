"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Enveloppe un contenu (typiquement une carte d'objet) dans un bouton qui le
 * démantèle contre de l'or, après confirmation. Utilisé pour les objets et
 * sorts non équipés dans l'inventaire — un clic ordinaire ne suffit pas à
 * détruire quelque chose de façon permanente.
 */
export default function DemantelerButton({
  action,
  confirmText,
  className,
  children,
}: {
  action: () => Promise<{ or: number }>;
  confirmText: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function demanteler() {
    if (enCours) return;
    if (!window.confirm(confirmText)) return;

    setEnCours(true);
    try {
      await action();
      router.refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Erreur inconnue");
      setEnCours(false);
    }
  }

  return (
    <button
      type="button"
      onClick={demanteler}
      disabled={enCours}
      className={className}
    >
      {children}
    </button>
  );
}
