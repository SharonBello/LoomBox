import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { CircularProgress, Tooltip } from '@mui/material'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { storyService } from '@/services/storyService'
import type { Story } from '@/types'
import styles from './StoryPage.module.scss'

const StoryPage = () => {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [story, setStory]     = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    storyService.get(id).then(s => { setStory(s); setLoading(false) })
  }, [id])

  const handleToggleBook = async () => {
    if (!story) return
    await storyService.toggleInBook(story.id, !story.isInBook)
    setStory(s => s ? { ...s, isInBook: !s.isInBook } : s)
  }

  const handleDelete = async () => {
    if (!story || !confirm('Delete this story? This cannot be undone.')) return
    await storyService.delete(story.id)
    navigate('/stories', { replace: true })
  }

  if (loading) return (
    <div className={styles.loader}><CircularProgress sx={{ color: '#c9954a' }} /></div>
  )

  if (!story) return (
    <div className={styles.notFound}>
      <h2>Story not found</h2>
      <Link to="/stories">← Back to stories</Link>
    </div>
  )

  const displayContent = story.enhancedContent || story.content

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <Link to="/stories" className={styles.backBtn}>
          <ArrowBackIcon fontSize="small" /> Stories
        </Link>
        <div className={styles.toolbarActions}>
          <Tooltip title={story.isInBook ? 'Remove from book' : 'Add to book'}>
            <button
              className={`${styles.actionBtn} ${story.isInBook ? styles.inBook : ''}`}
              onClick={handleToggleBook}
            >
              <MenuBookOutlinedIcon fontSize="small" />
              {story.isInBook ? 'In book' : 'Add to book'}
            </button>
          </Tooltip>
          <Tooltip title="Delete story">
            <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={handleDelete}>
              <DeleteOutlineIcon fontSize="small" />
            </button>
          </Tooltip>
        </div>
      </div>

      <article className={styles.article}>
        {story.aiImageUrl && (
          <img src={story.aiImageUrl} alt={story.title} className={styles.hero} />
        )}
        <div className={styles.body}>
          {(story.era || story.location) && (
            <p className={styles.meta}>{[story.location, story.era].filter(Boolean).join(' · ')}</p>
          )}
          <h1 className={styles.title}>{story.title}</h1>

          {story.historicalContext && (
            <div className={styles.context}>
              <span className={styles.contextLabel}>✦ Historical context</span>
              <p>{story.historicalContext}</p>
            </div>
          )}

          <div className={styles.content}>
            {displayContent.split('\n').map((para, i) =>
              para.trim()
                ? <p key={i}>{para.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
                : <br key={i} />
            )}
          </div>

          <div className={styles.footer}>
            <span className={styles.date}>
              {story.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      </article>
    </div>
  )
}

export default StoryPage
