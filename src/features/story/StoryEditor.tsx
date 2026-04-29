import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextField, Chip, CircularProgress, Tooltip, Collapse } from '@mui/material'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import { useAppStore } from '@/store/appStore'
import { storyService } from '@/services/storyService'
import {
  enhanceStory,
  getMemoryPrompts,
  getHistoricalContext,
  buildImagePrompt,
  getPollinationsImageUrl,
  suggestTitle,
} from '@/services/aiService'
import type { AIPromptQuestion } from '@/types'
import styles from './StoryEditor.module.scss'

// ── Step definitions ──────────────────────────────────────

type Step = 'setup' | 'write' | 'enhance' | 'preview'

const STEPS: Step[] = ['setup', 'write', 'enhance', 'preview']

const STEP_LABELS: Record<Step, string> = {
  setup:   '1. Details',
  write:   '2. Your Story',
  enhance: '3. AI Magic',
  preview: '4. Preview',
}

// ============================================================
// StoryEditor
// ============================================================

const StoryEditor = () => {
  const navigate     = useNavigate()
  const { user }     = useAppStore()

  // Form state
  const [step, setStep]                   = useState<Step>('setup')
  const [title, setTitle]                 = useState('')
  const [era, setEra]                     = useState('')
  const [location, setLocation]           = useState('')
  const [content, setContent]             = useState('')
  const [enhancedContent, setEnhancedContent] = useState('')
  const [historicalContext, setHistoricalContext] = useState('')
  const [aiImageUrl, setAiImageUrl]       = useState('')
  const [prompts, setPrompts]             = useState<AIPromptQuestion[]>([])
  const [showPrompts, setShowPrompts]     = useState(false)

  // Loading states
  const [saving, setSaving]               = useState(false)
  const [enhancing, setEnhancing]         = useState(false)
  const [loadingContext, setLoadingContext] = useState(false)
  const [loadingPrompts, setLoadingPrompts] = useState(false)
  const [loadingImage, setLoadingImage]   = useState(false)
  const [titleSuggesting, setTitleSuggesting] = useState(false)

  const stepIndex = STEPS.indexOf(step)

  // ── Actions ────────────────────────────────────────────

  const loadPrompts = useCallback(async () => {
    if (prompts.length > 0) { setShowPrompts(true); return }
    setLoadingPrompts(true)
    try {
      const q = await getMemoryPrompts(title || undefined)
      setPrompts(q)
      setShowPrompts(true)
    } finally {
      setLoadingPrompts(false)
    }
  }, [prompts.length, title])

  const handleEnhance = async () => {
    if (!content.trim()) return
    setEnhancing(true)
    try {
      const result = await enhanceStory(content, era, location)
      setEnhancedContent(result.enhancedContent)
      if (result.title && !title) setTitle(result.title)
      setStep('enhance')
    } finally {
      setEnhancing(false)
    }
  }

  const handleLoadContext = async () => {
    if (!era && !location) return
    setLoadingContext(true)
    try {
      const ctx = await getHistoricalContext(era || 'unknown era', location || 'unknown place')
      setHistoricalContext(ctx)
    } finally {
      setLoadingContext(false)
    }
  }

  const handleGenerateImage = async () => {
    setLoadingImage(true)
    try {
      const prompt = buildImagePrompt(title, era, location)
      const url    = getPollinationsImageUrl(prompt)
      // Pre-load image
      await new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.onload  = () => resolve()
        img.onerror = () => reject()
        img.src     = url
      })
      setAiImageUrl(url)
    } catch {
      // Pollinations sometimes fails silently — just skip
    } finally {
      setLoadingImage(false)
    }
  }

  const handleSuggestTitle = async () => {
    const text = enhancedContent || content
    if (!text.trim()) return
    setTitleSuggesting(true)
    try {
      const t = await suggestTitle(text)
      setTitle(t.trim().replace(/^["']|["']$/g, ''))
    } finally {
      setTitleSuggesting(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const story = await storyService.create(user.uid, {
        title:             title || 'Untitled Story',
        content,
        enhancedContent:   enhancedContent || undefined,
        era:               era   || undefined,
        location:          location || undefined,
        historicalContext: historicalContext || undefined,
        aiImageUrl:        aiImageUrl || undefined,
      })
      navigate(`/stories/${story.id}`, { replace: true })
    } finally {
      setSaving(false)
    }
  }

  const appendPromptAnswer = (q: string) => {
    setContent(prev => prev
      ? `${prev}\n\n**${q}**\n`
      : `**${q}**\n`)
    setShowPrompts(false)
  }

  const canProceedSetup  = title.trim().length > 0
  const canProceedWrite  = content.trim().length > 20
  const finalContent     = enhancedContent || content

  // ──────────────────────────────────────────────────────

  return (
    <div className={styles.editor}>

      {/* ── Progress bar ── */}
      <div className={styles.progress}>
        {STEPS.map((s, i) => (
          <button
            key={s}
            className={`${styles.progressStep} ${i <= stepIndex ? styles.progressActive : ''} ${i < stepIndex ? styles.progressDone : ''}`}
            onClick={() => i < stepIndex && setStep(s)}
            disabled={i > stepIndex}
          >
            <span className={styles.progressDot}>
              {i < stepIndex ? <CheckIcon sx={{ fontSize: 12 }} /> : i + 1}
            </span>
            <span className={styles.progressLabel}>{STEP_LABELS[s]}</span>
          </button>
        ))}
        <div
          className={styles.progressBar}
          style={{ width: `${(stepIndex / (STEPS.length - 1)) * 100}%` }}
        />
      </div>

      {/* ── Step: Setup ── */}
      {step === 'setup' && (
        <div className={styles.step}>
          <div className={styles.stepHeader}>
            <h2 className={styles.stepTitle}>What's this story about?</h2>
            <p className={styles.stepSub}>Give your story a name and set the scene — AI will use this to find historical context and generate the perfect illustration.</p>
          </div>

          <div className={styles.fields}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Story title *</label>
              <TextField
                placeholder="e.g. Grandma's Kitchen in Warsaw"
                value={title}
                onChange={e => setTitle(e.target.value)}
                fullWidth
                autoFocus
                inputProps={{ maxLength: 100 }}
              />
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>When did this take place?</label>
                <TextField
                  placeholder="e.g. 1952, The 1960s, Summer of 1978"
                  value={era}
                  onChange={e => setEra(e.target.value)}
                  fullWidth
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Where did this take place?</label>
                <TextField
                  placeholder="e.g. Warsaw, Poland · Tel Aviv · Brooklyn"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  fullWidth
                />
              </div>
            </div>

            {/* Context preview */}
            {(era || location) && (
              <div className={styles.contextBlock}>
                <div className={styles.contextHeader}>
                  <span className={styles.contextLabel}>✦ Historical context</span>
                  {!historicalContext && (
                    <button
                      className={styles.contextBtn}
                      onClick={handleLoadContext}
                      disabled={loadingContext}
                    >
                      {loadingContext
                        ? <><CircularProgress size={12} color="inherit" /> Finding context…</>
                        : 'Find historical context'}
                    </button>
                  )}
                </div>
                {historicalContext && (
                  <p className={styles.contextText}>{historicalContext}</p>
                )}
              </div>
            )}
          </div>

          <div className={styles.stepFooter}>
            <button
              className={styles.primaryBtn}
              onClick={() => setStep('write')}
              disabled={!canProceedSetup}
            >
              Continue to writing →
            </button>
          </div>
        </div>
      )}

      {/* ── Step: Write ── */}
      {step === 'write' && (
        <div className={styles.step}>
          <div className={styles.stepHeader}>
            <h2 className={styles.stepTitle}>Tell your story</h2>
            <p className={styles.stepSub}>Write freely in your own words. Don't worry about perfection — AI will help you polish it next. Use the prompts if you need inspiration.</p>
          </div>

          {/* Prompt helper */}
          <div className={styles.promptsBar}>
            <button
              className={styles.promptsToggle}
              onClick={loadPrompts}
              disabled={loadingPrompts}
            >
              {loadingPrompts
                ? <CircularProgress size={14} color="inherit" />
                : <LightbulbOutlinedIcon sx={{ fontSize: 16 }} />}
              <span>Get writing prompts</span>
            </button>
          </div>

          <Collapse in={showPrompts}>
            <div className={styles.promptsGrid}>
              <div className={styles.promptsHeader}>
                <span>Choose a prompt to add to your story</span>
                <button className={styles.promptsClose} onClick={() => setShowPrompts(false)}>
                  <CloseIcon sx={{ fontSize: 16 }} />
                </button>
              </div>
              {prompts.map(p => (
                <button
                  key={p.id}
                  className={`${styles.promptChip} ${styles[`cat_${p.category}`]}`}
                  onClick={() => appendPromptAnswer(p.question)}
                >
                  {p.question}
                </button>
              ))}
            </div>
          </Collapse>

          <textarea
            className={styles.textarea}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={`Start writing your story here…\n\nYou can write in whatever way feels natural. Don't worry about perfect sentences — just get your memories down. AI will help you shape them beautifully in the next step.`}
            rows={14}
            autoFocus={!showPrompts}
          />

          <div className={styles.wordCount}>
            {content.split(/\s+/).filter(Boolean).length} words
          </div>

          <div className={styles.stepFooter}>
            <button className={styles.ghostBtn} onClick={() => setStep('setup')}>
              ← Back
            </button>
            <div className={styles.footerRight}>
              <Tooltip title="Skip AI enhancement and save as-is">
                <button className={styles.skipBtn} onClick={handleSave} disabled={!canProceedWrite || saving}>
                  Save without enhancing
                </button>
              </Tooltip>
              <button
                className={styles.primaryBtn}
                onClick={handleEnhance}
                disabled={!canProceedWrite || enhancing}
              >
                {enhancing
                  ? <><CircularProgress size={14} color="inherit" /> Enhancing…</>
                  : <><AutoFixHighIcon sx={{ fontSize: 16 }} /> Enhance with AI</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step: Enhance ── */}
      {step === 'enhance' && (
        <div className={styles.step}>
          <div className={styles.stepHeader}>
            <h2 className={styles.stepTitle}>AI has enhanced your story ✦</h2>
            <p className={styles.stepSub}>Review the enhanced version below. You can edit it freely — it's still your story, just beautifully told.</p>
          </div>

          {/* Title row */}
          <div className={styles.titleRow}>
            <TextField
              label="Story title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              fullWidth
              size="small"
            />
            <Tooltip title="Suggest a title based on your story">
              <button
                className={styles.suggestBtn}
                onClick={handleSuggestTitle}
                disabled={titleSuggesting}
              >
                {titleSuggesting
                  ? <CircularProgress size={14} color="inherit" />
                  : '✦ Suggest title'}
              </button>
            </Tooltip>
          </div>

          {/* Compare toggle */}
          <div className={styles.compareChips}>
            <Chip label="Enhanced version" size="small" sx={{ background: '#f8f0e0', color: '#c9954a', fontWeight: 600 }} />
            <span className={styles.compareSep}>↕</span>
            <Chip label="Your original" size="small" variant="outlined" sx={{ borderColor: '#e8e4dc' }} />
          </div>

          <textarea
            className={styles.textarea}
            value={enhancedContent}
            onChange={e => setEnhancedContent(e.target.value)}
            rows={12}
          />

          {/* Original toggle */}
          <details className={styles.originalToggle}>
            <summary>View your original text</summary>
            <p className={styles.originalText}>{content}</p>
          </details>

          {/* AI Image */}
          <div className={styles.imageSection}>
            <div className={styles.imageSectionHeader}>
              <span className={styles.imageSectionLabel}>✦ Story illustration</span>
              <button
                className={styles.generateImageBtn}
                onClick={handleGenerateImage}
                disabled={loadingImage}
              >
                {loadingImage
                  ? <><CircularProgress size={14} color="inherit" /> Generating…</>
                  : <><ImageOutlinedIcon sx={{ fontSize: 16 }} /> Generate AI illustration</>}
              </button>
            </div>
            {aiImageUrl && (
              <div className={styles.imagePreview}>
                <img src={aiImageUrl} alt="AI illustration" className={styles.generatedImage} />
                <button className={styles.regenBtn} onClick={handleGenerateImage} disabled={loadingImage}>
                  ↺ Regenerate
                </button>
              </div>
            )}
          </div>

          <div className={styles.stepFooter}>
            <button className={styles.ghostBtn} onClick={() => setStep('write')}>
              ← Back to writing
            </button>
            <button
              className={styles.primaryBtn}
              onClick={() => setStep('preview')}
            >
              Preview →
            </button>
          </div>
        </div>
      )}

      {/* ── Step: Preview ── */}
      {step === 'preview' && (
        <div className={styles.step}>
          <div className={styles.stepHeader}>
            <h2 className={styles.stepTitle}>Your story is ready</h2>
            <p className={styles.stepSub}>This is how your story will appear in your family book. You can always edit it later.</p>
          </div>

          <div className={styles.previewCard}>
            {aiImageUrl && (
              <img src={aiImageUrl} alt={title} className={styles.previewImage} />
            )}
            <div className={styles.previewBody}>
              {(era || location) && (
                <p className={styles.previewMeta}>
                  {[location, era].filter(Boolean).join(' · ')}
                </p>
              )}
              <h2 className={styles.previewTitle}>{title || 'Untitled Story'}</h2>
              {historicalContext && (
                <div className={styles.previewContext}>
                  <span className={styles.previewContextLabel}>Historical context</span>
                  <p>{historicalContext}</p>
                </div>
              )}
              <div className={styles.previewText}>
                {finalContent.split('\n').map((para, i) =>
                  para.trim() ? <p key={i}>{para.replace(/\*\*(.*?)\*\*/g, '$1')}</p> : <br key={i} />
                )}
              </div>
            </div>
          </div>

          <div className={styles.stepFooter}>
            <button className={styles.ghostBtn} onClick={() => setStep('enhance')}>
              ← Edit
            </button>
            <button
              className={styles.primaryBtn}
              onClick={handleSave}
              disabled={saving}
            >
              {saving
                ? <><CircularProgress size={14} color="inherit" /> Saving…</>
                : '✦ Save to my stories'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default StoryEditor
