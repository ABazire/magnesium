import Link from "next/link";

import styles from "./FilterBar.module.css";

export type FilterField = {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
};

export default function FilterBar({
  action,
  fields,
  search,
}: {
  action: string;
  fields: FilterField[];
  search?: { name: string; value?: string; placeholder?: string };
}) {
  return (
    <form method="get" action={action} className={styles.bar}>
      {fields.map((f) => (
        <label key={f.name} className={styles.field}>
          <span className={styles.fieldLabel}>{f.label}</span>
          <select
            name={f.name}
            defaultValue={f.value}
            className={styles.select}
          >
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ))}

      {search && (
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Nom</span>
          <input
            type="text"
            name={search.name}
            defaultValue={search.value}
            placeholder={search.placeholder ?? "Rechercher..."}
            className={styles.searchInput}
          />
        </label>
      )}

      <button type="submit" className={styles.applyButton}>
        Filtrer
      </button>
      <Link href={action} className={styles.reset}>
        Réinitialiser
      </Link>
    </form>
  );
}
