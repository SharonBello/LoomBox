import styles from './PageLoader.module.scss'

const PageLoader = () => (
  <div className={styles.wrapper} role="status" aria-label="Loading">
    <div className={styles.icon}>✦</div>
    <div className={styles.bar}>
      <div className={styles.barFill} />
    </div>
  </div>
)

export default PageLoader
