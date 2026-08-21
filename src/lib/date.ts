// src/lib/date.ts
export function debutDeJournee(): Date {
  const maintenant = new Date();
  return new Date(
    Date.UTC(
      maintenant.getUTCFullYear(),
      maintenant.getUTCMonth(),
      maintenant.getUTCDate(),
    ),
  );
}
