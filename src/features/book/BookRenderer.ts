import type { BookConfig, Story, FamilyMember, Recipe } from '@/types'

// ── Data bundle passed to every renderer ─────────────────
export interface BookData {
  config:  BookConfig
  stories: Story[]
  members: FamilyMember[]
  recipes: Recipe[]
}

// ── Heritage style ────────────────────────────────────────
export const renderHeritage = (data: BookData): string => {
  const { config, stories, members, recipes } = data
  const enabledSections = config.sections
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order)

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f5ede0; font-family: 'EB Garamond', Georgia, serif; color: #2c1a0e; }
    .page { width: 794px; min-height: 1123px; margin: 0 auto 40px; background: #fdf6ec;
      padding: 80px 90px; position: relative; box-shadow: 0 4px 40px rgba(0,0,0,0.15);
      border: 1px solid #e2c89a; }
    .page::before { content:''; position:absolute; inset:12px; border:1px solid #c9a87a; pointer-events:none; }
    .page::after  { content:''; position:absolute; inset:18px; border:1px solid rgba(201,168,122,0.4); pointer-events:none; }
    .cover { text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:960px; }
    .cover-ornament { font-size:28px; color:#8b5c2a; margin-bottom:32px; letter-spacing:12px; }
    .cover-title { font-family:'Cormorant Garamond',serif; font-size:52px; font-weight:300;
      color:#2c1a0e; letter-spacing:-0.02em; line-height:1.2; margin-bottom:16px; }
    .cover-subtitle { font-family:'Cormorant Garamond',serif; font-size:20px; font-weight:400;
      color:#8b5c2a; font-style:italic; margin-bottom:48px; }
    .cover-rule { width:120px; height:1px; background:#c9a87a; margin:0 auto 48px; }
    .cover-dedication { font-size:15px; color:#6b4423; font-style:italic; line-height:1.8; max-width:400px; text-align:center; }
    .chapter-header { text-align:center; margin-bottom:48px; padding-bottom:32px; border-bottom:1px solid #c9a87a; }
    .chapter-ornament { font-size:16px; color:#8b5c2a; letter-spacing:8px; margin-bottom:12px; }
    .chapter-title { font-family:'Cormorant Garamond',serif; font-size:34px; font-weight:300;
      color:#2c1a0e; letter-spacing:0.04em; text-transform:uppercase; }
    .story { margin-bottom:56px; padding-bottom:56px; border-bottom:1px solid rgba(201,168,122,0.4); }
    .story:last-child { border-bottom:none; }
    .story-meta { font-size:11px; color:#8b5c2a; text-transform:uppercase; letter-spacing:0.12em;
      margin-bottom:8px; font-family:'Cormorant Garamond',serif; }
    .story-title { font-family:'Cormorant Garamond',serif; font-size:28px; font-weight:400;
      color:#2c1a0e; margin-bottom:16px; font-style:italic; }
    .story-context { background:#f0e4d0; border-left:3px solid #c9a87a; padding:12px 16px;
      margin-bottom:20px; font-size:13px; color:#6b4423; font-style:italic; line-height:1.7; }
    .story-image { width:100%; max-height:280px; object-fit:cover; margin-bottom:20px;
      border:1px solid #c9a87a; }
    .story-body p { font-size:15px; line-height:1.9; margin-bottom:16px; text-align:justify;
      text-indent:2em; color:#2c1a0e; }
    .story-body p:first-child { text-indent:0; }
    .story-body p:first-child::first-letter { font-size:52px; font-family:'Cormorant Garamond',serif;
      float:left; line-height:0.8; margin:6px 8px 0 0; color:#8b5c2a; }
    .member-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
    .member-card { padding:20px; border:1px solid #c9a87a; background:rgba(201,168,122,0.06); }
    .member-name { font-family:'Cormorant Garamond',serif; font-size:20px; font-weight:500;
      color:#2c1a0e; margin-bottom:6px; }
    .member-dates { font-size:12px; color:#8b5c2a; margin-bottom:8px; letter-spacing:0.04em; }
    .member-bio { font-size:13px; color:#6b4423; line-height:1.7; font-style:italic; }
    .recipe { margin-bottom:48px; padding-bottom:48px; border-bottom:1px solid rgba(201,168,122,0.4); }
    .recipe:last-child { border-bottom:none; }
    .recipe-title { font-family:'Cormorant Garamond',serif; font-size:26px; font-weight:400;
      color:#2c1a0e; margin-bottom:6px; font-style:italic; }
    .recipe-from { font-size:12px; color:#8b5c2a; letter-spacing:0.06em; text-transform:uppercase;
      margin-bottom:16px; }
    .recipe-story { background:#f0e4d0; border-left:3px solid #c9a87a; padding:12px 16px;
      margin-bottom:20px; font-size:13px; color:#6b4423; font-style:italic; line-height:1.7; }
    .recipe-section-label { font-family:'Cormorant Garamond',serif; font-size:14px; font-weight:500;
      text-transform:uppercase; letter-spacing:0.08em; color:#8b5c2a; margin:16px 0 8px; }
    .recipe-pre { font-size:13px; line-height:1.8; color:#2c1a0e; white-space:pre-wrap; }
    .page-number { position:absolute; bottom:36px; left:0; right:0; text-align:center;
      font-size:11px; color:#8b5c2a; letter-spacing:0.1em; font-family:'Cormorant Garamond',serif; }
  `

  const coverPage = `
    <div class="page">
      <div class="cover">
        <div class="cover-ornament">✦ ✦ ✦</div>
        <h1 class="cover-title">${escHtml(config.title)}</h1>
        ${config.subtitle ? `<p class="cover-subtitle">${escHtml(config.subtitle)}</p>` : ''}
        <div class="cover-rule"></div>
        ${config.dedication ? `<p class="cover-dedication">${escHtml(config.dedication)}</p>` : ''}
      </div>
    </div>`

  const pages: string[] = [coverPage]

  enabledSections.forEach(section => {
    if (section.type === 'stories' && stories.length > 0) {
      pages.push(`
        <div class="page">
          <div class="chapter-header">
            <div class="chapter-ornament">✦ ✦ ✦</div>
            <h2 class="chapter-title">Stories</h2>
          </div>
          ${stories.map(s => `
            <div class="story">
              ${s.era || s.location ? `<p class="story-meta">${[s.location, s.era].filter(Boolean).join(' · ')}</p>` : ''}
              <h3 class="story-title">${escHtml(s.title)}</h3>
              ${s.historicalContext ? `<div class="story-context">${escHtml(s.historicalContext)}</div>` : ''}
              ${s.aiImageUrl ? `<img src="${s.aiImageUrl}" class="story-image" alt="${escHtml(s.title)}" />` : ''}
              <div class="story-body">${formatBody(s.enhancedContent ?? s.content)}</div>
            </div>`).join('')}
          <div class="page-number">— Stories —</div>
        </div>`)
    }

    if (section.type === 'tree' && members.length > 0) {
      pages.push(`
        <div class="page">
          <div class="chapter-header">
            <div class="chapter-ornament">✦ ✦ ✦</div>
            <h2 class="chapter-title">Family Tree</h2>
          </div>
          <div class="member-grid">
            ${members.map(m => `
              <div class="member-card">
                <div class="member-name">${escHtml(m.name)}</div>
                ${m.born || m.died ? `<div class="member-dates">${[m.born, m.died].filter(Boolean).join(' – ')}</div>` : ''}
                ${m.birthplace ? `<div class="member-dates">${escHtml(m.birthplace)}</div>` : ''}
                ${m.bio ? `<div class="member-bio">${escHtml(m.bio)}</div>` : ''}
              </div>`).join('')}
          </div>
          <div class="page-number">— Family Tree —</div>
        </div>`)
    }

    if (section.type === 'recipes' && recipes.length > 0) {
      pages.push(`
        <div class="page">
          <div class="chapter-header">
            <div class="chapter-ornament">✦ ✦ ✦</div>
            <h2 class="chapter-title">Family Recipes</h2>
          </div>
          ${recipes.map(r => `
            <div class="recipe">
              <h3 class="recipe-title">${escHtml(r.name)}</h3>
              ${r.from ? `<p class="recipe-from">Passed down from ${escHtml(r.from)}</p>` : ''}
              ${r.storyText ? `<div class="recipe-story">${escHtml(r.storyText)}</div>` : ''}
              <div class="recipe-section-label">Ingredients</div>
              <pre class="recipe-pre">${escHtml(r.ingredients)}</pre>
              <div class="recipe-section-label">Instructions</div>
              <pre class="recipe-pre">${escHtml(r.steps)}</pre>
            </div>`).join('')}
          <div class="page-number">— Recipes —</div>
        </div>`)
    }
  })

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
    <style>${css}</style></head><body>${pages.join('\n')}</body></html>`
}

// ── Canvas style ──────────────────────────────────────────
export const renderCanvas = (data: BookData): string => {
  const { config, stories, members, recipes } = data
  const enabledSections = config.sections.filter(s => s.enabled).sort((a, b) => a.order - b.order)

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#e8e8e8; font-family:'DM Sans',system-ui,sans-serif; color:#111; }
    .page { width:794px; min-height:1123px; margin:0 auto 40px; background:#fff;
      padding:72px 80px; box-shadow:0 2px 24px rgba(0,0,0,0.12); }
    .cover { display:flex; flex-direction:column; justify-content:flex-end; min-height:960px; padding-bottom:80px; }
    .cover-eyebrow { font-size:11px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase;
      color:#888; margin-bottom:24px; }
    .cover-title { font-family:'DM Serif Display',serif; font-size:64px; font-weight:400;
      color:#111; line-height:1.05; margin-bottom:20px; }
    .cover-subtitle { font-size:18px; color:#444; font-weight:300; margin-bottom:48px; }
    .cover-rule { width:40px; height:3px; background:#111; margin-bottom:48px; }
    .cover-dedication { font-size:15px; color:#666; line-height:1.8; font-style:italic; }
    .chapter-header { margin-bottom:56px; padding-bottom:24px; border-bottom:2px solid #111; }
    .chapter-label { font-size:10px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase;
      color:#888; margin-bottom:8px; }
    .chapter-title { font-family:'DM Serif Display',serif; font-size:40px; color:#111; }
    .story { margin-bottom:64px; }
    .story-meta { font-size:10px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase;
      color:#888; margin-bottom:8px; }
    .story-title { font-family:'DM Serif Display',serif; font-size:28px; color:#111;
      margin-bottom:20px; line-height:1.2; }
    .story-context { border-left:3px solid #111; padding:12px 20px; margin-bottom:20px;
      font-size:13px; color:#555; line-height:1.75; }
    .story-image { width:100%; max-height:300px; object-fit:cover; margin-bottom:24px; }
    .story-body p { font-size:15px; line-height:1.85; margin-bottom:16px; color:#222; }
    .member-list { display:flex; flex-direction:column; gap:0; }
    .member-row { display:flex; align-items:baseline; gap:24px; padding:16px 0;
      border-bottom:1px solid #eee; }
    .member-name { font-family:'DM Serif Display',serif; font-size:18px; color:#111; min-width:200px; }
    .member-dates { font-size:12px; color:#888; font-weight:400; }
    .member-place { font-size:12px; color:#aaa; }
    .member-bio { font-size:13px; color:#555; font-style:italic; margin-top:4px; }
    .recipe { margin-bottom:56px; padding-bottom:56px; border-bottom:1px solid #eee; }
    .recipe:last-child { border-bottom:none; }
    .recipe-title { font-family:'DM Serif Display',serif; font-size:26px; color:#111; margin-bottom:6px; }
    .recipe-from { font-size:11px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase;
      color:#888; margin-bottom:20px; }
    .recipe-story { border-left:3px solid #111; padding:12px 20px; margin-bottom:20px;
      font-size:13px; color:#555; line-height:1.75; font-style:italic; }
    .recipe-cols { display:grid; grid-template-columns:1fr 2fr; gap:32px; }
    .recipe-section-label { font-size:10px; font-weight:700; letter-spacing:0.12em;
      text-transform:uppercase; color:#111; margin-bottom:10px; }
    .recipe-pre { font-size:13px; line-height:1.85; color:#333; white-space:pre-wrap;
      font-family:'DM Sans',sans-serif; }
    .page-number { text-align:right; margin-top:48px; font-size:11px; color:#bbb;
      font-weight:400; letter-spacing:0.06em; }
  `

  const coverPage = `
    <div class="page">
      <div class="cover">
        <p class="cover-eyebrow">A Family Archive</p>
        <h1 class="cover-title">${escHtml(config.title)}</h1>
        ${config.subtitle ? `<p class="cover-subtitle">${escHtml(config.subtitle)}</p>` : ''}
        <div class="cover-rule"></div>
        ${config.dedication ? `<p class="cover-dedication">${escHtml(config.dedication)}</p>` : ''}
      </div>
    </div>`

  const pages: string[] = [coverPage]

  enabledSections.forEach(section => {
    if (section.type === 'stories' && stories.length > 0) {
      pages.push(`<div class="page">
        <div class="chapter-header">
          <div class="chapter-label">Chapter One</div>
          <h2 class="chapter-title">Stories</h2>
        </div>
        ${stories.map(s => `
          <div class="story">
            ${s.era || s.location ? `<p class="story-meta">${[s.location, s.era].filter(Boolean).join(' · ')}</p>` : ''}
            <h3 class="story-title">${escHtml(s.title)}</h3>
            ${s.historicalContext ? `<div class="story-context">${escHtml(s.historicalContext)}</div>` : ''}
            ${s.aiImageUrl ? `<img src="${s.aiImageUrl}" class="story-image" alt="${escHtml(s.title)}" />` : ''}
            <div class="story-body">${formatBody(s.enhancedContent ?? s.content)}</div>
          </div>`).join('')}
        <div class="page-number">${stories.length} ${stories.length === 1 ? 'story' : 'stories'}</div>
      </div>`)
    }

    if (section.type === 'tree' && members.length > 0) {
      pages.push(`<div class="page">
        <div class="chapter-header">
          <div class="chapter-label">Chapter Two</div>
          <h2 class="chapter-title">Family Tree</h2>
        </div>
        <div class="member-list">
          ${members.map(m => `
            <div class="member-row">
              <div>
                <div class="member-name">${escHtml(m.name)}</div>
                ${m.bio ? `<div class="member-bio">${escHtml(m.bio)}</div>` : ''}
              </div>
              <div>
                ${m.born || m.died ? `<div class="member-dates">${[m.born, m.died].filter(Boolean).join(' – ')}</div>` : ''}
                ${m.birthplace ? `<div class="member-place">${escHtml(m.birthplace)}</div>` : ''}
              </div>
            </div>`).join('')}
        </div>
        <div class="page-number">${members.length} family members</div>
      </div>`)
    }

    if (section.type === 'recipes' && recipes.length > 0) {
      pages.push(`<div class="page">
        <div class="chapter-header">
          <div class="chapter-label">Chapter Three</div>
          <h2 class="chapter-title">Family Recipes</h2>
        </div>
        ${recipes.map(r => `
          <div class="recipe">
            <h3 class="recipe-title">${escHtml(r.name)}</h3>
            ${r.from ? `<p class="recipe-from">Passed down from ${escHtml(r.from)}</p>` : ''}
            ${r.storyText ? `<div class="recipe-story">${escHtml(r.storyText)}</div>` : ''}
            <div class="recipe-cols">
              <div>
                <div class="recipe-section-label">Ingredients</div>
                <pre class="recipe-pre">${escHtml(r.ingredients)}</pre>
              </div>
              <div>
                <div class="recipe-section-label">Instructions</div>
                <pre class="recipe-pre">${escHtml(r.steps)}</pre>
              </div>
            </div>
          </div>`).join('')}
      </div>`)
    }
  })

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${pages.join('\n')}</body></html>`
}

// ── Scrapbook style ───────────────────────────────────────
export const renderScrapbook = (data: BookData): string => {
  const { config, stories, members, recipes } = data
  const enabledSections = config.sections.filter(s => s.enabled).sort((a, b) => a.order - b.order)

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Nunito:ital,wght@0,400;0,600;1,400&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#f0e9d8; font-family:'Nunito',sans-serif; color:#3d2b1f; }
    .page { width:794px; min-height:1123px; margin:0 auto 40px; background:#fdf8f0;
      padding:64px 72px; box-shadow:2px 4px 20px rgba(0,0,0,0.12); position:relative; }
    .tape { position:absolute; top:-8px; left:50%; transform:translateX(-50%) rotate(-1deg);
      width:80px; height:24px; background:rgba(255,235,180,0.7); }
    .cover { text-align:center; display:flex; flex-direction:column; align-items:center;
      justify-content:center; min-height:960px; }
    .cover-heart { font-size:40px; margin-bottom:20px; }
    .cover-title { font-family:'Caveat',cursive; font-size:60px; font-weight:700;
      color:#3d2b1f; margin-bottom:12px; transform:rotate(-1deg); }
    .cover-subtitle { font-family:'Caveat',cursive; font-size:24px; color:#8b5c2a; margin-bottom:32px; }
    .cover-stars { font-size:20px; color:#c9954a; letter-spacing:8px; margin-bottom:32px; }
    .cover-dedication { font-family:'Caveat',cursive; font-size:18px; color:#6b4423;
      line-height:1.7; max-width:380px; background:rgba(201,149,74,0.08);
      padding:16px 20px; border-radius:8px; border:1px dashed #c9a87a; }
    .chapter-header { margin-bottom:40px; display:flex; align-items:center; gap:12px; }
    .chapter-title { font-family:'Caveat',cursive; font-size:36px; font-weight:700; color:#3d2b1f; }
    .chapter-deco { flex:1; height:2px; background:repeating-linear-gradient(90deg,#c9a87a 0,#c9a87a 6px,transparent 6px,transparent 12px); }
    .story { margin-bottom:48px; background:#fff; border-radius:8px; padding:24px;
      box-shadow:1px 2px 8px rgba(0,0,0,0.06); position:relative; transform:rotate(0.3deg); }
    .story:nth-child(even) { transform:rotate(-0.3deg); }
    .story-meta { font-family:'Caveat',cursive; font-size:15px; color:#8b5c2a; margin-bottom:4px; }
    .story-title { font-family:'Caveat',cursive; font-size:26px; font-weight:700; color:#3d2b1f;
      margin-bottom:12px; }
    .story-context { background:#fdf0e0; border-left:3px solid #c9a87a; padding:10px 14px;
      margin-bottom:16px; font-size:13px; color:#6b4423; font-style:italic; line-height:1.7;
      border-radius:0 6px 6px 0; }
    .story-image { width:100%; max-height:240px; object-fit:cover; border-radius:6px;
      margin-bottom:16px; border:3px solid #fff; box-shadow:0 2px 8px rgba(0,0,0,0.1); }
    .story-body p { font-size:14px; line-height:1.8; margin-bottom:12px; color:#3d2b1f; }
    .member-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .member-card { background:#fff; border-radius:8px; padding:16px;
      box-shadow:1px 2px 6px rgba(0,0,0,0.06); border-top:3px solid #c9a87a; }
    .member-name { font-family:'Caveat',cursive; font-size:20px; font-weight:700;
      color:#3d2b1f; margin-bottom:4px; }
    .member-dates { font-size:12px; color:#8b5c2a; margin-bottom:6px; }
    .member-bio { font-size:12px; color:#6b4423; font-style:italic; line-height:1.6; }
    .recipe { margin-bottom:40px; background:#fff; border-radius:8px; padding:24px;
      box-shadow:1px 2px 8px rgba(0,0,0,0.06); }
    .recipe-title { font-family:'Caveat',cursive; font-size:26px; font-weight:700;
      color:#3d2b1f; margin-bottom:4px; }
    .recipe-from { font-family:'Caveat',cursive; font-size:15px; color:#8b5c2a; margin-bottom:16px; }
    .recipe-story { background:#fdf0e0; border-radius:6px; padding:12px 14px; margin-bottom:16px;
      font-size:13px; color:#6b4423; font-style:italic; line-height:1.7; }
    .recipe-section-label { font-family:'Caveat',cursive; font-size:16px; font-weight:700;
      color:#3d2b1f; margin:12px 0 6px; }
    .recipe-pre { font-size:13px; line-height:1.8; color:#3d2b1f; white-space:pre-wrap;
      font-family:'Nunito',sans-serif; }
    .page-number { text-align:center; margin-top:40px; font-family:'Caveat',cursive;
      font-size:16px; color:#c9a87a; }
    .pin { position:absolute; top:12px; right:20px; font-size:20px; }
  `

  const coverPage = `
    <div class="page">
      <div class="tape"></div>
      <div class="cover">
        <div class="cover-heart">♡</div>
        <h1 class="cover-title">${escHtml(config.title)}</h1>
        ${config.subtitle ? `<p class="cover-subtitle">${escHtml(config.subtitle)}</p>` : ''}
        <div class="cover-stars">★ ★ ★</div>
        ${config.dedication ? `<p class="cover-dedication">${escHtml(config.dedication)}</p>` : ''}
      </div>
    </div>`

  const pages: string[] = [coverPage]

  enabledSections.forEach(section => {
    if (section.type === 'stories' && stories.length > 0) {
      pages.push(`<div class="page">
        <div class="tape"></div>
        <div class="chapter-header">
          <h2 class="chapter-title">Our Stories 📖</h2>
          <div class="chapter-deco"></div>
        </div>
        ${stories.map(s => `
          <div class="story">
            <span class="pin">📌</span>
            ${s.era || s.location ? `<p class="story-meta">📍 ${[s.location, s.era].filter(Boolean).join(' · ')}</p>` : ''}
            <h3 class="story-title">${escHtml(s.title)}</h3>
            ${s.historicalContext ? `<div class="story-context">${escHtml(s.historicalContext)}</div>` : ''}
            ${s.aiImageUrl ? `<img src="${s.aiImageUrl}" class="story-image" alt="${escHtml(s.title)}" />` : ''}
            <div class="story-body">${formatBody(s.enhancedContent ?? s.content)}</div>
          </div>`).join('')}
        <div class="page-number">✦ ${stories.length} stories ✦</div>
      </div>`)
    }

    if (section.type === 'tree' && members.length > 0) {
      pages.push(`<div class="page">
        <div class="tape"></div>
        <div class="chapter-header">
          <h2 class="chapter-title">Our Family 🌳</h2>
          <div class="chapter-deco"></div>
        </div>
        <div class="member-grid">
          ${members.map(m => `
            <div class="member-card">
              <div class="member-name">${escHtml(m.name)}</div>
              ${m.born || m.died ? `<div class="member-dates">📅 ${[m.born, m.died].filter(Boolean).join(' – ')}</div>` : ''}
              ${m.birthplace ? `<div class="member-dates">📍 ${escHtml(m.birthplace)}</div>` : ''}
              ${m.bio ? `<div class="member-bio">${escHtml(m.bio)}</div>` : ''}
            </div>`).join('')}
        </div>
        <div class="page-number">✦ with love ✦</div>
      </div>`)
    }

    if (section.type === 'recipes' && recipes.length > 0) {
      pages.push(`<div class="page">
        <div class="tape"></div>
        <div class="chapter-header">
          <h2 class="chapter-title">Family Recipes 🍳</h2>
          <div class="chapter-deco"></div>
        </div>
        ${recipes.map(r => `
          <div class="recipe">
            <h3 class="recipe-title">${escHtml(r.name)}</h3>
            ${r.from ? `<p class="recipe-from">💝 Passed down from ${escHtml(r.from)}</p>` : ''}
            ${r.storyText ? `<div class="recipe-story">${escHtml(r.storyText)}</div>` : ''}
            <div class="recipe-section-label">📝 Ingredients</div>
            <pre class="recipe-pre">${escHtml(r.ingredients)}</pre>
            <div class="recipe-section-label">👩‍🍳 Instructions</div>
            <pre class="recipe-pre">${escHtml(r.steps)}</pre>
          </div>`).join('')}
        <div class="page-number">✦ bon appétit ✦</div>
      </div>`)
    }
  })

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${pages.join('\n')}</body></html>`
}

// ── Helpers ───────────────────────────────────────────────

const escHtml = (s: string): string =>
  (s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;')

const formatBody = (text: string): string =>
  text.split('\n')
    .filter(p => p.trim())
    .map(p => `<p>${escHtml(p.replace(/\*\*(.*?)\*\*/g, '$1'))}</p>`)
    .join('')

// ── Render dispatcher ─────────────────────────────────────
export const renderBook = (data: BookData): string => {
  switch (data.config.style) {
    case 'canvas':    return renderCanvas(data)
    case 'scrapbook': return renderScrapbook(data)
    default:          return renderHeritage(data)
  }
}
