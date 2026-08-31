import Link from "next/link";

import styles from "./Pagination.module.css";

type PaginationProps = {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
};

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  const delta = 1;
  const pages: (number | "ellipsis")[] = [1];

  const gauche = Math.max(2, current - delta);
  const droite = Math.min(total - 1, current + delta);

  if (gauche > 2) pages.push("ellipsis");
  for (let i = gauche; i <= droite; i++) pages.push(i);
  if (droite < total - 1) pages.push("ellipsis");
  if (total > 1) pages.push(total);

  return pages;
}

export default function Pagination({
  page,
  totalPages,
  buildHref,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(page, totalPages);

  return (
    <nav className={styles.pagination} aria-label="Pagination">
      {page > 1 ? (
        <Link
          href={buildHref(page - 1)}
          className={styles.pageNav}
          aria-label="Page précédente"
        >
          ‹
        </Link>
      ) : (
        <span
          className={`${styles.pageNav} ${styles.pageNavDisabled}`}
          aria-hidden="true"
        >
          ‹
        </span>
      )}

      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`ellipsis-${i}`} className={styles.ellipsis}>
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(p)}
            className={p === page ? styles.pageActive : styles.pageLink}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link
          href={buildHref(page + 1)}
          className={styles.pageNav}
          aria-label="Page suivante"
        >
          ›
        </Link>
      ) : (
        <span
          className={`${styles.pageNav} ${styles.pageNavDisabled}`}
          aria-hidden="true"
        >
          ›
        </span>
      )}
    </nav>
  );
}
