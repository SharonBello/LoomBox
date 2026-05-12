import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { TextField, Chip, CircularProgress, Tooltip, Collapse } from '@mui/material'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import { useAppStore } from '@/store/appStore'
import { storyService } from '@/services/storyService'
import {
  enhanceStory, getMemoryPrompts, getHistoricalContext,
  generateStoryIllustration, suggestTitle, detectLang, moderateContent,
} from '@/services/aiService'
import type { AIPromptQuestion } from '@/types'
import styles from './StoryEditor.module.scss'

type Step = 'setup' | 'write' | 'enhance' | 'preview'
const STEPS: Step[] = ['setup', 'write', 'enhance', 'preview']

const StoryEditor = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, language } = useAppStore()

  const [step, setStep] = useState<Step>('setup')
  const [title, setTitle] = useState('')
  const [era, setEra] = useState('')
  const [location, setLocation] = useState('')
  const [content, setContent] = useState('')
  const [enhancedContent, setEnhancedContent] = useState('')
  const [historicalContext, setHistoricalContext] = useState('')
  const [aiImageUrl, setAiImageUrl] = useState('')
  const [imageError, setImageError] = useState(false)
  const [prompts, setPrompts] = useState<AIPromptQuestion[]>([])
  const [showPrompts, setShowPrompts] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [enhancing, setEnhancing] = useState(false)
  const [loadingContext, setLoadingContext] = useState(false)
  const [loadingPrompts, setLoadingPrompts] = useState(false)
  const [loadingImage, setLoadingImage] = useState(false)
  const [titleSuggesting, setTitleSuggesting] = useState(false)

  const stepIndex = STEPS.indexOf(step)

  // Use content language if detectable, else fall back to UI language
  const resolveAiLang = (text?: string): 'en' | 'he' => {
    if (text && text.trim().length > 10) return detectLang(text)
    return language as 'en' | 'he'
  }

  const STEP_LABELS: Record<Step, string> = {
    setup: t('story.steps.details'),
    write: t('story.steps.write'),
    enhance: t('story.steps.aiMagic'),
    preview: t('story.steps.preview'),
  }

  const loadPrompts = useCallback(async () => {
    if (prompts.length > 0) { setShowPrompts(true); return }
    setLoadingPrompts(true)
    try {
      const q = await getMemoryPrompts(title || undefined, undefined, language as 'en' | 'he')
      setPrompts(q)
      setShowPrompts(true)
    } finally { setLoadingPrompts(false) }
  }, [prompts.length, title, language])

  const handleEnhance = async () => {
    if (!content.trim()) return
    setEnhancing(true)
    try {
      const lang = resolveAiLang(content)
      const result = await enhanceStory(content, era, location, lang)
      setEnhancedContent(result.enhancedContent)
      if (result.title && !title) setTitle(result.title)
      setStep('enhance')
    } finally { setEnhancing(false) }
  }

  const handleLoadContext = async () => {
    if (!era && !location) return
    setLoadingContext(true)
    try {
      const ctx = await getHistoricalContext(
        era || 'unknown era',
        location || 'unknown place',
        language as 'en' | 'he',
      )
      setHistoricalContext(ctx)
    } finally { setLoadingContext(false) }
  }

  const handleGenerateImage = async () => {
    setLoadingImage(true)
    setImageError(false)
    try {
      const url = await generateStoryIllustration(title, era, location)
      setAiImageUrl(url)
    } catch {
      setImageError(true)
    } finally { setLoadingImage(false) }
  }

  const handleSuggestTitle = async () => {
    const text = enhancedContent || content
    if (!text.trim()) return
    setTitleSuggesting(true)
    try {
      const suggested = await suggestTitle(text, resolveAiLang(text))
      setTitle(suggested.trim().replace(/^["'״]|["'״]$/g, ''))
    } finally { setTitleSuggesting(false) }
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setSaveError('')
    try {
      // Run content moderation silently — flag if unsafe, still save
      const textToCheck = (enhancedContent || content).slice(0, 1000)
      const modResult = await moderateContent(textToCheck).catch(() => ({ safe: true as const }))
      const flagReason = 'reason' in modResult ? modResult.reason : undefined

      const story = await storyService.create(user.uid, {
        title: title || t('story.untitled'),
        content,
        enhancedContent: enhancedContent || undefined,
        era: era || undefined,
        location: location || undefined,
        historicalContext: historicalContext || undefined,
        aiImageUrl: aiImageUrl || undefined,
        flagged: !modResult.safe,
        flagReason: modResult.safe ? undefined : (flagReason ?? 'AI flagged'),
      })
      navigate(`/stories/${story.id}`, { replace: true })
    } catch (err) {
      console.error('Save failed:', err)
      const e = err as { code?: string; message?: string }
      if (e.code === 'permission-denied') {
        setSaveError('Permission denied — update your Firestore rules in Firebase Console.')
      } else if (e.code === 'failed-precondition') {
        setSaveError('Missing Firestore index — click the link in your browser console.')
      } else {
        setSaveError(`Save failed: ${e.message ?? 'Unknown error. Check browser console.'}`)
      }
    } finally {
      setSaving(false)
    }
  }

  const appendPrompt = (q: string) => {
    setContent(prev => prev ? `${prev}\n\n${q}\n` : `${q}\n`)
    setShowPrompts(false)
  }

  const canProceedSetup = title.trim().length > 0
  const canProceedWrite = content.trim().length > 20
  const finalContent = enhancedContent || content

  return (
    <div className={styles.editor}>

      {/* Stepper */}
      <div className={styles.progress}>
        {STEPS.map((s, i) => (
          <button key={s}
            className={`${styles.progressStep} ${i <= stepIndex ? styles.progressActive : ''} ${i < stepIndex ? styles.progressDone : ''}`}
            onClick={() => i < stepIndex && setStep(s)} disabled={i > stepIndex}
          >
            <span className={styles.progressDot}>
              {i < stepIndex ? <CheckIcon sx={{ fontSize: 12 }} /> : i + 1}
            </span>
            <span className={styles.progressLabel}>{STEP_LABELS[s]}</span>
          </button>
        ))}
        <div className={styles.progressBar} style={{ width: `${(stepIndex / (STEPS.length - 1)) * 100}%` }} />
      </div>

      {/* ── Step 1 ── */}
      {step === 'setup' && (
        <div className={styles.step}>
          <div className={styles.stepHeader}>
            <h2 className={styles.stepTitle}>{t('story.whatIsStory')}</h2>
            <p className={styles.stepSub}>{t('story.whatIsStoryDesc')}</p>
          </div>
          <div className={styles.fields}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>{t('story.title')} *</label>
              <TextField placeholder={t('story.titlePlaceholder')} value={title}
                onChange={e => setTitle(e.target.value)} fullWidth autoFocus inputProps={{ maxLength: 100 }} />
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>{t('story.era')}</label>
                <TextField placeholder={t('story.eraPlaceholder')} value={era}
                  onChange={e => setEra(e.target.value)} fullWidth />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>{t('story.location')}</label>
                <TextField placeholder={t('story.locationPlaceholder')} value={location}
                  onChange={e => setLocation(e.target.value)} fullWidth />
              </div>
            </div>
            {(era || location) && (
              <div className={styles.contextBlock}>
                <div className={styles.contextHeader}>
                  <span className={styles.contextLabel}>✦ {t('story.historicalContext')}</span>
                  {!historicalContext && (
                    <button className={styles.contextBtn} onClick={handleLoadContext} disabled={loadingContext}>
                      {loadingContext
                        ? <><CircularProgress size={12} color="inherit" /> {t('story.findingContext')}</>
                        : t('story.findContext')}
                    </button>
                  )}
                </div>
                {historicalContext && <p className={styles.contextText}>{historicalContext}</p>}
              </div>
            )}
          </div>
          <div className={styles.stepFooter}>
            <button className={styles.primaryBtn} onClick={() => setStep('write')} disabled={!canProceedSetup}>
              {t('story.continueWriting')}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2 ── */}
      {step === 'write' && (
        <div className={styles.step}>
          <div className={styles.stepHeader}>
            <h2 className={styles.stepTitle}>{t('story.tellYourStory')}</h2>
            <p className={styles.stepSub}>{t('story.tellYourStoryDesc')}</p>
          </div>
          <div className={styles.promptsBar}>
            <button className={styles.promptsToggle} onClick={loadPrompts} disabled={loadingPrompts}>
              {loadingPrompts ? <CircularProgress size={14} color="inherit" /> : <LightbulbOutlinedIcon sx={{ fontSize: 16 }} />}
              <span>{loadingPrompts ? t('story.loadingPrompts') : t('story.getPrompts')}</span>
            </button>
          </div>
          <Collapse in={showPrompts}>
            <div className={styles.promptsGrid}>
              <div className={styles.promptsHeader}>
                <span>{t('story.choosePrompt')}</span>
                <button className={styles.promptsClose} onClick={() => setShowPrompts(false)}>
                  <CloseIcon sx={{ fontSize: 16 }} />
                </button>
              </div>
              {prompts.map(p => (
                <button key={p.id}
                  className={`${styles.promptChip} ${styles[`cat_${p.category}`]}`}
                  onClick={() => appendPrompt(p.question)}
                >
                  {p.question}
                </button>
              ))}
            </div>
          </Collapse>
          <textarea className={styles.textarea} value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={t('story.writePlaceholder')} rows={14} />
          <div className={styles.wordCount}>
            {t('story.wordCount', { count: content.split(/\s+/).filter(Boolean).length })}
          </div>
          <div className={styles.stepFooter}>
            <button className={styles.ghostBtn} onClick={() => setStep('setup')}>{t('story.backStep')}</button>
            <div className={styles.footerRight}>
              <Tooltip title={t('story.skipTooltip')}>
                <button className={styles.skipBtn} onClick={handleSave} disabled={!canProceedWrite || saving}>
                  {t('story.saveWithout')}
                </button>
              </Tooltip>
              <button className={styles.primaryBtn} onClick={handleEnhance} disabled={!canProceedWrite || enhancing}>
                {enhancing
                  ? <><CircularProgress size={14} color="inherit" /> {t('story.enhancing')}</>
                  : <><AutoFixHighIcon sx={{ fontSize: 16 }} /> {t('story.enhanceWithAI')}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3 ── */}
      {step === 'enhance' && (
        <div className={styles.step}>
          <div className={styles.stepHeader}>
            <h2 className={styles.stepTitle}>{t('story.aiEnhanced')}</h2>
            <p className={styles.stepSub}>{t('story.aiEnhancedDesc')}</p>
          </div>
          <div className={styles.titleRow}>
            <TextField label={t('story.title')} value={title}
              onChange={e => setTitle(e.target.value)} fullWidth size="small" />
            <Tooltip title={t('story.suggestTitleTooltip')}>
              <button className={styles.suggestBtn} onClick={handleSuggestTitle} disabled={titleSuggesting}>
                {titleSuggesting ? <CircularProgress size={14} color="inherit" /> : t('story.suggestTitle')}
              </button>
            </Tooltip>
          </div>
          <div className={styles.compareChips}>
            <Chip label={t('story.enhancedVersion')} size="small" sx={{ background: '#f8f0e0', color: '#c9954a', fontWeight: 600 }} />
            <span className={styles.compareSep}>↕</span>
            <Chip label={t('story.yourOriginal')} size="small" variant="outlined" sx={{ borderColor: '#e8e4dc' }} />
          </div>
          <textarea className={styles.textarea} value={enhancedContent}
            onChange={e => setEnhancedContent(e.target.value)} rows={12} />
          <details className={styles.originalToggle}>
            <summary>{t('story.viewOriginal')}</summary>
            <p className={styles.originalText}>{content}</p>
          </details>
          <div className={styles.imageSection}>
            <div className={styles.imageSectionHeader}>
              <span className={styles.imageSectionLabel}>{t('story.illustration')}</span>
              <button className={styles.generateImageBtn} onClick={handleGenerateImage} disabled={loadingImage}>
                {loadingImage
                  ? <><CircularProgress size={14} color="inherit" /> {t('story.generating')}</>
                  : <><ImageOutlinedIcon sx={{ fontSize: 16 }} /> {t('story.generateIllustration')}</>}
              </button>
            </div>
            {imageError && (
              <p className={styles.imageErrorMsg}>⚠ Could not load image — please try again.</p>
            )}
            {aiImageUrl && !imageError && (
              <div className={styles.imagePreview}>
                <img src={aiImageUrl} alt={t('story.aiIllustration')} className={styles.generatedImage} />
                <button className={styles.regenBtn} onClick={handleGenerateImage} disabled={loadingImage}>
                  {t('story.regenerate')}
                </button>
              </div>
            )}
          </div>
          <div className={styles.stepFooter}>
            <button className={styles.ghostBtn} onClick={() => setStep('write')}>{t('story.backToWriting')}</button>
            <button className={styles.primaryBtn} onClick={() => setStep('preview')}>{t('story.preview')}</button>
          </div>
        </div>
      )}

      {/* ── Step 4 ── */}
      {step === 'preview' && (
        <div className={styles.step}>
          <div className={styles.stepHeader}>
            <h2 className={styles.stepTitle}>{t('story.ready')}</h2>
            <p className={styles.stepSub}>{t('story.readyDesc')}</p>
          </div>
          <div className={styles.previewCard}>
            {aiImageUrl && <img src={aiImageUrl} alt={title} className={styles.previewImage} />}
            <div className={styles.previewBody}>
              {(era || location) && (
                <p className={styles.previewMeta}>{[location, era].filter(Boolean).join(' · ')}</p>
              )}
              <h2 className={styles.previewTitle}>{title || t('story.untitled')}</h2>
              {historicalContext && (
                <div className={styles.previewContext}>
                  <span className={styles.previewContextLabel}>{t('story.historicalContext')}</span>
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
            <button className={styles.ghostBtn} onClick={() => setStep('enhance')}>{t('story.backToEdit')}</button>
            <div className={styles.saveGroup}>
              {saveError && (
                <p className={styles.saveErrorMsg}>⚠ {saveError}</p>
              )}
              <button className={styles.primaryBtn} onClick={handleSave} disabled={saving}>
                {saving
                  ? <><CircularProgress size={14} color="inherit" /> {t('story.saving')}</>
                  : t('story.saveToStories')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StoryEditor