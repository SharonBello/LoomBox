import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LinearProgress, Skeleton } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined'
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined'
import LocalDiningOutlinedIcon from '@mui/icons-material/LocalDiningOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import { useAppStore } from '@/store/appStore'
import { storyService } from '@/services/storyService'
import type { Story } from '@/types'
import styles from './DashboardPage.module.scss'

const getGreetingTime = (): string => {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

const DashboardPage = () => {
  const { t }    = useTranslation()
  const navigate = useNavigate()
  const { user } = useAppStore()

  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  const firstName = user?.displayName?.split(' ')[0] ?? 'there'
  const time      = t(`common.${getGreetingTime()}`)

  useEffect(() => {
    if (!user) return
    storyService.list(user.uid).then(s => { setStories(s); setLoading(false) })
  }, [user])

  const storiesInBook = stories.filter(s => s.isInBook).length
  const progress      = Math.min(Math.round((storiesInBook / 10) * 100), 100)
  const recentStories = stories.slice(0, 6)

  return (
    <div className={styles.page}>

      <header className={styles.greeting}>
        <div>
          <p className={styles.greetingTime}>
            {t('dashboard.greetingTime', { time, name: firstName })}
          </p>
          <h1 className={styles.greetingTitle}>
            {stories.length === 0
              ? t('dashboard.greeting.start')
              : t('dashboard.greeting.back')}
          </h1>
        </div>
        <Link to="/stories/new" className={styles.newStoryBtn}>
          <AddIcon fontSize="small" />
          <span>{t('dashboard.newStory')}</span>
        </Link>
      </header>

      <section className={styles.progressSection}>
        <div className={styles.progressCard}>
          <div className={styles.progressHeader}>
            <div>
              <h2 className={styles.progressTitle}>{t('dashboard.progressTitle')}</h2>
              <p className={styles.progressSub}>
                {t('dashboard.progressSub', { count: storiesInBook })}
              </p>
            </div>
            <Link to="/book" className={styles.viewBookBtn}>
              <MenuBookOutlinedIcon fontSize="small" />
              {t('dashboard.viewBook')}
            </Link>
          </div>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8, borderRadius: 999,
              background: 'rgba(201,149,74,0.15)',
              '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #c9954a, #e8c98a)' },
            }}
          />
          <div className={styles.progressStats}>
            <StatPill icon="📖" value={stories.length} label={t('dashboard.stats.stories')} />
            <StatPill icon="📸" value={0}              label={t('dashboard.stats.photos')}  />
            <StatPill icon="🌳" value={0}              label={t('dashboard.stats.members')} />
            <StatPill icon="🍳" value={0}              label={t('dashboard.stats.recipes')} />
          </div>
        </div>
      </section>

      <section className={styles.quickSection}>
        <h2 className={styles.sectionTitle}>{t('nav.dashboard')}</h2>
        <div className={styles.quickGrid}>
          <QuickAction icon={<AutoStoriesOutlinedIcon />} color="#c9954a" bg="#f8f0e0" to="/stories/new"
            label={t('dashboard.quick.newStory')}   desc={t('dashboard.quick.newStoryDesc')} />
          <QuickAction icon={<AccountTreeOutlinedIcon />} color="#4caf82" bg="#e8f5ee" to="/family-tree"
            label={t('dashboard.quick.familyTree')} desc={t('dashboard.quick.familyTreeDesc')} />
          <QuickAction icon={<LocalDiningOutlinedIcon />} color="#7c6fe0" bg="#f0eefa" to="/recipes/new"
            label={t('dashboard.quick.recipe')}     desc={t('dashboard.quick.recipeDesc')} />
          <QuickAction icon={<MenuBookOutlinedIcon />}    color="#e05c5c" bg="#fdeaea" to="/book"
            label={t('dashboard.quick.myBook')}     desc={t('dashboard.quick.myBookDesc')} />
        </div>
      </section>

      <section className={styles.storiesSection}>
        <div className={styles.storiesHeader}>
          <h2 className={styles.sectionTitle}>{t('dashboard.recentStories')}</h2>
          {stories.length > 0 && (
            <Link to="/stories" className={styles.viewAll}>{t('dashboard.viewAll')}</Link>
          )}
        </div>

        {loading ? (
          <div className={styles.storyGrid}>
            {[1,2,3].map(i => <StoryCardSkeleton key={i} />)}
          </div>
        ) : stories.length === 0 ? (
          <EmptyStories />
        ) : (
          <div className={styles.storyGrid}>
            {recentStories.map(story => (
              <StoryCard key={story.id} story={story} onClick={() => navigate(`/stories/${story.id}`)} />
            ))}
            <NewStoryCard />
          </div>
        )}
      </section>
    </div>
  )
}

const StatPill = ({ icon, value, label }: { icon: string; value: number; label: string }) => (
  <div className={styles.statPill}>
    <span className={styles.statIcon}>{icon}</span>
    <span className={styles.statValue}>{value}</span>
    <span className={styles.statLabel}>{label}</span>
  </div>
)

const QuickAction = ({ icon, label, desc, color, bg, to }: {
  icon: React.ReactNode; label: string; desc: string
  color: string; bg: string; to: string
}) => (
  <Link to={to} className={styles.quickCard}>
    <div className={styles.quickIcon} style={{ background: bg, color }}>{icon}</div>
    <div className={styles.quickText}>
      <span className={styles.quickLabel} style={{ color }}>{label}</span>
      <span className={styles.quickDesc}>{desc}</span>
    </div>
    <span className={styles.quickArrow}>→</span>
  </Link>
)

const StoryCard = ({ story, onClick }: { story: Story; onClick: () => void }) => {
  const { t } = useTranslation()
  return (
    <button className={styles.storyCard} onClick={onClick}>
      {story.aiImageUrl
        ? <img src={story.aiImageUrl} alt={story.title} className={styles.storyImg} />
        : <div className={styles.storyImgPlaceholder}><span>✦</span></div>
      }
      <div className={styles.storyBody}>
        <h3 className={styles.storyTitle}>{story.title}</h3>
        {(story.era || story.location) && (
          <p className={styles.storyMeta}>{[story.location, story.era].filter(Boolean).join(' · ')}</p>
        )}
        <p className={styles.storyPreview}>{(story.enhancedContent ?? story.content).slice(0, 100)}…</p>
      </div>
      {story.isInBook && <span className={styles.inBookBadge}>{t('stories.inBook')}</span>}
    </button>
  )
}

const NewStoryCard = () => {
  const { t } = useTranslation()
  return (
    <Link to="/stories/new" className={`${styles.storyCard} ${styles.newCard}`}>
      <div className={styles.newCardInner}>
        <div className={styles.newCardIcon}>+</div>
        <span className={styles.newCardLabel}>{t('dashboard.addStory')}</span>
      </div>
    </Link>
  )
}

const StoryCardSkeleton = () => (
  <div className={styles.storyCard}>
    <Skeleton variant="rectangular" height={160} sx={{ borderRadius: '12px 12px 0 0' }} />
    <div className={styles.storyBody}>
      <Skeleton width="70%" height={20} sx={{ mb: 1 }} />
      <Skeleton width="40%" height={14} sx={{ mb: 1.5 }} />
      <Skeleton width="90%" height={14} />
      <Skeleton width="75%" height={14} />
    </div>
  </div>
)

const EmptyStories = () => {
  const { t } = useTranslation()
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>✦</div>
      <h3 className={styles.emptyTitle}>{t('dashboard.empty.title')}</h3>
      <p className={styles.emptySub}>{t('dashboard.empty.sub')}</p>
      <Link to="/stories/new" className={styles.emptyBtn}>{t('dashboard.empty.cta')}</Link>
    </div>
  )
}

export default DashboardPage
