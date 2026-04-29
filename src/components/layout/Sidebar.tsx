import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Tooltip } from '@mui/material'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined'
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import LocalDiningOutlinedIcon from '@mui/icons-material/LocalDiningOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import { useAppStore } from '@/store/appStore'
import styles from './Sidebar.module.scss'

const NAV_ITEMS = [
  { to: '/dashboard',   icon: DashboardOutlinedIcon,    key: 'dashboard'  },
  { to: '/stories',     icon: AutoStoriesOutlinedIcon,  key: 'stories'    },
  { to: '/family-tree', icon: AccountTreeOutlinedIcon,  key: 'familyTree' },
  { to: '/recipes',     icon: LocalDiningOutlinedIcon,  key: 'recipes'    },
  { to: '/book',        icon: MenuBookOutlinedIcon,      key: 'myBook'     },
] as const

const BOTTOM_ITEMS = [
  { to: '/settings', icon: SettingsOutlinedIcon, key: 'settings' },
] as const

interface NavItemProps {
  to:       string
  icon:     React.ElementType
  label:    string
  collapsed: boolean
}

const NavItem = ({ to, icon: Icon, label, collapsed }: NavItemProps) => (
  <Tooltip title={collapsed ? label : ''} placement="right">
    <NavLink
      to={to}
      className={({ isActive }) =>
        [styles.navItem, isActive ? styles.active : ''].filter(Boolean).join(' ')
      }
    >
      <Icon className={styles.navIcon} />
      {!collapsed && <span className={styles.navLabel}>{label}</span>}
    </NavLink>
  </Tooltip>
)

const Sidebar = () => {
  const { t }           = useTranslation()
  const { sidebarOpen } = useAppStore()
  const collapsed       = !sidebarOpen

  return (
    <aside
      className={styles.sidebar}
      data-collapsed={collapsed ? 'true' : 'false'}
      aria-label="Main navigation"
    >
      {/* Book progress teaser */}
      {!collapsed && (
        <div className={styles.progressCard}>
          <span className={styles.progressLabel}>Book progress</span>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: '35%' }} />
          </div>
          <span className={styles.progressPct}>35%</span>
        </div>
      )}

      {/* Main nav */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ to, icon, key }) => (
          <NavItem
            key={key}
            to={to}
            icon={icon}
            label={t(`nav.${key}`)}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* Bottom nav */}
      <nav className={styles.bottomNav}>
        {BOTTOM_ITEMS.map(({ to, icon, key }) => (
          <NavItem
            key={key}
            to={to}
            icon={icon}
            label={t(`nav.${key}`)}
            collapsed={collapsed}
          />
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
