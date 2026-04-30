import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField, CircularProgress, Alert, Switch, Tooltip } from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import { useAppStore } from '@/store/appStore'
import { storyService } from '@/services/storyService'
import { memberService } from '@/services/memberService'
import { recipeService } from '@/services/recipeService'
import { bookConfigService } from '@/services/bookConfigService'
import { renderBook } from '@/features/book/BookRenderer'
import type { BookConfig, BookStyle, BookSectionType, Story, FamilyMember, Recipe } from '@/types'
import styles from './BookPage.module.scss'

// ── Style cards ───────────────────────────────────────────
const STYLES: { key: BookStyle; name: string; desc: string; accent: string; bg: string; font: string; preview: string[] }[] = [
  {
    key: 'heritage', name: 'Heritage', accent: '#8b5c2a', bg: 'linear-gradient(135deg,#fdf6ec,#f0e4d0)',
    font: "'Cormorant Garamond',serif", desc: 'Warm & antique, like a treasured journal',
    preview: ['Chapter I', 'The Beginning', '· · · · ·'],
  },
  {
    key: 'canvas', name: 'Canvas', accent: '#111', bg: 'linear-gradient(135deg,#f5f5f5,#e8e8e8)',
    font: "'DM Serif Display',serif", desc: 'Clean editorial, gallery-quality layout',
    preview: ['Story One', 'A New Chapter', '— 2024 —'],
  },
  {
    key: 'scrapbook', name: 'Scrapbook', accent: '#8b5c2a', bg: 'linear-gradient(135deg,#fdf8f0,#f0e9d8)',
    font: "'Caveat',cursive", desc: 'Playful & handcrafted, full of heart',
    preview: ['Our Family', 'Memories & Love', '♡ ♡ ♡'],
  },
]

const SECTION_LABELS: Record<BookSectionType, string> = {
  stories: '📖 Stories', tree: '🌳 Family Tree', recipes: '🍳 Recipes', photos: '📸 Photos',
}

const BookPage = () => {
  const { t } = useTranslation()
  const { user } = useAppStore()

  const [config, setConfig] = useState<BookConfig | null>(null)
  const [stories, setStories] = useState<Story[]>([])
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const dragRef = useRef<number | null>(null)

  useEffect(() => {
    if (!user) return
    Promise.all([
      bookConfigService.get(user.uid),
      storyService.list(user.uid).then(s => s.filter(x => x.isInBook)),
      memberService.list(user.uid),
      recipeService.list(user.uid).then(r => r.filter(x => x.isInBook)),
    ]).then(([cfg, s, m, r]) => {
      setConfig(cfg); setStories(s); setMembers(m); setRecipes(r)
    }).finally(() => setLoading(false))
  }, [user])

  const updateConfig = (patch: Partial<BookConfig>) =>
    setConfig(c => c ? { ...c, ...patch } : c)

  const handleSave = async () => {
    if (!user || !config) return
    setSaving(true)
    try {
      await bookConfigService.save(user.uid, config)
      setSaveMsg('Saved!')
      setTimeout(() => setSaveMsg(''), 2000)
    } finally { setSaving(false) }
  }

  const toggleSection = (type: BookSectionType) => {
    if (!config) return
    updateConfig({
      sections: config.sections.map(s => s.type === type ? { ...s, enabled: !s.enabled } : s),
    })
  }

  // Drag-to-reorder sections
  const onDragStart = (i: number) => { dragRef.current = i }
  const onDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault()
    const from = dragRef.current
    if (from === null || from === i || !config) return
    const sections = [...config.sections].sort((a, b) => a.order - b.order)
    const [moved] = sections.splice(from, 1)
    sections.splice(i, 0, moved)
    sections.forEach((s, idx) => { s.order = idx })
    updateConfig({ sections })
    dragRef.current = i
  }

  // Build HTML and open preview
  const openPreview = () => {
    if (!config) return
    const html = renderBook({ config, stories, members, recipes })
    setPreviewOpen(true)
    setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.srcdoc = html
      }
    }, 100)
  }

  // Download as HTML (opens print dialog for PDF)
  const handleDownload = async () => {
    if (!config) return
    setDownloading(true)
    try {
      const html = renderBook({ config, stories, members, recipes })
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${config.title.replace(/\s+/g, '_')}_LoomBox.html`
      a.click()
      URL.revokeObjectURL(url)
    } finally { setDownloading(false) }
  }

  const bookInCount = stories.length

  if (loading) return (
    <div className={styles.loader}><CircularProgress sx={{ color: '#c9954a' }} /></div>
  )
  if (!config) return null

  const sortedSections = [...config.sections].sort((a, b) => a.order - b.order)

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('book.title')}</h1>
          <p className={styles.sub}>{bookInCount} stories in your book</p>
        </div>
        <div className={styles.headerActions}>
          {saveMsg && <span className={styles.saveMsg}>✓ {saveMsg}</span>}
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={14} color="inherit" /> : null}
            Save settings
          </button>
          <button className={styles.previewBtn} onClick={openPreview}>
            <VisibilityIcon fontSize="small" /> {t('book.preview')}
          </button>
          <button className={styles.downloadBtn} onClick={handleDownload} disabled={downloading}>
            {downloading
              ? <><CircularProgress size={14} color="inherit" /> {t('book.downloading')}</>
              : <><DownloadIcon fontSize="small" /> {t('book.download')}</>}
          </button>
        </div>
      </header>

      {bookInCount === 0 && (
        <Alert severity="info" sx={{ borderRadius: '10px' }}>
          No stories in your book yet — go to <strong>Stories</strong> and click the book icon on each story to add it.
        </Alert>
      )}

      <div className={styles.layout}>
        {/* Left: config panel */}
        <div className={styles.configPanel}>

          {/* ── Style picker ── */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>✦ Choose your style</h2>
            <div className={styles.styleGrid}>
              {STYLES.map(style => (
                <button
                  key={style.key}
                  className={`${styles.styleCard} ${config.style === style.key ? styles.styleCardActive : ''}`}
                  onClick={() => updateConfig({ style: style.key })}
                >
                  {/* Mini book preview */}
                  <div className={styles.stylePreview} style={{ background: style.bg }}>
                    <div className={styles.styleSpine} style={{ background: style.accent }} />
                    <div className={styles.styleContent}>
                      {style.preview.map((line, i) => (
                        <span key={i} style={{
                          fontFamily: style.font,
                          fontSize: i === 1 ? 13 : 10,
                          fontWeight: i === 1 ? 600 : 400,
                          color: style.accent,
                          opacity: i === 2 ? 0.5 : 1,
                          letterSpacing: i === 2 ? '0.1em' : '-0.01em',
                          display: 'block', textAlign: 'center',
                        }}>{line}</span>
                      ))}
                    </div>
                    {config.style === style.key && (
                      <div className={styles.styleCheck}>✓</div>
                    )}
                  </div>
                  <div className={styles.styleInfo}>
                    <span className={styles.styleName}>{style.name}</span>
                    <span className={styles.styleDesc}>{style.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* ── Book details ── */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>✦ Book details</h2>
            <div className={styles.fields}>
              <TextField label="Book title" fullWidth size="small"
                value={config.title}
                onChange={e => updateConfig({ title: e.target.value })} />
              <TextField label="Subtitle (optional)" fullWidth size="small"
                value={config.subtitle ?? ''}
                onChange={e => updateConfig({ subtitle: e.target.value })} />
              <TextField label="Dedication (optional)" fullWidth size="small" multiline rows={3}
                placeholder="e.g. For my children and grandchildren, so they may know where they come from."
                value={config.dedication ?? ''}
                onChange={e => updateConfig({ dedication: e.target.value })} />
            </div>
          </section>

          {/* ── Sections ── */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>✦ Sections</h2>
            <p className={styles.sectionSub}>Drag to reorder · toggle to include/exclude</p>
            <div className={styles.sectionList}>
              {sortedSections.map((sec, i) => (
                <div
                  key={sec.type}
                  className={`${styles.sectionRow} ${!sec.enabled ? styles.sectionRowDisabled : ''}`}
                  draggable
                  onDragStart={() => onDragStart(i)}
                  onDragOver={e => onDragOver(e, i)}
                >
                  <DragIndicatorIcon sx={{ fontSize: 18, color: '#c4c2cc', cursor: 'grab' }} />
                  <span className={styles.sectionRowLabel}>{SECTION_LABELS[sec.type]}</span>
                  <span className={styles.sectionRowCount}>
                    {sec.type === 'stories' ? `${stories.length} items` : ''}
                    {sec.type === 'tree' ? `${members.length} members` : ''}
                    {sec.type === 'recipes' ? `${recipes.length} items` : ''}
                  </span>
                  <Tooltip title={sec.enabled ? 'Remove from book' : 'Include in book'}>
                    <Switch
                      checked={sec.enabled}
                      onChange={() => toggleSection(sec.type)}
                      size="small"
                      sx={{
                        '& .MuiSwitch-thumb': { background: sec.enabled ? '#c9954a' : '#ccc' },
                        '& .MuiSwitch-track': { background: sec.enabled ? 'rgba(201,149,74,0.3)' : undefined }
                      }}
                    />
                  </Tooltip>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right: mini live preview */}
        <div className={styles.livePreview}>
          <div className={styles.livePreviewLabel}>Live preview</div>
          <div className={styles.miniBook} style={{
            background: STYLES.find(s => s.key === config.style)?.bg ?? '#fdf6ec',
          }}>
            <div className={styles.miniBookSpine} style={{
              background: STYLES.find(s => s.key === config.style)?.accent ?? '#8b5c2a',
            }} />
            <div className={styles.miniBookContent}>
              <div className={styles.miniBookTitle} style={{
                fontFamily: STYLES.find(s => s.key === config.style)?.font ?? "'Cormorant Garamond',serif",
                color: STYLES.find(s => s.key === config.style)?.accent ?? '#8b5c2a',
              }}>
                {config.title || 'Your Book'}
              </div>
              {config.subtitle && (
                <div className={styles.miniBookSubtitle}>{config.subtitle}</div>
              )}
              <div className={styles.miniBookLines}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={styles.miniBookLine} style={{ width: `${60 + i * 5}%` }} />
                ))}
              </div>
              <div className={styles.miniBookStats}>
                {bookInCount > 0 && <span>📖 {bookInCount}</span>}
                {members.length > 0 && <span>🌳 {members.length}</span>}
                {recipes.length > 0 && <span>🍳 {recipes.length}</span>}
              </div>
            </div>
          </div>
          <button className={styles.fullPreviewBtn} onClick={openPreview}>
            <VisibilityIcon sx={{ fontSize: 16 }} /> Open full preview
          </button>
          <div className={styles.downloadHint}>
            <p>Download as HTML, then open in your browser and press <strong>Ctrl+P</strong> → Save as PDF for a print-ready file.</p>
          </div>
        </div>
      </div>

      {/* ── Full preview modal ── */}
      {previewOpen && (
        <div className={styles.previewOverlay} onClick={() => setPreviewOpen(false)}>
          <div className={styles.previewModal} onClick={e => e.stopPropagation()}>
            <div className={styles.previewHeader}>
              <span className={styles.previewTitle}>{config.title} — Preview</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className={styles.downloadBtn} onClick={handleDownload}>
                  <DownloadIcon fontSize="small" /> Download
                </button>
                <button className={styles.closePreviewBtn} onClick={() => setPreviewOpen(false)}>✕</button>
              </div>
            </div>
            <iframe
              ref={iframeRef}
              className={styles.previewFrame}
              title="Book preview"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default BookPage