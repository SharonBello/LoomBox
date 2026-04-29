import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from './LandingPage.module.scss'

// ============================================================
// LandingPage
// ============================================================

const LandingPage = () => {
  const { t } = useTranslation()

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

// ── Navbar ───────────────────────────────────────────────

const LandingNav = () => {
  const { t } = useTranslation()
  return (
    <nav className={styles.nav}>
      <div className={styles.navInner}>
        <Link to="/" className={styles.navBrand}>
          <span className={styles.brandStar}>✦</span>
          <span className={styles.brandName}>{t('brand.name')}</span>
        </Link>
        <div className={styles.navActions}>
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
      {/* Decorative blobs */}
      <div className={styles.blob1} aria-hidden="true" />
      <div className={styles.blob2} aria-hidden="true" />
      <div className={styles.blob3} aria-hidden="true" />

      <div className={styles.heroInner}>
        <div className={styles.heroBadge}>
          <span className={styles.badgeDot} />
          Free forever · No credit card needed
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

        {/* Stats row */}
        <div className={styles.statsRow}>
          {[
            { n: '100%', label: 'Free' },
            { n: '3',    label: 'Book styles' },
            { n: '2',    label: 'Languages' },
            { n: '∞',    label: 'Memories' },
          ].map(({ n, label }) => (
            <div key={label} className={styles.stat}>
              <span className={styles.statNum}>{n}</span>
              <span className={styles.statLabel}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hero image card mock */}
      <div className={styles.heroCard} aria-hidden="true">
        <div className={styles.cardHeader}>
          <span className={styles.cardDot} />
          <span className={styles.cardDot} />
          <span className={styles.cardDot} />
        </div>
        <div className={styles.cardTitle}>Grandma Rose's Kitchen</div>
        <div className={styles.cardMeta}>Warsaw, 1952</div>
        <div className={styles.cardImg} />
        <div className={styles.cardText}>
          <div className={styles.cardLine} style={{ width: '90%' }} />
          <div className={styles.cardLine} style={{ width: '75%' }} />
          <div className={styles.cardLine} style={{ width: '82%' }} />
          <div className={styles.cardLine} style={{ width: '60%' }} />
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

const FEATURES = [
  {
    key:  'ai',
    icon: '✍️',
    color: '#c9954a',
    bg:   '#f8f0e0',
  },
  {
    key:  'tree',
    icon: '🌳',
    color: '#4caf82',
    bg:   '#e8f5ee',
  },
  {
    key:  'images',
    icon: '🖼️',
    color: '#7c6fe0',
    bg:   '#f0eefa',
  },
  {
    key:  'book',
    icon: '📖',
    color: '#e05c5c',
    bg:   '#fdeaea',
  },
] as const

const FeaturesSection = () => {
  const { t } = useTranslation()
  return (
    <section className={styles.features} id="how">
      <div className={styles.sectionInner}>
        <div className={styles.sectionLabel}>Features</div>
        <h2 className={styles.sectionTitle}>{t('landing.features.title')}</h2>

        <div className={styles.featureGrid}>
          {FEATURES.map(({ key, icon, color, bg }, i) => (
            <div
              key={key}
              className={styles.featureCard}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={styles.featureIconWrap} style={{ background: bg }}>
                <span className={styles.featureEmoji}>{icon}</span>
              </div>
              <h3 className={styles.featureTitle} style={{ color }}>
                {t(`landing.features.${key}.title`)}
              </h3>
              <p className={styles.featureDesc}>
                {t(`landing.features.${key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Book Styles ──────────────────────────────────────────

const BOOK_STYLES = [
  {
    key:      'heritage' as const,
    accent:   '#9e7030',
    bg:       'linear-gradient(135deg, #f8f0e0 0%, #ede3cf 100%)',
    fontDemo: 'Cormorant Garamond',
    preview:  ['Chapter I', 'The Beginning', '· · · · ·'],
  },
  {
    key:      'canvas' as const,
    accent:   '#1a1929',
    bg:       'linear-gradient(135deg, #f4f4f6 0%, #e8e8ee 100%)',
    fontDemo: 'DM Sans',
    preview:  ['Story One', 'A New Chapter', '— 2024 —'],
  },
  {
    key:      'scrapbook' as const,
    accent:   '#c9954a',
    bg:       'linear-gradient(135deg, #fdf6e3 0%, #fcebd0 100%)',
    fontDemo: 'Caveat',
    preview:  ['Our Family', 'Memories & Love', '♡ ♡ ♡'],
  },
]

const BookStylesSection = () => {
  const { t } = useTranslation()
  return (
    <section className={styles.bookStyles}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionLabel}>Book Styles</div>
        <h2 className={styles.sectionTitle}>{t('landing.bookStyles.title')}</h2>

        <div className={styles.styleGrid}>
          {BOOK_STYLES.map(({ key, accent, bg, preview }, i) => (
            <div key={key} className={styles.styleCard} style={{ animationDelay: `${i * 100}ms` }}>
              {/* Book preview mock */}
              <div className={styles.bookPreview} style={{ background: bg }}>
                <div className={styles.bookSpine} style={{ background: accent }} />
                <div className={styles.bookContent}>
                  {preview.map((line, j) => (
                    <span
                      key={j}
                      className={styles.bookLine}
                      style={{
                        fontFamily: key === 'scrapbook' ? "'Caveat', cursive" : key === 'canvas' ? "'Plus Jakarta Sans', sans-serif" : "'Cormorant Garamond', serif",
                        fontSize: j === 0 ? '10px' : j === 1 ? '14px' : '11px',
                        fontWeight: j === 1 ? 600 : 400,
                        color: accent,
                        opacity: j === 2 ? 0.5 : 1,
                        letterSpacing: j === 2 ? '0.1em' : '-0.01em',
                      }}
                    >
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
          ))}
        </div>
      </div>
    </section>
  )
}

// ── CTA Banner ───────────────────────────────────────────

const CtaSection = () => {
  const { t } = useTranslation()
  return (
    <section className={styles.cta}>
      <div className={styles.ctaBg} aria-hidden="true" />
      <div className={styles.ctaInner}>
        <h2 className={styles.ctaTitle}>
          Start preserving your<br /><em>family legacy today</em>
        </h2>
        <p className={styles.ctaSub}>
          Free forever. No credit card. Your stories, beautifully told.
        </p>
        <Link to="/auth" className={styles.ctaButton}>
          {t('landing.hero.cta')} <span>→</span>
        </Link>
      </div>
    </section>
  )
}

// ── Footer ───────────────────────────────────────────────

const LandingFooter = () => (
  <footer className={styles.footer}>
    <div className={styles.footerInner}>
      <div className={styles.footerBrand}>
        <span className={styles.brandStar}>✦</span>
        <span className={styles.brandName}>LoomBox</span>
      </div>
      <p className={styles.footerTagline}>Weave your family stories</p>
    </div>
  </footer>
)

export default LandingPage
