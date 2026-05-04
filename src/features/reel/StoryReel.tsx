import { useState } from 'react'
import { CircularProgress, Tooltip } from '@mui/material'
import MovieIcon from '@mui/icons-material/Movie'
import ShareIcon from '@mui/icons-material/Share'
import DownloadIcon from '@mui/icons-material/Download'
import CloseIcon from '@mui/icons-material/Close'
import type { Story } from '@/types'
import styles from './StoryReel.module.scss'

export type ReelStyle = 'cinematic' | 'animated' | 'historical' | 'modern'

interface ReelScene {
    title: string
    quote: string
    mood: string
    visual: string
}

const REEL_STYLES: { key: ReelStyle; label: string; labelHe: string; desc: string; emoji: string }[] = [
    { key: 'cinematic', label: 'Cinematic', labelHe: 'קולנועי', desc: 'Dark & dramatic, golden serif', emoji: '🎬' },
    { key: 'animated', label: 'Animated', labelHe: 'אנימציה', desc: 'Colourful & playful, bouncy', emoji: '🎨' },
    { key: 'historical', label: 'Historical', labelHe: 'היסטורי', desc: 'Sepia, newspaper, documentary', emoji: '📰' },
    { key: 'modern', label: 'Modern', labelHe: 'מודרני', desc: 'Clean white, bold typography', emoji: '✦' },
]

interface StyleCfg {
    bg: string; textColor: string; accentColor: string
    titleFont: string; quoteFont: string
    titleSize: string; quoteSize: string
    titleWeight: string; quoteItalic: string; overlay: string
    duration: number; borderRadius: string; hasShadow: boolean
}

function getStyleCfg(rs: ReelStyle): StyleCfg {
    const map: Record<ReelStyle, StyleCfg> = {
        cinematic: { bg: '#0d0d0d', textColor: '#f5f0e8', accentColor: '#c9954a', titleFont: 'Cormorant Garamond,Georgia,serif', quoteFont: 'EB Garamond,Georgia,serif', titleSize: '52px', quoteSize: '22px', titleWeight: '300', quoteItalic: 'italic', overlay: 'rgba(0,0,0,0.55)', duration: 5000, borderRadius: '4px', hasShadow: true },
        animated: { bg: '#fffdf7', textColor: '#2d2d2d', accentColor: '#ff6b6b', titleFont: 'Nunito,Segoe UI,sans-serif', quoteFont: 'Nunito,Segoe UI,sans-serif', titleSize: '48px', quoteSize: '20px', titleWeight: '700', quoteItalic: 'normal', overlay: 'rgba(255,255,255,0.3)', duration: 4000, borderRadius: '20px', hasShadow: false },
        historical: { bg: '#f5e6c8', textColor: '#2c1a0e', accentColor: '#8b5c2a', titleFont: 'Playfair Display,Georgia,serif', quoteFont: 'Georgia,serif', titleSize: '44px', quoteSize: '18px', titleWeight: '400', quoteItalic: 'italic', overlay: 'rgba(245,230,200,0.6)', duration: 5500, borderRadius: '4px', hasShadow: false },
        modern: { bg: '#ffffff', textColor: '#1a1929', accentColor: '#1a1929', titleFont: 'DM Sans,Helvetica Neue,sans-serif', quoteFont: 'DM Serif Display,Georgia,serif', titleSize: '40px', quoteSize: '20px', titleWeight: '500', quoteItalic: 'italic', overlay: 'rgba(255,255,255,0.6)', duration: 4500, borderRadius: '4px', hasShadow: false },
    }
    return map[rs]
}

function escHtml(s: string): string {
    return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

async function callAI(system: string, user: string, maxTokens = 1200): Promise<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY as string,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] }),
    })
    if (!res.ok) throw new Error('AI failed: ' + res.status)
    const data = await res.json()
    return (data.content?.[0]?.text ?? '') as string
}

async function extractScenes(story: Story, lang: 'en' | 'he'): Promise<ReelScene[]> {
    const langRule = lang === 'he' ? 'MANDATORY: Write ALL text in Hebrew only.' : 'Write in English.'
    const system = 'You are a cinematic director turning a family story into a visual reel.\nExtract 5-7 key scenes. For each:\n- title: 3-5 word scene title\n- quote: most powerful sentence under 20 words\n- mood: one word (warm, melancholy, joyful, nostalgic)\n- visual: brief visual description\n' + langRule + '\nReturn ONLY a valid JSON array:\n[{"title":"...","quote":"...","mood":"...","visual":"..."}]'
    const text = await callAI(system, 'Extract scenes from:\n\n' + (story.enhancedContent ?? story.content))
    const s = text.indexOf('['), e = text.lastIndexOf(']') + 1
    if (s === -1) throw new Error('No scenes')
    return JSON.parse(text.slice(s, e)) as ReelScene[]
}

async function generateSceneSVG(visual: string, rs: ReelStyle): Promise<string> {
    const palettes: Record<ReelStyle, string> = {
        cinematic: 'Dark (#0d0d0d,#1a1200). Gold (#c9954a,#f0c040). Dramatic.',
        animated: 'Bright (#ff6b6b,#4ecdc4,#ffe66d). Round shapes, playful.',
        historical: 'Sepia (#8b6914,#c9a87a,#f5e6c8). Aged paper, simple lines.',
        modern: 'White (#ffffff,#f8f8f8). Single accent (#1a1929). Minimal.',
    }
    const system = 'SVG illustrator. Create atmospheric background SVG (viewBox="0 0 800 450").\nPalette: ' + palettes[rs] + '\nNo faces. Use rect,circle,ellipse,line,polygon. Keep center clear for text.\nReturn ONLY raw SVG from <svg to </svg>.'
    const raw = await callAI(system, 'Background for: "' + visual + '"', 1500)
    const s = raw.indexOf('<svg'), e = raw.lastIndexOf('</svg>') + 6
    if (s === -1) throw new Error('No SVG')
    return raw.slice(s, e)
}

function buildReelHtml(scenes: ReelScene[], svgs: string[], story: Story, rs: ReelStyle): string {
    const c = getStyleCfg(rs)
    const total = scenes.length
    const dur = c.duration
    const ac = c.accentColor
    const bg0 = 'rgba(255,255,255,0.4)'
    const fonts: Record<ReelStyle, string> = {
        cinematic: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,400&family=EB+Garamond:ital@1&display=swap',
        animated: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;700&display=swap',
        historical: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap',
        modern: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=DM+Serif+Display:ital@1&display=swap',
    }

    const slides = scenes.map((scene, i) => {
        const svgUrl = svgs[i] ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgs[i]) : ''
        const bgDiv = svgUrl ? '<div style="position:absolute;inset:0;background-image:url(\'' + svgUrl + '\');background-size:cover;background-position:center;opacity:0.85;"></div>' : ''
        const shadow = c.hasShadow ? 'text-shadow:0 2px 20px rgba(0,0,0,0.5);' : ''
        const divW = rs === 'modern' ? '32' : '60'
        const divH = rs === 'modern' ? '3' : '1'
        const film = rs === 'historical' ? '<div style="position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(139,88,20,0.03) 2px,rgba(139,88,20,0.03) 4px);pointer-events:none;"></div>' : ''
        return '<div class="slide" id="slide-' + i + '" style="display:' + (i === 0 ? 'flex' : 'none') + ';position:relative;width:100%;height:100%;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:' + c.bg + ';overflow:hidden;">'
            + bgDiv
            + '<div style="position:absolute;inset:0;background:' + c.overlay + ';"></div>'
            + '<div class="sc" style="position:relative;z-index:2;padding:40px 60px;max-width:780px;">'
            + '<div style="font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:' + ac + ';margin-bottom:20px;opacity:.85;">' + (i + 1) + ' / ' + total + '</div>'
            + '<h2 style="font-family:' + c.titleFont + ';font-size:' + c.titleSize + ';font-weight:' + c.titleWeight + ';color:' + c.textColor + ';line-height:1.15;margin-bottom:24px;' + shadow + '">' + escHtml(scene.title) + '</h2>'
            + '<div style="width:' + divW + 'px;height:' + divH + 'px;background:' + ac + ';margin:0 auto 24px;"></div>'
            + '<p style="font-family:' + c.quoteFont + ';font-size:' + c.quoteSize + ';color:' + c.textColor + ';line-height:1.7;font-style:' + c.quoteItalic + ';opacity:.9;max-width:600px;margin:0 auto;">&ldquo;' + escHtml(scene.quote) + '&rdquo;</p>'
            + '</div>' + film + '</div>'
    }).join('\n')

    const dots = scenes.map((_, i) =>
        '<div class="dot" id="dot-' + i + '" onclick="goTo(' + i + ')" style="width:8px;height:8px;border-radius:50%;cursor:pointer;background:' + (i === 0 ? ac : bg0) + ';transition:all .3s;"></div>'
    ).join('')

    const css = '* {margin:0;padding:0;box-sizing:border-box;}'
        + 'body{background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;}'
        + '.reel-frame{width:900px;height:506px;position:relative;overflow:hidden;border-radius:' + c.borderRadius + ';}'
        + '.slide{animation:rf .6s ease;}'
        + '@keyframes rf{from{opacity:0;transform:scale(1.02);}to{opacity:1;transform:scale(1);}}'
        + '.sc{animation:sc .7s .3s both ease;}'
        + '@keyframes sc{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}'
        + '.controls{position:absolute;bottom:0;left:0;right:0;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;z-index:10;background:linear-gradient(transparent,rgba(0,0,0,.4));}'
        + '.ctrl-btn{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);color:#fff;padding:8px 18px;border-radius:999px;cursor:pointer;font-size:13px;font-weight:600;transition:all .2s;}'
        + '.ctrl-btn:hover{background:rgba(255,255,255,.25);}'
        + '.ctrl-btn.pause{background:' + ac + ';border-color:' + ac + ';}'
        + '.dots{display:flex;gap:8px;align-items:center;}'
        + '.dot:hover{transform:scale(1.4);}'
        + '.progress-bar{position:absolute;bottom:0;left:0;height:3px;background:' + ac + ';z-index:11;}'
        + '.story-label{font-size:11px;color:rgba(255,255,255,.7);font-weight:500;font-family:sans-serif;}'

    const js = 'let cur=0,total=' + total + ',timer=null,playing=true;'
        + 'const dur=' + dur + ';'
        + 'function goTo(n){'
        + 'document.getElementById("slide-"+cur).style.display="none";'
        + 'document.getElementById("dot-"+cur).style.background="' + bg0 + '";'
        + 'cur=n;const s=document.getElementById("slide-"+cur);'
        + 's.style.display="flex";void s.offsetWidth;'
        + 'document.getElementById("dot-"+cur).style.background="' + ac + '";'
        + 'resetProgress();}'
        + 'function next(){goTo((cur+1)%total);}'
        + 'function resetProgress(){'
        + 'const p=document.getElementById("progress");'
        + 'p.style.transition="none";p.style.width="0%";'
        + 'requestAnimationFrame(()=>requestAnimationFrame(()=>{'
        + 'p.style.transition="width "+dur+"ms linear";p.style.width="100%";}));}'
        + 'function togglePlay(){'
        + 'playing=!playing;'
        + 'document.getElementById("playBtn").textContent=playing?"\\u23F8 Pause":"\\u25B6 Play";'
        + 'document.getElementById("playBtn").className=playing?"ctrl-btn pause":"ctrl-btn";'
        + 'if(playing){startAuto();}else{clearTimeout(timer);}}'
        + 'function startAuto(){clearTimeout(timer);if(playing)timer=setTimeout(()=>{next();startAuto();},dur);}'
        + 'resetProgress();startAuto();'
        + 'document.getElementById("reel").addEventListener("click",function(e){if(!e.target.closest(".controls")){next();}});'

    return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + escHtml(story.title) + '</title>'
        + '<link rel="preconnect" href="https://fonts.googleapis.com">'
        + '<link href="' + fonts[rs] + '" rel="stylesheet">'
        + '<style>' + css + '</style></head><body>'
        + '<div class="reel-frame" id="reel">' + slides
        + '<div class="progress-bar" id="progress" style="width:0%"></div>'
        + '<div class="controls"><span class="story-label">' + escHtml(story.title) + '</span>'
        + '<div class="dots">' + dots + '</div>'
        + '<button class="ctrl-btn pause" id="playBtn" onclick="togglePlay()">&#9208; Pause</button>'
        + '</div></div>'
        + '<scri' + 'pt>' + js + '</scri' + 'pt></body></html>'
}

interface StoryReelProps { story: Story; lang: 'en' | 'he' }

const StoryReel = ({ story, lang }: StoryReelProps) => {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState('')
    const [reelStyle, setReelStyle] = useState<ReelStyle>('cinematic')
    const [reelHtml, setReelHtml] = useState('')
    const [error, setError] = useState('')

    const handleCreate = async () => {
        setLoading(true); setError(''); setReelHtml('')
        try {
            setProgress(lang === 'he' ? 'מחלץ סצנות…' : 'Extracting scenes…')
            const scenes = await extractScenes(story, lang)
            const svgs: string[] = []
            for (let i = 0; i < scenes.length; i++) {
                setProgress(lang === 'he' ? 'סצנה ' + (i + 1) + '/' + scenes.length : 'Scene ' + (i + 1) + '/' + scenes.length)
                try { svgs.push(await generateSceneSVG(scenes[i].visual, reelStyle)) } catch { svgs.push('') }
            }
            setProgress(lang === 'he' ? 'בונה רילס…' : 'Building reel…')
            setReelHtml(buildReelHtml(scenes, svgs, story, reelStyle))
        } catch (e) { setError(lang === 'he' ? 'שגיאה — נסה שוב.' : 'Error — please try again.'); console.error(e) }
        finally { setLoading(false); setProgress('') }
    }

    const handleDownload = () => {
        if (!reelHtml) return
        const name = story.title.replace(/\s+/g, '_').replace(/[^\w-]/g, '')
        const blob = new Blob([reelHtml], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = name + '_reel.html'; a.click()
        URL.revokeObjectURL(url)
    }

    const handleShare = async () => {
        if (!reelHtml) return
        const name = story.title.replace(/\s+/g, '_').replace(/[^\w-]/g, '')
        const blob = new Blob([reelHtml], { type: 'text/html' })
        const file = new File([blob], name + '_reel.html', { type: 'text/html' })
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try { await navigator.share({ title: story.title, files: [file] }) } catch { /* cancelled */ }
        } else { handleDownload() }
    }

    return (
        <>
            <button className={styles.createBtn} onClick={() => setOpen(true)}>
                <MovieIcon sx={{ fontSize: 16 }} />
                {lang === 'he' ? 'צור רילס' : 'Create Reel'}
            </button>

            {open && (
                <div className={styles.overlay} onClick={() => { if (!loading) setOpen(false) }}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h2 className={styles.modalTitle}>{lang === 'he' ? '✦ צור רילס לסיפור' : '✦ Create Story Reel'}</h2>
                                <p className={styles.modalSub}>{story.title}</p>
                            </div>
                            <button className={styles.closeBtn} onClick={() => { if (!loading) setOpen(false) }}>
                                <CloseIcon sx={{ fontSize: 18 }} />
                            </button>
                        </div>

                        {!reelHtml && !loading && (
                            <div className={styles.stylePicker}>
                                <p className={styles.stylePickerLabel}>{lang === 'he' ? 'בחר סגנון:' : 'Choose a visual style:'}</p>
                                <div className={styles.styleGrid}>
                                    {REEL_STYLES.map(s => (
                                        <button key={s.key}
                                            className={[styles.styleCard, reelStyle === s.key ? styles.styleCardActive : ''].join(' ')}
                                            onClick={() => setReelStyle(s.key)}>
                                            <span className={styles.styleEmoji}>{s.emoji}</span>
                                            <span className={styles.styleLabel}>{lang === 'he' ? s.labelHe : s.label}</span>
                                            <span className={styles.styleDesc}>{s.desc}</span>
                                        </button>
                                    ))}
                                </div>
                                <button className={styles.generateBtn} onClick={handleCreate}>
                                    <MovieIcon sx={{ fontSize: 16 }} />
                                    {lang === 'he' ? 'צור רילס ✦' : 'Generate Reel ✦'}
                                </button>
                            </div>
                        )}

                        {loading && (
                            <div className={styles.loadingState}>
                                <CircularProgress size={36} sx={{ color: '#c9954a' }} />
                                <p className={styles.loadingMsg}>{progress}</p>
                                <p className={styles.loadingHint}>{lang === 'he' ? 'כ-30 שניות…' : 'About 30 seconds…'}</p>
                            </div>
                        )}

                        {error && !loading && (
                            <div className={styles.errorState}>
                                <p>{error}</p>
                                <button className={styles.retryBtn} onClick={handleCreate}>{lang === 'he' ? 'נסה שוב' : 'Try again'}</button>
                            </div>
                        )}

                        {reelHtml && !loading && (
                            <div className={styles.previewSection}>
                                <iframe className={styles.reelFrame} srcDoc={reelHtml} title="Story Reel" sandbox="allow-scripts allow-same-origin" />
                                <div className={styles.actionRow}>
                                    <button className={styles.actionBtn} onClick={() => { setReelHtml(''); setError('') }}>
                                        {lang === 'he' ? '↺ צור מחדש' : '↺ Regenerate'}
                                    </button>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <Tooltip title={lang === 'he' ? 'שתף' : 'Share'}>
                                            <button className={styles.shareBtn} onClick={handleShare}>
                                                <ShareIcon sx={{ fontSize: 16 }} /> {lang === 'he' ? 'שתף' : 'Share'}
                                            </button>
                                        </Tooltip>
                                        <button className={styles.downloadBtn} onClick={handleDownload}>
                                            <DownloadIcon sx={{ fontSize: 16 }} /> {lang === 'he' ? 'הורד' : 'Download'}
                                        </button>
                                    </div>
                                </div>
                                <p className={styles.downloadHint}>
                                    {lang === 'he' ? 'הורד HTML ופתח בדפדפן. לוידאו — הקלט את המסך.' : 'Download HTML and open in browser. For video — use screen recorder.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}

export default StoryReel