import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { TextField, Chip, CircularProgress, Tooltip, Collapse } from '@mui/material'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import { useAppStore } from '@/store/appStore'
import { storyService } from '@/services/storyService'
import {
  enhanceStory, getMemoryPrompts, getHistoricalContext,
  generateStoryIllustration, suggestTitle, detectLang,
} from '@/services/aiService'
import type { AIPromptQuestion } from '@/types'
import styles from './StoryEditor.module.scss'

type Step = 'setup' | 'write' | 'enhance' | 'preview'
const STEPS: Step[] = ['setup', 'write', 'enhance', 'preview']
type AnswerMap = Record<string, string>
export type Tone = 'original' | 'longer' | 'shorter' | 'dramatic' | 'funny' | 'poetic' | 'formal'

const TONES: { key: Tone; en: string; he: string; emoji: string }[] = [
  { key: 'original', en: 'Original', he: 'מקורי', emoji: '✦' },
  { key: 'longer', en: 'Longer', he: 'ארוך יותר', emoji: '📖' },
  { key: 'shorter', en: 'Shorter', he: 'קצר יותר', emoji: '✂️' },
  { key: 'dramatic', en: 'Dramatic', he: 'דרמטי', emoji: '🎭' },
  { key: 'funny', en: 'Funny', he: 'מצחיק', emoji: '😄' },
  { key: 'poetic', en: 'Poetic', he: 'פואטי', emoji: '🌿' },
  { key: 'formal', en: 'Formal', he: 'רשמי', emoji: '📜' },
]

// Web Speech API shim
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean; interimResults: boolean; lang: string
  start(): void; stop(): void
  onresult: ((e: { results: SpeechRecognitionResultList }) => void) | null
  onerror: ((e: Event) => void) | null
  onend: (() => void) | null
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance
  }
}

const StoryEditor = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAppStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  const uiLang = (): 'he' | 'en' => i18n.language.startsWith('he') ? 'he' : 'en'
  const resolveAiLang = (text?: string): 'he' | 'en' => {
    if (text && text.trim().length > 10) return detectLang(text)
    return uiLang()
  }

  // Form state
  const [step, setStep] = useState<Step>('setup')
  const [title, setTitle] = useState('')
  const [era, setEra] = useState('')
  const [location, setLocation] = useState('')
  const [content, setContent] = useState('')
  const [enhancedContent, setEnhancedContent] = useState('')
  const [historicalContext, setHistoricalContext] = useState('')
  const [aiImageUrl, setAiImageUrl] = useState('')
  const [uploadedImageUrl, setUploadedImageUrl] = useState('')
  const [selectedTone, setSelectedTone] = useState<Tone>('original')

  // Guided questions
  const [prompts, setPrompts] = useState<AIPromptQuestion[]>([])
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [showPrompts, setShowPrompts] = useState(false)
  const [answersUsed, setAnswersUsed] = useState(false)

  // Voice
  const [isListening, setIsListening] = useState(false)
  const voiceSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition)

  // Loading / error
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [enhancing, setEnhancing] = useState(false)
  const [loadingContext, setLoadingContext] = useState(false)
  const [loadingPrompts, setLoadingPrompts] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [titleSuggesting, setTitleSuggesting] = useState(false)

  const stepIndex = STEPS.indexOf(step)
  const displayImage = uploadedImageUrl || aiImageUrl
  const filledAnswerCount = prompts.filter(p => answers[p.id]?.trim()).length

  const buildAnswerContext = (): string =>
    prompts.filter(p => answers[p.id]?.trim())
      .map(p => `${p.question}\n${answers[p.id].trim()}`).join('\n\n')

  const STEP_LABELS: Record<Step, string> = {
    setup: t('story.steps.details'), write: t('story.steps.write'),
    enhance: t('story.steps.aiMagic'), preview: t('story.steps.preview'),
  }

  // ── Voice ─────────────────────────────────────────────────
  const toggleVoice = () => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.continuous = true
    rec.interimResults = false
    rec.lang = uiLang() === 'he' ? 'he-IL' : 'en-US'
    rec.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join(' ')
      setContent(prev => prev ? `${prev} ${text}` : text)
    }
    rec.onerror = () => setIsListening(false)
    rec.onend = () => setIsListening(false)
    recognitionRef.current = rec
    rec.start(); setIsListening(true)
  }

  // ── Image upload ──────────────────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setUploadedImageUrl(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  // ── AI ────────────────────────────────────────────────────
  const loadPrompts = useCallback(async () => {
    if (prompts.length > 0) { setShowPrompts(true); return }
    setLoadingPrompts(true)
    try { const q = await getMemoryPrompts(title || undefined, undefined, uiLang()); setPrompts(q); setShowPrompts(true) }
    finally { setLoadingPrompts(false) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompts.length, title, i18n.language])

  const handleEnhance = async (tone: Tone = selectedTone) => {
    const base = enhancedContent || content
    if (!base.trim()) return
    setEnhancing(true)
    try {
      const lang = resolveAiLang(base)
      const extra = buildAnswerContext()
      const result = await enhanceStory(base, era, location, lang, extra || undefined, tone)
      setEnhancedContent(result.enhancedContent)
      if (result.title && !title) setTitle(result.title)
      if (extra) setAnswersUsed(true)
      if (step === 'write') setStep('enhance')
    } finally { setEnhancing(false) }
  }

  const handleLoadContext = async () => {
    if (!era && !location) return
    setLoadingContext(true)
    try { setHistoricalContext(await getHistoricalContext(era || 'unknown era', location || 'unknown place', uiLang())) }
    finally { setLoadingContext(false) }
  }

  const handleGenerateImage = async () => {
    setImageLoading(true); setAiImageUrl('')
    try { setAiImageUrl(await generateStoryIllustration(title, era, location)) }
    catch (e) { console.error('Illustration failed:', e) }
    finally { setImageLoading(false) }
  }

  const handleSuggestTitle = async () => {
    const text = enhancedContent || content
    if (!text.trim()) return
    setTitleSuggesting(true)
    try { setTitle((await suggestTitle(text, resolveAiLang(text))).trim().replace(/^["'״]|["'״]$/g, '')) }
    finally { setTitleSuggesting(false) }
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true); setSaveError('')
    try {
      const story = await storyService.create(user.uid, {
        title: title || t('story.untitled'), content,
        enhancedContent: enhancedContent || undefined,
        era: era || undefined, location: location || undefined,
        historicalContext: historicalContext || undefined,
        aiImageUrl: displayImage || undefined,
      })
      navigate(`/stories/${story.id}`, { replace: true })
    } catch (err) {
      const e = err as { code?: string; message?: string }
      if (e.code === 'permission-denied') setSaveError('Permission denied — update Firestore rules in Firebase Console.')
      else if (e.code === 'failed-precondition') setSaveError('Missing Firestore index — click the link in your browser console.')
      else setSaveError(`Save failed: ${e.message ?? 'Check browser console.'}`)
    } finally { setSaving(false) }
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
            <span className={styles.progressDot}>{i < stepIndex ? <CheckIcon sx={{ fontSize: 12 }} /> : i + 1}</span>
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
                <TextField placeholder={t('story.eraPlaceholder')} value={era} onChange={e => setEra(e.target.value)} fullWidth />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>{t('story.location')}</label>
                <TextField placeholder={t('story.locationPlaceholder')} value={location} onChange={e => setLocation(e.target.value)} fullWidth />
              </div>
            </div>
            {(era || location) && (
              <div className={styles.contextBlock}>
                <div className={styles.contextHeader}>
                  <span className={styles.contextLabel}>✦ {t('story.historicalContext')}</span>
                  {!historicalContext && (
                    <button className={styles.contextBtn} onClick={handleLoadContext} disabled={loadingContext}>
                      {loadingContext ? <><CircularProgress size={12} color="inherit" /> {t('story.findingContext')}</> : t('story.findContext')}
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

          <div className={styles.writeToolbar}>
            <button className={styles.promptsToggle} onClick={loadPrompts} disabled={loadingPrompts}>
              {loadingPrompts ? <CircularProgress size={14} color="inherit" /> : <LightbulbOutlinedIcon sx={{ fontSize: 16 }} />}
              <span>{loadingPrompts ? t('story.loadingPrompts') : t('story.getPrompts')}</span>
            </button>
            {filledAnswerCount > 0 && (
              <span className={styles.answeredBadge}>{filledAnswerCount} {uiLang() === 'he' ? 'תשובות ✓' : 'answered ✓'}</span>
            )}
            {voiceSupported && (
              <Tooltip title={isListening ? (uiLang() === 'he' ? 'עצור הקלטה' : 'Stop recording') : (uiLang() === 'he' ? 'כתוב בקול' : 'Dictate')}>
                <span>
                  <button className={`${styles.voiceBtn} ${isListening ? styles.voiceActive : ''}`} onClick={toggleVoice}>
                    {isListening ? <MicOffIcon sx={{ fontSize: 16 }} /> : <MicIcon sx={{ fontSize: 16 }} />}
                    <span>{isListening ? (uiLang() === 'he' ? 'עצור' : 'Stop') : (uiLang() === 'he' ? 'דיקטציה' : 'Dictate')}</span>
                  </button>
                </span>
              </Tooltip>
            )}
          </div>

          <Collapse in={showPrompts}>
            <div className={styles.promptsPanel}>
              <div className={styles.promptsPanelHeader}>
                <div>
                  <span className={styles.promptsPanelTitle}>
                    {uiLang() === 'he' ? '✦ שאלות מנחות — ענה על מה שמרגיש נכון' : '✦ Memory prompts — answer what feels right'}
                  </span>
                  <p className={styles.promptsPanelSub}>
                    {uiLang() === 'he' ? 'תשובותיך יוזנו לבינה המלאכותית' : 'Your answers will be woven in when you enhance'}
                  </p>
                </div>
                <button className={styles.promptsClose} onClick={() => setShowPrompts(false)}><CloseIcon sx={{ fontSize: 16 }} /></button>
              </div>
              <div className={styles.questionsList}>
                {prompts.map((p, i) => (
                  <div key={p.id} className={`${styles.questionItem} ${styles[`cat_${p.category}`]}`}>
                    <div className={styles.questionNumber}>{i + 1}</div>
                    <div className={styles.questionBody}>
                      <label className={styles.questionText}>{p.question}</label>
                      <textarea className={styles.answerField} value={answers[p.id] ?? ''}
                        onChange={e => setAnswers(prev => ({ ...prev, [p.id]: e.target.value }))}
                        placeholder={uiLang() === 'he' ? 'כתוב כאן…' : 'Write here…'} rows={2} />
                    </div>
                  </div>
                ))}
              </div>
              {filledAnswerCount > 0 && (
                <div className={styles.answersFooter}>
                  <span className={styles.answersNote}>
                    {uiLang() === 'he' ? `${filledAnswerCount} תשובות ישולבו בשיפור` : `${filledAnswerCount} answers will be included when you enhance`}
                  </span>
                  <button className={styles.closeAnswersBtn} onClick={() => setShowPrompts(false)}>
                    {uiLang() === 'he' ? 'המשך לכתיבה' : 'Continue writing'} →
                  </button>
                </div>
              )}
            </div>
          </Collapse>

          <textarea className={styles.textarea} value={content} onChange={e => setContent(e.target.value)}
            placeholder={t('story.writePlaceholder')} rows={14} />

          {isListening && (
            <div className={styles.listeningBar}>
              <span className={styles.listeningDot} />
              {uiLang() === 'he' ? 'מקשיב… דבר כעת' : 'Listening… speak now'}
            </div>
          )}

          <div className={styles.wordCount}>
            {t('story.wordCount', { count: content.split(/\s+/).filter(Boolean).length })}
          </div>

          <div className={styles.stepFooter}>
            <button className={styles.ghostBtn} onClick={() => setStep('setup')}>{t('story.backStep')}</button>
            <div className={styles.footerRight}>
              <Tooltip title={t('story.skipTooltip')}><span>
                <button className={styles.skipBtn} onClick={handleSave} disabled={!canProceedWrite || saving}>{t('story.saveWithout')}</button>
              </span></Tooltip>
              <button className={styles.primaryBtn} onClick={() => handleEnhance()} disabled={!canProceedWrite || enhancing}>
                {enhancing
                  ? <><CircularProgress size={14} color="inherit" /> {t('story.enhancing')}</>
                  : <><AutoFixHighIcon sx={{ fontSize: 16 }} />
                    {filledAnswerCount > 0
                      ? (uiLang() === 'he' ? `שפר עם ${filledAnswerCount} תשובות` : `Enhance with ${filledAnswerCount} answers`)
                      : t('story.enhanceWithAI')}</>}
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
            {answersUsed && (
              <div className={styles.answersUsedBadge}>✦ {uiLang() === 'he' ? 'תשובותיך שולבו בסיפור' : 'Your answers were woven in'}</div>
            )}
          </div>

          <div className={styles.titleRow}>
            <TextField label={t('story.title')} value={title} onChange={e => setTitle(e.target.value)} fullWidth size="small" />
            <Tooltip title={t('story.suggestTitleTooltip')}><span>
              <button className={styles.suggestBtn} onClick={handleSuggestTitle} disabled={titleSuggesting}>
                {titleSuggesting ? <CircularProgress size={14} color="inherit" /> : t('story.suggestTitle')}
              </button>
            </span></Tooltip>
          </div>

          {/* Tone selector */}
          <div className={styles.toneSection}>
            <span className={styles.toneLabel}>{uiLang() === 'he' ? '✦ שנה סגנון:' : '✦ Change tone:'}</span>
            <div className={styles.toneChips}>
              {TONES.map(tone => (
                <button key={tone.key}
                  className={`${styles.toneChip} ${selectedTone === tone.key ? styles.toneChipActive : ''}`}
                  onClick={() => { setSelectedTone(tone.key); if (tone.key !== 'original') handleEnhance(tone.key) }}
                  disabled={enhancing}
                >
                  {tone.emoji} {uiLang() === 'he' ? tone.he : tone.en}
                </button>
              ))}
            </div>
            {enhancing && (
              <span className={styles.toneEnhancing}>
                <CircularProgress size={12} sx={{ color: '#c9954a' }} />
                {uiLang() === 'he' ? ' משפר…' : ' Rewriting…'}
              </span>
            )}
          </div>

          <div className={styles.compareChips}>
            <Chip label={t('story.enhancedVersion')} size="small" sx={{ background: '#f8f0e0', color: '#c9954a', fontWeight: 600 }} />
            <span className={styles.compareSep}>↕</span>
            <Chip label={t('story.yourOriginal')} size="small" variant="outlined" sx={{ borderColor: '#e8e4dc' }} />
          </div>

          <textarea className={styles.textarea} value={enhancedContent} onChange={e => setEnhancedContent(e.target.value)} rows={12} />

          <details className={styles.originalToggle}>
            <summary>{t('story.viewOriginal')}</summary>
            <p className={styles.originalText}>{content}</p>
          </details>

          {/* Image section */}
          <div className={styles.imageSection}>
            <div className={styles.imageSectionHeader}>
              <span className={styles.imageSectionLabel}>{t('story.illustration')}</span>
              <div className={styles.imageActions}>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                <button className={styles.uploadImageBtn} onClick={() => fileInputRef.current?.click()}>
                  <UploadFileIcon sx={{ fontSize: 15 }} />
                  {uiLang() === 'he' ? 'העלה תמונה' : 'Upload photo'}
                </button>
                <button className={styles.generateImageBtn} onClick={handleGenerateImage} disabled={imageLoading}>
                  {imageLoading
                    ? <><CircularProgress size={14} color="inherit" /> {t('story.generating')}</>
                    : <><ImageOutlinedIcon sx={{ fontSize: 16 }} /> {aiImageUrl ? t('story.regenerate') : t('story.generateIllustration')}</>}
                </button>
              </div>
            </div>
            {imageLoading && (
              <div className={styles.imageSpinner}>
                <CircularProgress size={28} sx={{ color: '#c9954a' }} />
                <span className={styles.imageSpinnerLabel}>
                  {uiLang() === 'he' ? 'מייצר איור וינטאג׳ מותאם אישית…' : 'Crafting a personalised vintage illustration…'}
                </span>
              </div>
            )}
            {uploadedImageUrl && !imageLoading && (
              <div className={styles.imagePreview}>
                <img src={uploadedImageUrl} alt="Uploaded" className={styles.generatedImage} />
                <button className={styles.removeImageBtn} onClick={() => setUploadedImageUrl('')}>
                  {uiLang() === 'he' ? 'הסר' : 'Remove'}
                </button>
              </div>
            )}
            {aiImageUrl && !uploadedImageUrl && !imageLoading && (
              <div className={styles.imagePreview}>
                <img src={aiImageUrl} alt={t('story.aiIllustration')} className={styles.generatedImage} />
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
            {displayImage && <img src={displayImage} alt={title} className={styles.previewImage} />}
            <div className={styles.previewBody}>
              {(era || location) && <p className={styles.previewMeta}>{[location, era].filter(Boolean).join(' · ')}</p>}
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
              {saveError && <p className={styles.saveErrorMsg}>⚠ {saveError}</p>}
              <button className={styles.primaryBtn} onClick={handleSave} disabled={saving}>
                {saving ? <><CircularProgress size={14} color="inherit" /> {t('story.saving')}</> : t('story.saveToStories')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StoryEditor