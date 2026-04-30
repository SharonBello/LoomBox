import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { IconButton, Tooltip } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import { useAppStore } from '@/store/appStore'
import { storyService } from '@/services/storyService'
import type { Story } from '@/types'
import styles from './StoriesPage.module.scss'

const StoriesPage = () => {
  const { t }    = useTranslation()
  const navigate = useNavigate()
  const { user } = useAppStore()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    storyService.list(user.uid).then(s => { setStories(s); setLoading(false) })
  }, [user])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm(t('stories.deleteConfirm'))) return
    await storyService.delete(id)
    setStories(s => s.filter(x => x.id !== id))
  }

  const handleToggleBook = async (e: React.MouseEvent, story: Story) => {
    e.stopPropagation()
    await storyService.toggleInBook(story.id, !story.isInBook)
    setStories(s => s.map(x => x.id === story.id ? { ...x, isInBook: !x.isInBook } : x))
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('stories.title')}</h1>
          <p className={styles.sub}>
            {t('stories.collection', { count: stories.length })}
          </p>
        </div>
        <Link to="/stories/new" className={styles.newBtn}>
          <AddIcon fontSize="small" /> {t('story.new')}
        </Link>
      </header>

      {loading ? (
        <div className={styles.grid}>
          {[1,2,3,4].map(i => <div key={i} className={`${styles.card} skeleton`} style={{ height: 280 }} />)}
        </div>
      ) : stories.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>✦</span>
          <h3>{t('stories.noStories')}</h3>
          <p>{t('stories.noStoriesDesc')}</p>
          <Link to="/stories/new" className={styles.emptyBtn}>{t('stories.firstStory')}</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {stories.map(story => (
            <div key={story.id} className={styles.card} onClick={() => navigate(`/stories/${story.id}`)}>
              {story.aiImageUrl
                ? <img src={story.aiImageUrl} className={styles.cardImg} alt={story.title} />
                : <div className={styles.cardImgPlaceholder}>✦</div>
              }
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{story.title}</h3>
                {(story.era || story.location) && (
                  <p className={styles.cardMeta}>{[story.location, story.era].filter(Boolean).join(' · ')}</p>
                )}
                <p className={styles.cardPreview}>{(story.enhancedContent ?? story.content).slice(0, 120)}…</p>
              </div>
              <div className={styles.cardActions}>
                <Tooltip title={story.isInBook ? t('stories.removeFromBook') : t('stories.addToBook')}>
                  <IconButton size="small" onClick={e => handleToggleBook(e, story)}
                    sx={{ color: story.isInBook ? '#c9954a' : '#9896a0' }}>
                    <MenuBookOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('stories.deleteStory')}>
                  <IconButton size="small" onClick={e => handleDelete(e, story.id)}
                    sx={{ color: '#9896a0', '&:hover': { color: '#e05c5c' } }}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </div>
            </div>
          ))}
          <Link to="/stories/new" className={styles.newCard}>
            <span>+</span>
            <span>{t('stories.addStory')}</span>
          </Link>
        </div>
      )}
    </div>
  )
}

export default StoriesPage
