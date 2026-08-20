import packageJson from "../../package.json";
import styles from "./VersionTag.module.css";

export default function VersionTag() {
  return <span className={styles.tag}>v{packageJson.version}</span>;
}
