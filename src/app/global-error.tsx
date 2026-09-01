"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          background: "#0f1a16",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 800, textTransform: "uppercase" }}>
          Un problème est survenu
        </h1>
        <p style={{ color: "#9db8b1", fontSize: 14, maxWidth: 420 }}>
          L’application a rencontré une erreur inattendue. Réessaie, ou
          recharge la page.
        </p>
        <button
          onClick={reset}
          style={{
            background: "#059669",
            color: "#0f1a16",
            fontWeight: 800,
            fontSize: 12,
            textTransform: "uppercase",
            border: "none",
            borderRadius: 999,
            padding: "10px 22px",
            cursor: "pointer",
          }}
        >
          Réessayer
        </button>
        {error.digest && (
          <p style={{ color: "#4d7266", fontSize: 11 }}>
            Référence : {error.digest}
          </p>
        )}
      </body>
    </html>
  );
}
