import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { IconButton, Avatar, Menu, MenuItem, Tooltip, Divider } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import LogoutIcon from '@mui/icons-material/Logout'
import SettingsIcon from '@mui/icons-material/SettingsOutlined'
import { useAppStore } from '@/store/appStore'
import type { Language } from '@/types'
import styles from './Navbar.module.scss'

const Navbar = () => {
  const { t, i18n } = useTranslation()
  const { user, language, setLanguage, toggleSidebar } = useAppStore()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleLangToggle = () => {
    const next: Language = language === 'en' ? 'he' : 'en'
    i18n.changeLanguage(next)
    setLanguage(next)
  }

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget)

  const handleMenuClose = () => setAnchorEl(null)

  const initials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <header className={styles.navbar}>
      {/* Left side */}
      <div className={styles.left}>
        <IconButton
          onClick={toggleSidebar}
          className={styles.menuBtn}
          aria-label="Toggle navigation"
          size="small"
        >
          <MenuIcon />
        </IconButton>

        <Link to="/" className={styles.brand}>
          <span className={styles.brandIcon}>✦</span>
          <span className={styles.brandName}>{t('brand.name')}</span>
        </Link>
      </div>

      {/* Right side */}
      <div className={styles.right}>
        {/* Language switcher */}
        <button
          className={styles.langBtn}
          onClick={handleLangToggle}
          aria-label="Switch language"
        >
          <span className={styles.langFlag}>
            {language === 'en' ? '🇮🇱' : '🇬🇧'}
          </span>
          <span className={styles.langLabel}>
            {language === 'en' ? 'עב' : 'EN'}
          </span>
        </button>

        {/* User menu */}
        {user && (
          <>
            <Tooltip title={user.displayName ?? user.email ?? ''}>
              <IconButton
                onClick={handleMenuOpen}
                className={styles.avatarBtn}
                size="small"
              >
                <Avatar
                  src={user.photoURL ?? undefined}
                  className={styles.avatar}
                  sx={{ width: 34, height: 34 }}
                >
                  {initials}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{
                paper: {
                  elevation: 4,
                  sx: { mt: 1, minWidth: 180, borderRadius: '14px', border: '1px solid #e8e4dc' },
                },
              }}
            >
              <div className={styles.menuHeader}>
                <span className={styles.menuName}>{user.displayName ?? 'My Account'}</span>
                <span className={styles.menuEmail}>{user.email}</span>
              </div>
              <Divider sx={{ my: 0.5 }} />
              <MenuItem onClick={handleMenuClose} component={Link} to="/settings">
                <SettingsIcon fontSize="small" sx={{ mr: 1.5, opacity: 0.6 }} />
                {t('nav.settings')}
              </MenuItem>
              <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
                <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
                {t('auth.signOut')}
              </MenuItem>
            </Menu>
          </>
        )}
      </div>
    </header>
  )
}

export default Navbar
