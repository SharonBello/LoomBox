import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Language } from '@/types'
import { useAppStore } from '@/store/appStore'
import styles from './LandingPage.module.scss'

const LandingPage = () => {
  return (
    <div className={styles.page}>
      <LandingNav />
      <HeroSection />
      <FeaturesSection />
      <BookStylesSection />
      <CtaSection />
      <LandingFooter />
    </div>
  )
}

// ── Navbar ────────────────────────────────────────────────

const LandingNav = () => {
  const { t, i18n } = useTranslation()
  const { language, setLanguage } = useAppStore()

  const handleLangToggle = () => {
    const next: Language = language === 'en' ? 'he' : 'en'
    i18n.changeLanguage(next)
    setLanguage(next)
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.navInner}>
        <Link to="/" className={styles.navBrand}>
          <span className={styles.brandStar}>✦</span>
          <span className={styles.brandName}>{t('brand.name')}</span>
        </Link>
        <div className={styles.navActions}>
          <button className={styles.langSwitcher} onClick={handleLangToggle}>
            <span>{language === 'en' ? '🇮🇱' : '🇬🇧'}</span>
            <span>{language === 'en' ? 'עברית' : 'English'}</span>
          </button>
          <Link to="/auth" className={styles.navSignIn}>{t('auth.signIn')}</Link>
          <Link to="/auth" className={styles.navCta}>{t('landing.hero.cta')}</Link>
        </div>
      </div>
    </nav>
  )
}

// ── Hero ─────────────────────────────────────────────────

const HeroSection = () => {
  const { t } = useTranslation()
  const headline = t('landing.hero.headline')

  return (
    <section className={styles.hero}>
      <div className={styles.blob1} aria-hidden="true" />
      <div className={styles.blob2} aria-hidden="true" />
      <div className={styles.blob3} aria-hidden="true" />

      <div className={styles.heroInner}>
        <div className={styles.heroBadge}>
          <span className={styles.badgeDot} />
          {t('landing.hero.badge')}
        </div>

        <h1 className={styles.heroTitle}>
          {headline.split('\n').map((line, i) => (
            <span key={i} className={styles.heroTitleLine} style={{ animationDelay: `${i * 120}ms` }}>
              {i === 1 ? <em>{line}</em> : line}
            </span>
          ))}
        </h1>

        <p className={styles.heroSub}>{t('landing.hero.subheadline')}</p>

        <div className={styles.heroActions}>
          <Link to="/auth" className={styles.heroCta}>
            {t('landing.hero.cta')}
            <span className={styles.ctaArrow}>→</span>
          </Link>
          <a href="#how" className={styles.heroSecondary}>
            {t('landing.hero.ctaSecondary')}
          </a>
        </div>

        <div className={styles.statsRow}>
          {(['free','styles','languages','memories'] as const).map(k => (
            <div key={k} className={styles.stat}>
              <span className={styles.statNum}>
                {k === 'free' ? '100%' : k === 'styles' ? '3' : k === 'languages' ? '2' : '∞'}
              </span>
              <span className={styles.statLabel}>{t(`landing.stats.${k}`)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hero card mock */}
      <div className={styles.heroCard} aria-hidden="true">
        <div className={styles.cardHeader}>
          <span className={styles.cardDot} /><span className={styles.cardDot} /><span className={styles.cardDot} />
        </div>
        <div className={styles.cardTitle}>Grandma Rose's Kitchen</div>
        <div className={styles.cardMeta}>WARSAW, 1952</div>
        <div className={styles.cardImg} />
        <div className={styles.cardText}>
          <div className={styles.cardLine} style={{ width: '90%' }} />
          <div className={styles.cardLine} style={{ width: '75%' }} />
          <div className={styles.cardLine} style={{ width: '82%' }} />
        </div>
        <div className={styles.cardTags}>
          <span className={styles.cardTag}>Family Recipe</span>
          <span className={styles.cardTag}>Europe</span>
          <span className={styles.cardTag}>1950s</span>
        </div>
      </div>
    </section>
  )
}

// ── Features ─────────────────────────────────────────────

const FEATURE_KEYS = ['ai', 'tree', 'images', 'book'] as const
const FEATURE_META = {
  ai:     { icon: '✍️', color: '#c9954a', bg: '#f8f0e0' },
  tree:   { icon: '🌳', color: '#4caf82', bg: '#e8f5ee' },
  images: { icon: '🖼️', color: '#7c6fe0', bg: '#f0eefa' },
  book:   { icon: '📖', color: '#e05c5c', bg: '#fdeaea' },
}

const FeaturesSection = () => {
  const { t } = useTranslation()
  return (
    <section className={styles.features} id="how">
      <div className={styles.sectionInner}>
        <div className={styles.sectionLabel}>{t('landing.features.label')}</div>
        <h2 className={styles.sectionTitle}>{t('landing.features.title')}</h2>
        <div className={styles.featureGrid}>
          {FEATURE_KEYS.map((key, i) => (
            <div key={key} className={styles.featureCard} style={{ animationDelay: `${i * 80}ms` }}>
              <div className={styles.featureIconWrap} style={{ background: FEATURE_META[key].bg }}>
                <span className={styles.featureEmoji}>{FEATURE_META[key].icon}</span>
              </div>
              <h3 className={styles.featureTitle} style={{ color: FEATURE_META[key].color }}>
                {t(`landing.features.${key}.title`)}
              </h3>
              <p className={styles.featureDesc}>{t(`landing.features.${key}.desc`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Book Styles ───────────────────────────────────────────

const STYLE_KEYS = ['heritage', 'canvas', 'scrapbook'] as const
const STYLE_META = {
  heritage:  { accent: '#9e7030', bg: 'linear-gradient(135deg,#f8f0e0,#ede3cf)', ff: "'Cormorant Garamond',serif",  lines: ['Chapter I','The Beginning','· · · · ·'] },
  canvas:    { accent: '#1a1929', bg: 'linear-gradient(135deg,#f4f4f6,#e8e8ee)', ff: "'Plus Jakarta Sans',sans-serif", lines: ['Story One','A New Chapter','— 2024 —'] },
  scrapbook: { accent: '#c9954a', bg: 'linear-gradient(135deg,#fdf6e3,#fcebd0)', ff: "'Caveat',cursive",             lines: ['Our Family','Memories & Love','♡ ♡ ♡'] },
}

const BookStylesSection = () => {
  const { t } = useTranslation()
  return (
    <section className={styles.bookStyles}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionLabel}>{t('landing.bookStyles.label')}</div>
        <h2 className={styles.sectionTitle}>{t('landing.bookStyles.title')}</h2>
        <div className={styles.styleGrid}>
          {STYLE_KEYS.map((key, i) => {
            const m = STYLE_META[key]
            return (
              <div key={key} className={styles.styleCard} style={{ animationDelay: `${i * 100}ms` }}>
                <div className={styles.bookPreview} style={{ background: m.bg }}>
                  <div className={styles.bookSpine} style={{ background: m.accent }} />
                  <div className={styles.bookContent}>
                    {m.lines.map((line, j) => (
                      <span key={j} className={styles.bookLine} style={{
                        fontFamily: m.ff,
                        fontSize: j === 0 ? '10px' : j === 1 ? '14px' : '11px',
                        fontWeight: j === 1 ? 600 : 400,
                        color: m.accent,
                        opacity: j === 2 ? 0.5 : 1,
                        letterSpacing: j === 2 ? '0.1em' : '-0.01em',
                      }}>
                        {line}
                      </span>
                    ))}
                  </div>
                </div>
                <div className={styles.styleInfo}>
                  <h3 className={styles.styleName}>{t(`landing.bookStyles.${key}.name`)}</h3>
                  <p className={styles.styleDesc}>{t(`landing.bookStyles.${key}.desc`)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ── CTA ───────────────────────────────────────────────────

const CtaSection = () => {
  const { t } = useTranslation()
  return (
    <section className={styles.cta}>
      <div className={styles.ctaBg} aria-hidden="true" />
      <div className={styles.ctaInner}>
        <h2 className={styles.ctaTitle}>
          {t('landing.cta.title')}<br /><em>{t('landing.cta.titleEm')}</em>
        </h2>
        <p className={styles.ctaSub}>{t('landing.cta.sub')}</p>
        <Link to="/auth" className={styles.ctaButton}>{t('landing.cta.button')}</Link>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────

const LandingFooter = () => {
  const { t } = useTranslation()
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          <span className={styles.brandStar}>✦</span>
          <span className={styles.brandName}>{t('brand.name')}</span>
        </div>
        <p className={styles.footerTagline}>{t('landing.footer.tagline')}</p>
      </div>
    </footer>
  )
}

export default LandingPage
