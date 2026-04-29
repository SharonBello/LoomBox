import { useEffect, type ReactNode } from 'react'
import { useAppStore } from '@/store/appStore'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import styles from './AppShell.module.scss'

interface AppShellProps {
  children: ReactNode
}

const AppShell = ({ children }: AppShellProps) => {
  const { sidebarOpen, direction } = useAppStore()

  useEffect(() => {
    document.documentElement.dir  = direction
    document.documentElement.lang = direction === 'rtl' ? 'he' : 'en'
  }, [direction])

  return (
    <div
      className={styles.shell}
      data-sidebar={sidebarOpen ? 'open' : 'closed'}
      dir={direction}
    >
      <Navbar />
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  )
}

export default AppShell
