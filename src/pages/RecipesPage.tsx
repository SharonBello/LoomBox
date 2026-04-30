import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Tooltip, IconButton,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { useAppStore } from '@/store/appStore'
import { recipeService } from '@/services/recipeService'
import { callRecipeStoryAI } from '@/services/recipeAiService'
import type { Recipe } from '@/types'
import styles from './RecipesPage.module.scss'

const emptyForm = (): Partial<Recipe> => ({
  name: '', from: '', occasion: '', ingredients: '', steps: '', storyText: '', photoUrls: [],
})

const RecipesPage = () => {
  const { t }    = useTranslation()
  const { user } = useAppStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [recipes, setRecipes]     = useState<Recipe[]>([])
  const [loading, setLoading]     = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing]     = useState<Recipe | null>(null)
  const [form, setForm]           = useState<Partial<Recipe>>(emptyForm())
  const [saving, setSaving]       = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [selected, setSelected]   = useState<Recipe | null>(null)

  const uiLang = () => document.documentElement.lang?.startsWith('he') ? 'he' : 'en'

  useEffect(() => {
    if (!user) return
    recipeService.list(user.uid).then(r => { setRecipes(r); setLoading(false) })
  }, [user])

  const openAdd  = () => { setEditing(null); setForm(emptyForm()); setDialogOpen(true) }
  const openEdit = (r: Recipe) => { setEditing(r); setForm({ ...r }); setDialogOpen(true) }
  const closeDialog = () => { setDialogOpen(false); setEditing(null) }

  const handleSave = async () => {
    if (!user || !form.name?.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await recipeService.update(editing.id, form)
        setRecipes(rs => rs.map(r => r.id === editing.id ? { ...r, ...form } as Recipe : r))
        if (selected?.id === editing.id) setSelected(s => s ? { ...s, ...form } as Recipe : s)
      } else {
        const created = await recipeService.create(user.uid, form)
        setRecipes(rs => [created, ...rs])
      }
      closeDialog()
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this recipe?')) return
    await recipeService.delete(id)
    setRecipes(rs => rs.filter(r => r.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const handleToggleBook = async (r: Recipe) => {
    await recipeService.toggleInBook(r.id, !r.isInBook)
    setRecipes(rs => rs.map(x => x.id === r.id ? { ...x, isInBook: !x.isInBook } : x))
  }

  const handleGenerateStory = async () => {
    if (!form.name) return
    setAiLoading(true)
    try {
      const story = await callRecipeStoryAI(form.name, form.from, form.occasion, uiLang())
      setForm(f => ({ ...f, storyText: story }))
    } finally { setAiLoading(false) }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const url = ev.target?.result as string
      setForm(f => ({ ...f, photoUrls: [...(f.photoUrls ?? []), url] }))
    }
    reader.readAsDataURL(file)
  }

  const f = (key: keyof Recipe, label: string, multi?: boolean, rows?: number) => (
    <TextField label={label} fullWidth size="small" multiline={multi} rows={rows ?? (multi ? 4 : 1)}
      value={(form[key] as string) ?? ''}
      onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
    />
  )

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('recipes.title')}</h1>
          <p className={styles.sub}>{recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}</p>
        </div>
        <button className={styles.addBtn} onClick={openAdd}>
          <AddIcon fontSize="small" /> {t('recipes.add')}
        </button>
      </header>

      {loading ? (
        <div className={styles.loader}><CircularProgress sx={{ color: '#c9954a' }} /></div>
      ) : recipes.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🍳</span>
          <h3 className={styles.emptyTitle}>Preserve a family recipe</h3>
          <p className={styles.emptySub}>Every dish carries a memory. Add the recipe and let AI write the story behind it.</p>
          <button className={styles.addBtn} onClick={openAdd}><AddIcon fontSize="small" /> Add first recipe</button>
        </div>
      ) : (
        <div className={styles.layout}>
          {/* Recipe grid */}
          <div className={styles.recipeGrid}>
            {recipes.map(r => (
              <div
                key={r.id}
                className={`${styles.recipeCard} ${selected?.id === r.id ? styles.recipeCardSelected : ''}`}
                onClick={() => setSelected(s => s?.id === r.id ? null : r)}
              >
                {r.photoUrls?.[0]
                  ? <img src={r.photoUrls[0]} alt={r.name} className={styles.recipeImg} />
                  : <div className={styles.recipeImgPlaceholder}>🍽️</div>
                }
                <div className={styles.recipeBody}>
                  <h3 className={styles.recipeName}>{r.name}</h3>
                  {r.from && <p className={styles.recipeFrom}>From {r.from}</p>}
                  {r.occasion && <p className={styles.recipeOccasion}>{r.occasion}</p>}
                  {r.storyText && (
                    <p className={styles.recipePreview}>{r.storyText.slice(0, 90)}…</p>
                  )}
                </div>
                <div className={styles.recipeActions} onClick={e => e.stopPropagation()}>
                  <Tooltip title={r.isInBook ? 'Remove from book' : 'Add to book'}>
                    <IconButton size="small" onClick={() => handleToggleBook(r)}
                      sx={{ color: r.isInBook ? '#c9954a' : '#9896a0' }}>
                      <MenuBookOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => openEdit(r)} sx={{ color: '#9896a0', '&:hover': { color: '#c9954a' } }}>
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => handleDelete(r.id)} sx={{ color: '#9896a0', '&:hover': { color: '#e05c5c' } }}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {r.isInBook && <span className={styles.inBookBadge}>In book</span>}
                </div>
              </div>
            ))}

            <button className={styles.addCard} onClick={openAdd}>
              <AddIcon sx={{ fontSize: 26, color: '#c9954a', opacity: 0.5 }} />
              <span>{t('recipes.add')}</span>
            </button>
          </div>

          {/* Detail panel */}
          {selected && (
            <aside className={styles.detailPanel}>
              <div className={styles.detailHeader}>
                <h2 className={styles.detailName}>{selected.name}</h2>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => openEdit(selected)} sx={{ color: '#9896a0' }}>
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </div>
              </div>

              {selected.photoUrls?.[0] && (
                <img src={selected.photoUrls[0]} alt={selected.name} className={styles.detailPhoto} />
              )}

              {selected.from && (
                <div className={styles.detailMeta}>
                  <span className={styles.detailLabel}>Passed down from</span>
                  <span className={styles.detailValue}>{selected.from}</span>
                </div>
              )}

              {selected.storyText && (
                <div className={styles.detailStory}>
                  <span className={styles.detailLabel}>✦ The story</span>
                  <p className={styles.detailStoryText}>{selected.storyText}</p>
                </div>
              )}

              <div className={styles.detailSection}>
                <span className={styles.detailLabel}>Ingredients</span>
                <pre className={styles.detailPre}>{selected.ingredients}</pre>
              </div>

              <div className={styles.detailSection}>
                <span className={styles.detailLabel}>Instructions</span>
                <pre className={styles.detailPre}>{selected.steps}</pre>
              </div>
            </aside>
          )}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.5rem', fontWeight: 500, pb: 1 }}>
          {editing ? 'Edit recipe' : t('recipes.add')}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          {f('name', `${t('recipes.name')} *`)}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {f('from', t('recipes.from'))}
            {f('occasion', t('recipes.occasion'))}
          </div>

          {f('ingredients', t('recipes.ingredients'), true, 5)}
          {f('steps', t('recipes.steps'), true, 5)}

          {/* Story section */}
          <div className={styles.storySection}>
            <div className={styles.storySectionHeader}>
              <label style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, fontWeight: 600, color: '#1a1929' }}>
                {t('recipes.story')}
              </label>
              <button className={styles.aiStoryBtn} onClick={handleGenerateStory}
                disabled={aiLoading || !form.name?.trim()}>
                {aiLoading
                  ? <><CircularProgress size={13} color="inherit" /> Writing…</>
                  : <><AutoFixHighIcon sx={{ fontSize: 14 }} /> {t('recipes.aiHelp')}</>}
              </button>
            </div>
            <TextField fullWidth size="small" multiline rows={4}
              placeholder="What's the memory behind this recipe? Or click the button to let AI write it."
              value={form.storyText ?? ''}
              onChange={e => setForm(f => ({ ...f, storyText: e.target.value }))} />
          </div>

          {/* Photo upload */}
          <div className={styles.photoSection}>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
            <button className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
              <UploadFileIcon sx={{ fontSize: 15 }} /> Add a photo
            </button>
            {(form.photoUrls ?? []).length > 0 && (
              <div className={styles.photoRow}>
                {form.photoUrls!.map((url, i) => (
                  <div key={i} className={styles.photoThumb}>
                    <img src={url} alt="" />
                    <button className={styles.removePhoto}
                      onClick={() => setForm(f => ({ ...f, photoUrls: f.photoUrls!.filter((_, j) => j !== i) }))}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <button className={styles.cancelBtn} onClick={closeDialog}>{t('common.cancel')}</button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving || !form.name?.trim()}>
            {saving && <CircularProgress size={13} color="inherit" sx={{ mr: 1 }} />}
            {t('common.save')}
          </button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default RecipesPage
