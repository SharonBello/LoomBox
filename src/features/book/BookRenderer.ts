import type { BookConfig, Story, FamilyMember, Recipe } from '@/types'

export type PageSize = 'a4-portrait' | 'landscape-10x8'

export interface BookData {
  config: BookConfig
  stories: Story[]
  members: FamilyMember[]
  recipes: Recipe[]
  pageSize?: PageSize
}

// ── Helpers ───────────────────────────────────────────────
const esc = (s: string) =>
  (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const bodyHtml = (text: string) =>
  text.split('\n').filter(p => p.trim())
    .map(p => `<p>${esc(p.replace(/\*\*(.*?)\*\*/g, '$1'))}</p>`).join('')

// ── Print + screen CSS shared by all styles ───────────────
const baseCss = (size: PageSize) => {
  const landscape = size === 'landscape-10x8'
  const w = landscape ? '254mm' : '210mm'
  const h = landscape ? '203mm' : '297mm'
  return `
@media print {
  @page { size: ${w} ${h}; margin: 0; }
  body { margin:0; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .no-print { display:none !important; }
  .page { break-after:page; box-shadow:none !important; margin:0 !important; border:none !important; }
}
@media screen {
  body { background:#888; padding:24px 0; }
  .page { margin:0 auto 32px; box-shadow:0 6px 48px rgba(0,0,0,0.3); }
}
.page { width:${w}; min-height:${h}; position:relative; overflow:hidden; page-break-after:always; }
.full-bleed { padding:0 !important; }
.full-bleed img { width:100%; height:${h}; object-fit:cover; display:block; }
.full-bleed .caption { position:absolute; bottom:0; left:0; right:0; padding:${landscape ? '14px 18px' : '18px 22px'};
  background:linear-gradient(transparent,rgba(0,0,0,0.65)); color:#fff; }
.split-page { display:grid !important; grid-template-columns:1fr 1fr; gap:0; padding:0 !important; min-height:${h}; }
.split-page .s-img { overflow:hidden; }
.split-page .s-img img { width:100%; height:100%; object-fit:cover; display:block; }
.split-page .s-txt { display:flex; flex-direction:column; justify-content:center;
  padding:${landscape ? '24px 28px' : '36px 40px'}; }
.quote-pg { display:flex; flex-direction:column; align-items:center; justify-content:center;
  text-align:center; min-height:${h}; }
`}

// ── HERITAGE ─────────────────────────────────────────────
const heritageCSS = (size: PageSize) => {
  const lnd = size === 'landscape-10x8'
  return `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,400&family=EB+Garamond:ital,wght@0,400;1,400&display=swap');
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'EB Garamond',Georgia,serif; color:#2c1a0e; }
${baseCss(size)}
.page { background:#fdf6ec; padding:${lnd ? '18mm 20mm' : '22mm 24mm'}; }
.page::before { content:''; position:absolute; inset:8px; border:1px solid #c9a87a; pointer-events:none; z-index:1; }
.cover { display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; min-height:${lnd ? '160mm' : '250mm'}; }
.cover-orn { font-size:20px; color:#8b5c2a; margin-bottom:24px; letter-spacing:10px; }
.cover-title { font-family:'Cormorant Garamond',serif; font-size:${lnd ? '44' : '52'}px; font-weight:300; line-height:1.15; margin-bottom:12px; }
.cover-sub { font-family:'Cormorant Garamond',serif; font-size:17px; color:#8b5c2a; font-style:italic; margin-bottom:28px; }
.cover-rule { width:80px; height:1px; background:#c9a87a; margin:0 auto 28px; }
.cover-ded { font-size:13px; color:#6b4423; font-style:italic; line-height:1.8; max-width:${lnd ? '320' : '370'}px; }
.ch-hdr { text-align:center; margin-bottom:${lnd ? '28' : '36'}px; padding-bottom:18px; border-bottom:1px solid #c9a87a; }
.ch-orn { font-size:12px; color:#8b5c2a; letter-spacing:5px; margin-bottom:6px; }
.ch-title { font-family:'Cormorant Garamond',serif; font-size:${lnd ? '24' : '28'}px; font-weight:300; text-transform:uppercase; letter-spacing:0.06em; }
.story { margin-bottom:${lnd ? '28' : '36'}px; padding-bottom:${lnd ? '28' : '36'}px; border-bottom:1px solid rgba(201,168,122,0.3); }
.story:last-of-type { border-bottom:none; }
.s-meta { font-size:9px; color:#8b5c2a; text-transform:uppercase; letter-spacing:0.12em; margin-bottom:5px; }
.s-title { font-family:'Cormorant Garamond',serif; font-size:${lnd ? '20' : '24'}px; font-style:italic; margin-bottom:10px; }
.s-ctx { background:#f0e4d0; border-left:3px solid #c9a87a; padding:9px 12px; margin-bottom:12px; font-size:11.5px; color:#6b4423; font-style:italic; line-height:1.7; }
.s-img { display:grid; grid-template-columns:${lnd ? '160px' : '180px'} 1fr; gap:16px; margin-bottom:10px; }
.s-img img { width:100%; height:${lnd ? '120' : '150'}px; object-fit:cover; }
.s-body p { font-size:${lnd ? '12.5' : '13.5'}px; line-height:1.85; margin-bottom:10px; text-align:justify; }
.s-body p:first-child::first-letter { font-size:40px; font-family:'Cormorant Garamond',serif; float:left; line-height:0.8; margin:3px 6px 0 0; color:#8b5c2a; }
.quote-pg { background:#2c1a0e; color:#fdf6ec; }
.quote-pg .qm { font-family:'Cormorant Garamond',serif; font-size:64px; color:#c9a87a; line-height:0.7; margin-bottom:12px; }
.quote-pg .qt { font-family:'Cormorant Garamond',serif; font-size:${lnd ? '20' : '24'}px; font-style:italic; line-height:1.6; max-width:78%; }
.quote-pg .qa { font-size:10px; color:#c9a87a; letter-spacing:0.1em; text-transform:uppercase; margin-top:16px; }
.split-page .s-txt { background:#fdf6ec; }
.split-page .s-txt .s-title { font-family:'Cormorant Garamond',serif; font-size:22px; font-style:italic; margin-bottom:12px; }
.split-page .s-txt .s-body p { font-size:12px; line-height:1.8; margin-bottom:10px; }
.m-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.m-card { padding:14px; border:1px solid #c9a87a; background:rgba(201,168,122,0.05); }
.m-name { font-family:'Cormorant Garamond',serif; font-size:17px; margin-bottom:3px; }
.m-dates { font-size:10px; color:#8b5c2a; margin-bottom:5px; }
.m-bio { font-size:11.5px; color:#6b4423; font-style:italic; line-height:1.6; }
.r-title { font-family:'Cormorant Garamond',serif; font-size:20px; font-style:italic; margin-bottom:4px; }
.r-from { font-size:9px; color:#8b5c2a; letter-spacing:0.06em; text-transform:uppercase; margin-bottom:10px; }
.r-story { background:#f0e4d0; border-left:3px solid #c9a87a; padding:9px 12px; margin-bottom:12px; font-size:11.5px; color:#6b4423; font-style:italic; line-height:1.7; }
.r-label { font-size:10px; font-weight:500; text-transform:uppercase; letter-spacing:0.08em; color:#8b5c2a; margin:10px 0 5px; }
.r-pre { font-size:11.5px; line-height:1.75; white-space:pre-wrap; }
.pgn { position:absolute; bottom:${lnd ? '9' : '12'}mm; left:0; right:0; text-align:center; font-size:10px; color:#8b5c2a; letter-spacing:0.08em; font-family:'Cormorant Garamond',serif; }
.caption { font-family:'Cormorant Garamond',serif; font-size:15px; font-style:italic; }
`}

// ── CANVAS ────────────────────────────────────────────────
const canvasCSS = (size: PageSize) => {
  const lnd = size === 'landscape-10x8'
  return `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'DM Sans',system-ui,sans-serif; color:#111; }
${baseCss(size)}
.page { background:#fff; padding:${lnd ? '16mm 18mm' : '20mm 22mm'}; }
.cover { display:flex; flex-direction:column; justify-content:flex-end; min-height:${lnd ? '165mm' : '260mm'}; padding-bottom:${lnd ? '10mm' : '14mm'}; }
.cover-ey { font-size:9px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:#888; margin-bottom:18px; }
.cover-title { font-family:'DM Serif Display',serif; font-size:${lnd ? '48' : '60'}px; line-height:1.05; margin-bottom:14px; }
.cover-sub { font-size:15px; color:#444; font-weight:300; margin-bottom:28px; }
.cover-rule { width:32px; height:3px; background:#111; margin-bottom:28px; }
.cover-ded { font-size:13px; color:#666; line-height:1.8; font-style:italic; }
.ch-hdr { margin-bottom:${lnd ? '28' : '36'}px; padding-bottom:16px; border-bottom:2px solid #111; }
.ch-lbl { font-size:9px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:#888; margin-bottom:5px; }
.ch-title { font-family:'DM Serif Display',serif; font-size:${lnd ? '28' : '34'}px; }
.story { margin-bottom:${lnd ? '28' : '36'}px; }
.s-meta { font-size:9px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:#888; margin-bottom:5px; }
.s-title { font-family:'DM Serif Display',serif; font-size:${lnd ? '20' : '24'}px; margin-bottom:12px; line-height:1.2; }
.s-ctx { border-left:3px solid #111; padding:9px 14px; margin-bottom:12px; font-size:12px; color:#555; line-height:1.75; }
.s-img { display:grid; grid-template-columns:${lnd ? '160px' : '180px'} 1fr; gap:16px; margin-bottom:8px; }
.s-img img { width:100%; height:${lnd ? '120' : '150'}px; object-fit:cover; }
.s-body p { font-size:${lnd ? '12.5' : '13'}px; line-height:1.85; margin-bottom:10px; }
.quote-pg { background:#111; color:#fff; }
.quote-pg .qt { font-family:'DM Serif Display',serif; font-size:${lnd ? '26' : '32'}px; line-height:1.35; max-width:78%; margin-bottom:20px; }
.quote-pg .qa { font-size:10px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:#888; }
.split-page .s-txt .s-title { font-family:'DM Serif Display',serif; font-size:22px; margin-bottom:12px; }
.split-page .s-txt .s-body p { font-size:12px; line-height:1.8; margin-bottom:10px; }
.m-list { display:flex; flex-direction:column; }
.m-row { display:flex; align-items:flex-start; gap:16px; padding:10px 0; border-bottom:1px solid #eee; }
.m-name { font-family:'DM Serif Display',serif; font-size:15px; min-width:160px; }
.m-dates { font-size:10px; color:#888; }
.m-bio { font-size:11px; color:#555; font-style:italic; }
.r-title { font-family:'DM Serif Display',serif; font-size:20px; margin-bottom:4px; }
.r-from { font-size:9px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:#888; margin-bottom:12px; }
.r-story { border-left:3px solid #111; padding:9px 14px; margin-bottom:12px; font-size:12px; color:#555; font-style:italic; line-height:1.75; }
.r-cols { display:grid; grid-template-columns:${lnd ? '1fr 1.4fr' : '1fr 2fr'}; gap:20px; }
.r-label { font-size:9px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:7px; }
.r-pre { font-size:12px; line-height:1.8; white-space:pre-wrap; font-family:'DM Sans',sans-serif; }
.pgn { position:absolute; bottom:${lnd ? '9' : '12'}mm; right:${lnd ? '10' : '12'}mm; font-size:10px; color:#bbb; }
.caption { font-size:13px; }
`}

// ── SCRAPBOOK ─────────────────────────────────────────────
const scrapbookCSS = (size: PageSize) => {
  const lnd = size === 'landscape-10x8'
  return `
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Nunito:ital,wght@0,400;0,600;1,400&display=swap');
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Nunito',sans-serif; color:#3d2b1f; }
${baseCss(size)}
.page { background:#fdf8f0; padding:${lnd ? '16mm 18mm' : '20mm 22mm'}; }
.cover { display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; min-height:${lnd ? '160mm' : '250mm'}; }
.cover-hrt { font-size:32px; margin-bottom:14px; }
.cover-title { font-family:'Caveat',cursive; font-size:${lnd ? '50' : '58'}px; font-weight:700; transform:rotate(-1deg); margin-bottom:8px; }
.cover-sub { font-family:'Caveat',cursive; font-size:20px; color:#8b5c2a; margin-bottom:24px; }
.cover-stars { font-size:16px; color:#c9954a; letter-spacing:8px; margin-bottom:22px; }
.cover-ded { font-family:'Caveat',cursive; font-size:15px; color:#6b4423; line-height:1.7; max-width:300px; background:rgba(201,149,74,0.08); padding:12px 16px; border-radius:8px; border:1px dashed #c9a87a; }
.ch-hdr { display:flex; align-items:center; gap:10px; margin-bottom:${lnd ? '22' : '28'}px; }
.ch-title { font-family:'Caveat',cursive; font-size:${lnd ? '26' : '30'}px; font-weight:700; white-space:nowrap; }
.ch-deco { flex:1; height:2px; background:repeating-linear-gradient(90deg,#c9a87a 0,#c9a87a 5px,transparent 5px,transparent 10px); }
.story { margin-bottom:${lnd ? '20' : '26'}px; background:#fff; border-radius:8px; padding:${lnd ? '14px' : '18px'}; box-shadow:1px 2px 6px rgba(0,0,0,0.06); }
.s-meta { font-family:'Caveat',cursive; font-size:13px; color:#8b5c2a; margin-bottom:3px; }
.s-title { font-family:'Caveat',cursive; font-size:${lnd ? '19' : '22'}px; font-weight:700; margin-bottom:8px; }
.s-ctx { background:#fdf0e0; border-left:3px solid #c9a87a; padding:7px 10px; margin-bottom:10px; font-size:11.5px; color:#6b4423; font-style:italic; line-height:1.7; border-radius:0 5px 5px 0; }
.s-img { display:grid; grid-template-columns:${lnd ? '140px' : '160px'} 1fr; gap:14px; margin-bottom:8px; }
.s-img img { width:100%; height:${lnd ? '110' : '130'}px; object-fit:cover; border-radius:4px; }
.s-body p { font-size:${lnd ? '12' : '13'}px; line-height:1.75; margin-bottom:8px; }
.quote-pg { background:#3d2b1f; }
.quote-pg .qt { font-family:'Caveat',cursive; font-size:${lnd ? '26' : '32'}px; color:#fdf8f0; line-height:1.5; max-width:80%; margin-bottom:16px; }
.quote-pg .qa { font-family:'Caveat',cursive; font-size:15px; color:#c9a87a; }
.split-page .s-txt { background:#fdf8f0; }
.split-page .s-txt .s-title { font-family:'Caveat',cursive; font-size:22px; font-weight:700; margin-bottom:10px; }
.split-page .s-txt .s-body p { font-size:12px; line-height:1.75; margin-bottom:8px; }
.m-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.m-card { background:#fff; border-radius:8px; padding:12px; border-top:3px solid #c9a87a; }
.m-name { font-family:'Caveat',cursive; font-size:17px; font-weight:700; margin-bottom:3px; }
.m-dates { font-size:10px; color:#8b5c2a; margin-bottom:4px; }
.m-bio { font-size:11px; color:#6b4423; font-style:italic; line-height:1.55; }
.recipe { background:#fff; border-radius:8px; padding:${lnd ? '14px' : '18px'}; margin-bottom:${lnd ? '14' : '18'}px; }
.r-title { font-family:'Caveat',cursive; font-size:${lnd ? '20' : '22'}px; font-weight:700; margin-bottom:3px; }
.r-from { font-family:'Caveat',cursive; font-size:14px; color:#8b5c2a; margin-bottom:10px; }
.r-story { background:#fdf0e0; border-radius:6px; padding:9px 11px; margin-bottom:10px; font-size:11.5px; color:#6b4423; font-style:italic; line-height:1.7; }
.r-label { font-family:'Caveat',cursive; font-size:14px; font-weight:700; margin:8px 0 4px; }
.r-pre { font-size:11.5px; line-height:1.75; white-space:pre-wrap; font-family:'Nunito',sans-serif; }
.pgn { position:absolute; bottom:${lnd ? '9' : '12'}mm; left:0; right:0; text-align:center; font-family:'Caveat',cursive; font-size:14px; color:#c9a87a; }
.caption { font-family:'Caveat',cursive; font-size:16px; }
`}

// ── Page builders ─────────────────────────────────────────
const coverPageHtml = (config: BookConfig) => {
  const s = config.style
  return `<div class="page">
    <div class="cover">
      ${s === 'heritage' ? '<div class="cover-orn">✦ ✦ ✦</div>' : ''}
      ${s === 'canvas' ? '<p class="cover-ey">A Family Archive</p>' : ''}
      ${s === 'scrapbook' ? '<div class="cover-hrt">♡</div>' : ''}
      <h1 class="cover-title">${esc(config.title)}</h1>
      ${config.subtitle ? `<p class="cover-sub">${esc(config.subtitle)}</p>` : ''}
      <div class="cover-rule"></div>
      ${config.dedication ? `<p class="cover-ded">${esc(config.dedication)}</p>` : ''}
      ${s === 'scrapbook' ? '<div class="cover-stars">★ ★ ★</div>' : ''}
    </div>
  </div>`
}

const fullBleedHtml = (url: string, caption: string) => `
  <div class="page full-bleed">
    <img src="${esc(url)}" alt="${esc(caption)}" />
    ${caption ? `<div class="caption">${esc(caption)}</div>` : ''}
  </div>`

const splitPageHtml = (url: string, title: string, text: string, imgLeft = true) => {
  const img = `<div class="s-img"><img src="${esc(url)}" alt="${esc(title)}" /></div>`
  const txt = `<div class="s-txt"><div class="s-title">${esc(title)}</div><div class="s-body">${bodyHtml(text)}</div></div>`
  return `<div class="page split-page">${imgLeft ? img + txt : txt + img}</div>`
}

const quotePageHtml = (q: string, attr: string, style: string) => `
  <div class="page quote-pg">
    ${style === 'heritage' ? '<div class="qm">"</div>' : ''}
    <div class="qt">${esc(q)}</div>
    ${attr ? `<div class="qa">— ${esc(attr)}</div>` : ''}
  </div>`

// ── Story section ─────────────────────────────────────────
const storiesHtml = (stories: Story[], config: BookConfig) => {
  const s = config.style
  const chLbl = s === 'canvas' ? '<div class="ch-lbl">Chapter One</div>' : ''
  const chOrn = s === 'heritage' ? '<div class="ch-orn">✦ ✦ ✦</div>' : ''
  const chDeco = s === 'scrapbook' ? '<div class="ch-deco"></div>' : ''
  const chTitl = s === 'scrapbook' ? 'Our Stories 📖' : 'Stories'

  return `<div class="page">
    <div class="ch-hdr">
      ${chLbl}${chOrn}
      <h2 class="ch-title">${chTitl}</h2>
      ${chDeco}
    </div>
    ${stories.map(story => {
    const hasImg = !!story.aiImageUrl
    return `<div class="story">
        ${story.era || story.location ? `<p class="s-meta">${esc([story.location, story.era].filter(Boolean).join(' · '))}</p>` : ''}
        ${hasImg ? `<div class="s-img"><img src="${esc(story.aiImageUrl!)}" alt="${esc(story.title)}" /><div><h3 class="s-title">${esc(story.title)}</h3>${story.historicalContext ? `<div class="s-ctx">${esc(story.historicalContext)}</div>` : ''}</div></div>`
        : `<h3 class="s-title">${esc(story.title)}</h3>${story.historicalContext ? `<div class="s-ctx">${esc(story.historicalContext)}</div>` : ''}`}
        <div class="s-body">${bodyHtml(story.enhancedContent ?? story.content)}</div>
      </div>`
  }).join('')}
    <div class="pgn">— Stories —</div>
  </div>`
}

// ── Tree section ──────────────────────────────────────────
const treeHtml = (members: FamilyMember[], config: BookConfig) => {
  const s = config.style
  const grid = s === 'canvas'
    ? `<div class="m-list">${members.map(m => `<div class="m-row"><div><div class="m-name">${esc(m.name)}</div>${m.bio ? `<div class="m-bio">${esc(m.bio)}</div>` : ''}</div><div>${m.born || m.died ? `<div class="m-dates">${[m.born, m.died].filter(Boolean).join(' – ')}</div>` : ''}</div></div>`).join('')}</div>`
    : `<div class="m-grid">${members.map(m => `<div class="m-card"><div class="m-name">${esc(m.name)}</div>${m.born || m.died ? `<div class="m-dates">${[m.born, m.died].filter(Boolean).join(' – ')}</div>` : ''} ${m.birthplace ? `<div class="m-dates">${esc(m.birthplace)}</div>` : ''} ${m.bio ? `<div class="m-bio">${esc(m.bio)}</div>` : ''}</div>`).join('')}</div>`

  return `<div class="page">
    <div class="ch-hdr">
      ${s === 'canvas' ? '<div class="ch-lbl">Chapter Two</div>' : ''}
      ${s === 'heritage' ? '<div class="ch-orn">✦ ✦ ✦</div>' : ''}
      <h2 class="ch-title">${s === 'scrapbook' ? 'Our Family 🌳' : 'Family Tree'}</h2>
      ${s === 'scrapbook' ? '<div class="ch-deco"></div>' : ''}
    </div>
    ${grid}
    <div class="pgn">— Family Tree —</div>
  </div>`
}

// ── Recipes section ───────────────────────────────────────
const recipesHtml = (recipes: Recipe[], config: BookConfig) => {
  const s = config.style
  const rcpHtml = (r: Recipe) => {
    const cols = s === 'canvas'
      ? `<div class="r-cols"><div><div class="r-label">Ingredients</div><pre class="r-pre">${esc(r.ingredients)}</pre></div><div><div class="r-label">Instructions</div><pre class="r-pre">${esc(r.steps)}</pre></div></div>`
      : `<div class="r-label">${s === 'scrapbook' ? '📝 ' : ''}Ingredients</div><pre class="r-pre">${esc(r.ingredients)}</pre><div class="r-label">${s === 'scrapbook' ? '👩‍🍳 ' : ''}Instructions</div><pre class="r-pre">${esc(r.steps)}</pre>`
    return `<div class="recipe">
      <div class="r-title">${esc(r.name)}</div>
      ${r.from ? `<div class="r-from">${s === 'scrapbook' ? '💝 ' : ''}Passed down from ${esc(r.from)}</div>` : ''}
      ${r.storyText ? `<div class="r-story">${esc(r.storyText)}</div>` : ''}
      ${cols}
    </div>`
  }

  return `<div class="page">
    <div class="ch-hdr">
      ${s === 'canvas' ? '<div class="ch-lbl">Chapter Three</div>' : ''}
      ${s === 'heritage' ? '<div class="ch-orn">✦ ✦ ✦</div>' : ''}
      <h2 class="ch-title">${s === 'scrapbook' ? 'Family Recipes 🍳' : 'Family Recipes'}</h2>
      ${s === 'scrapbook' ? '<div class="ch-deco"></div>' : ''}
    </div>
    ${recipes.map(rcpHtml).join('')}
    <div class="pgn">— Recipes —</div>
  </div>`
}

// ── Main render ───────────────────────────────────────────
export const renderBook = (data: BookData): string => {
  const { config, stories, members, recipes } = data
  const size = data.pageSize ?? 'landscape-10x8'
  const cssMap = { heritage: heritageCSS, canvas: canvasCSS, scrapbook: scrapbookCSS }
  const css = cssMap[config.style](size)
  const enabledSections = [...config.sections].filter(s => s.enabled).sort((a, b) => a.order - b.order)

  const pages: string[] = [coverPageHtml(config)]

  if (config.dedication) {
    pages.push(quotePageHtml(config.dedication, config.title, config.style))
  }

  enabledSections.forEach(sec => {
    if (sec.type === 'stories' && stories.length > 0) {
      pages.push(storiesHtml(stories, config))
      // Full-bleed photo spread for each story with an image
      stories.filter(s => s.aiImageUrl).forEach((s, i) => {
        if (i % 2 === 0) {
          pages.push(fullBleedHtml(s.aiImageUrl!, s.title))
        } else {
          pages.push(splitPageHtml(s.aiImageUrl!, s.title, s.enhancedContent ?? s.content, i % 4 < 2))
        }
      })
    }
    if (sec.type === 'tree' && members.length > 0) pages.push(treeHtml(members, config))
    if (sec.type === 'recipes' && recipes.length > 0) pages.push(recipesHtml(recipes, config))
  })

  const sizeLabel = size === 'landscape-10x8' ? '10×8" Landscape — Blurb / Lulu ready' : 'A4 Portrait'
  const printBar = `
    <div class="no-print" style="position:fixed;top:0;left:0;right:0;z-index:9999;
      background:#1a1929;color:#fff;padding:10px 20px;
      display:flex;align-items:center;justify-content:space-between;
      font-family:system-ui,sans-serif;font-size:13px;gap:16px">
      <span style="opacity:.7">📖 ${esc(config.title)} &nbsp;·&nbsp; ${sizeLabel}</span>
      <div style="display:flex;gap:10px;flex-shrink:0">
        <button onclick="window.print()" style="background:#c9954a;color:#fff;border:none;
          padding:7px 18px;border-radius:7px;cursor:pointer;font-weight:600;font-size:13px">
          🖨 Print / Save PDF
        </button>
        <button onclick="this.closest('[style]').style.display='none'" style="background:transparent;
          border:none;color:#888;cursor:pointer;font-size:18px;padding:0 4px">×</button>
      </div>
    </div><div class="no-print" style="height:44px"></div>`

  return `<!DOCTYPE html><html lang="en"><head>
    <meta charset="utf-8">
    <title>${esc(config.title)}</title>
    <style>${css}</style>
  </head><body>${printBar}${pages.join('\n')}</body></html>`
}