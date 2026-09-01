-- AlterTable
ALTER TABLE "Team" ADD COLUMN "estDefense" BOOLEAN NOT NULL DEFAULT false;

-- Préserve la capacité 3v3 des équipes déjà complètes (3 membres) avant de
-- supprimer l'ancien flag Personnage.inTeam : la première équipe complète de
-- chaque joueur (par ordre de création) devient automatiquement son équipe
-- de défense, pour ne pas casser silencieusement leur accès au 3v3.
WITH equipes_completes AS (
  SELECT t.id, t."ownerId",
         ROW_NUMBER() OVER (PARTITION BY t."ownerId" ORDER BY t.id) AS rn
  FROM "Team" t
  WHERE (SELECT COUNT(*) FROM "TeamMembre" tm WHERE tm."teamId" = t.id) = 3
)
UPDATE "Team"
SET "estDefense" = true
WHERE id IN (SELECT id FROM equipes_completes WHERE rn = 1);

-- AlterTable
ALTER TABLE "Personnage" DROP COLUMN "inTeam";
