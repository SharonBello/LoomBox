import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Tooltip, IconButton, Alert,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import CloseIcon from '@mui/icons-material/Close'
import LinkIcon from '@mui/icons-material/Link'
import GridViewIcon from '@mui/icons-material/GridView'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import { useAppStore } from '@/store/appStore'
import { memberService } from '@/services/memberService'
import FamilyTreeDiagram from '@/features/tree/FamilyTreeDiagram'
import type { FamilyMember, RelationType } from '@/types'
import styles from './FamilyTreePage.module.scss'

type ViewMode = 'grid' | 'diagram'

const RELATION_TYPES: { value: RelationType; labelEn: string; labelHe: string }[] = [
  { value: 'parent', labelEn: 'Parent', labelHe: 'הורה' },
  { value: 'child', labelEn: 'Child', labelHe: 'ילד/ה' },
  { value: 'spouse', labelEn: 'Spouse', labelHe: 'בן/בת זוג' },
  { value: 'sibling', labelEn: 'Sibling', labelHe: 'אח/אחות' },
  { value: 'grandparent', labelEn: 'Grandparent', labelHe: 'סבא/סבתא' },
  { value: 'grandchild', labelEn: 'Grandchild', labelHe: 'נכד/ה' },
  { value: 'cousin', labelEn: 'Cousin', labelHe: 'בן/בת דוד' },
]

const isValidYear = (s: string) => {
  if (!s.trim()) return true
  const y = parseInt(s)
  return !isNaN(y) && y >= 1800 && y <= new Date().getFullYear()
}
const validateDate = (s: string): string => {
  if (!s.trim()) return ''
  if (/^\d{4}$/.test(s.trim())) return isValidYear(s.trim()) ? '' : 'Year must be between 1800 and today'
  return ''
}

const emptyForm = (): Partial<FamilyMember> => ({
  name: '', born: '', died: '', birthplace: '', bio: '', photoUrl: '', relations: [],
})
interface RelRow { memberId: string; type: RelationType }

const FamilyTreePage = () => {
  const { t } = useTranslation()
  const { user } = useAppStore()
  const lang = document.documentElement.lang?.startsWith('he') ? 'he' : 'en'

  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<FamilyMember | null>(null)
  const [form, setForm] = useState<Partial<FamilyMember>>(emptyForm())
  const [relRows, setRelRows] = useState<RelRow[]>([])
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<FamilyMember | null>(null)
  const [dateErrors, setDateErrors] = useState<{ born?: string; died?: string }>({})

  useEffect(() => {
    if (!user) return
    setLoading(true); setError('')
    memberService.list(user.uid)
      .then(m => setMembers(m))
      .catch(e => {
        console.error('FamilyTree load error:', e)
        setError(`Could not load members: ${(e as { message?: string }).message ?? 'Check Firestore rules'}`)
      })
      .finally(() => setLoading(false))
  }, [user])

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setRelRows([]); setDateErrors({}); setDialogOpen(true) }
  const openEdit = (m: FamilyMember) => {
    setEditing(m); setForm({ ...m })
    setRelRows(m.relations.map(r => ({ memberId: r.memberId, type: r.type })))
    setDateErrors({}); setDialogOpen(true)
  }
  const closeDialog = () => { setDialogOpen(false); setEditing(null) }

  const handleDateChange = (field: 'born' | 'died', val: string) => {
    setForm(f => ({ ...f, [field]: val }))
    setDateErrors(e => ({ ...e, [field]: validateDate(val) }))
  }

  const handleSave = async () => {
    if (!user || !form.name?.trim() || dateErrors.born || dateErrors.died) return
    const payload: Partial<FamilyMember> = {
      ...form,
      relations: relRows.filter(r => r.memberId).map(r => ({ memberId: r.memberId, type: r.type })),
    }
    setSaving(true)
    try {
      if (editing) {
        await memberService.update(editing.id, payload)
        setMembers(ms => ms.map(m => m.id === editing.id ? { ...m, ...payload } as FamilyMember : m))
        if (selected?.id === editing.id) setSelected(s => s ? { ...s, ...payload } as FamilyMember : s)
      } else {
        const created = await memberService.create(user.uid, payload)
        setMembers(ms => [...ms, created].sort((a, b) => a.name.localeCompare(b.name)))
      }
      closeDialog()
    } catch (e) { console.error('Save error:', e) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this family member?')) return
    await memberService.delete(id)
    setMembers(ms => ms.filter(m => m.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const addRelRow = () => setRelRows(r => [...r, { memberId: '', type: 'parent' }])
  const removeRelRow = (i: number) => setRelRows(r => r.filter((_, j) => j !== i))
  const updateRelRow = (i: number, patch: Partial<RelRow>) =>
    setRelRows(r => r.map((row, j) => j === i ? { ...row, ...patch } : row))

  const relLabel = (type: RelationType) => {
    const found = RELATION_TYPES.find(r => r.value === type)
    return found ? (lang === 'he' ? found.labelHe : found.labelEn) : type
  }

  const hasConnections = members.some(m => m.relations.length > 0)

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('tree.title')}</h1>
          <p className={styles.sub}>{members.length} {members.length === 1 ? 'member' : 'members'}</p>
        </div>
        <div className={styles.headerActions}>
          {/* View toggle — only show if there are connections to display */}
          {members.length >= 2 && hasConnections && (
            <div className={styles.viewToggle}>
              <button
                className={`${styles.viewToggleBtn} ${viewMode === 'grid' ? styles.viewToggleActive : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <GridViewIcon sx={{ fontSize: 15 }} /> Grid
              </button>
              <button
                className={`${styles.viewToggleBtn} ${viewMode === 'diagram' ? styles.viewToggleActive : ''}`}
                onClick={() => setViewMode('diagram')}
              >
                <AccountTreeIcon sx={{ fontSize: 15 }} /> Tree
              </button>
            </div>
          )}
          <button className={styles.addBtn} onClick={openAdd}>
            <AddIcon fontSize="small" /> {t('tree.addMember')}
          </button>
        </div>
      </header>

      {error && (
        <Alert severity="error" sx={{ borderRadius: '10px' }}>
          {error} — Go to Firebase Console → Firestore → Rules and publish the updated rules.
        </Alert>
      )}

      {loading ? (
        <div className={styles.loader}><CircularProgress sx={{ color: '#c9954a' }} /></div>
      ) : members.length === 0 && !error ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🌳</span>
          <h3 className={styles.emptyTitle}>Your family tree starts here</h3>
          <p className={styles.emptySub}>Add family members and connect them by relationship.</p>
          <button className={styles.addBtn} onClick={openAdd}><AddIcon fontSize="small" /> Add first member</button>
        </div>
      ) : viewMode === 'diagram' ? (
        /* ── Diagram view ── */
        <div className={styles.diagramLayout}>
          <FamilyTreeDiagram
            members={members}
            selected={selected}
            onSelect={m => setSelected(s => s?.id === m.id ? null : m)}
          />
          {/* Detail panel below diagram on mobile, beside on desktop */}
          {selected && (
            <aside className={styles.detailPanel}>
              <DetailPanel
                member={selected}
                members={members}
                lang={lang}
                relLabel={relLabel}
                onEdit={openEdit}
                onClose={() => setSelected(null)}
                onSelectRelated={m => setSelected(m)}
              />
            </aside>
          )}
        </div>
      ) : (
        /* ── Grid view ── */
        <div className={styles.layout}>
          <div className={styles.treePanel}>
            <div className={styles.treeGrid}>
              {members.map(m => (
                <div key={m.id}
                  className={`${styles.memberCard} ${selected?.id === m.id ? styles.memberCardSelected : ''}`}
                  onClick={() => setSelected(s => s?.id === m.id ? null : m)}
                >
                  <div className={styles.memberAvatar}>
                    {m.photoUrl
                      ? <img src={m.photoUrl} alt={m.name} className={styles.memberPhoto} />
                      : <PersonOutlineIcon sx={{ fontSize: 32, color: '#c9954a', opacity: 0.45 }} />}
                  </div>
                  <div className={styles.memberInfo}>
                    <span className={styles.memberName}>{m.name}</span>
                    {m.born && <span className={styles.memberDates}>{m.born}{m.died ? ` — ${m.died}` : ''}</span>}
                    {m.birthplace && <span className={styles.memberPlace}>{m.birthplace}</span>}
                    {m.relations.length > 0 && (
                      <span className={styles.memberRelCount}>
                        <LinkIcon sx={{ fontSize: 11 }} /> {m.relations.length} connection{m.relations.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className={styles.memberActions} onClick={e => e.stopPropagation()}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(m)} sx={{ color: '#9896a0', '&:hover': { color: '#c9954a' } }}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove">
                      <IconButton size="small" onClick={() => handleDelete(m.id)} sx={{ color: '#9896a0', '&:hover': { color: '#e05c5c' } }}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>
              ))}
              <button className={styles.addCard} onClick={openAdd}>
                <AddIcon sx={{ fontSize: 26, color: '#c9954a', opacity: 0.5 }} />
                <span>{t('tree.addMember')}</span>
              </button>
            </div>
          </div>

          {selected && (
            <aside className={styles.detailPanel}>
              <DetailPanel
                member={selected}
                members={members}
                lang={lang}
                relLabel={relLabel}
                onEdit={openEdit}
                onClose={() => setSelected(null)}
                onSelectRelated={m => setSelected(m)}
              />
            </aside>
          )}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.5rem', fontWeight: 500, pb: 1 }}>
          {editing ? 'Edit family member' : t('tree.addMember')}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          <TextField label={`${t('tree.name')} *`} fullWidth size="small"
            value={form.name ?? ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <TextField label={t('tree.born')} fullWidth size="small"
              placeholder="e.g. 1952 or 14/03/1952"
              value={form.born ?? ''} onChange={e => handleDateChange('born', e.target.value)}
              error={!!dateErrors.born} helperText={dateErrors.born || 'Year or DD/MM/YYYY'} />
            <TextField label={t('tree.died')} fullWidth size="small"
              placeholder="Leave blank if alive"
              value={form.died ?? ''} onChange={e => handleDateChange('died', e.target.value)}
              error={!!dateErrors.died} helperText={dateErrors.died || 'Leave blank if alive'} />
          </div>
          <TextField label={t('tree.birthplace')} fullWidth size="small"
            value={form.birthplace ?? ''} onChange={e => setForm(f => ({ ...f, birthplace: e.target.value }))} />
          <TextField label="Short bio" fullWidth size="small" multiline rows={3}
            value={form.bio ?? ''} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
          <TextField label="Photo URL (optional)" fullWidth size="small"
            value={form.photoUrl ?? ''} onChange={e => setForm(f => ({ ...f, photoUrl: e.target.value }))} />

          {/* Relationships */}
          <div className={styles.relSection}>
            <div className={styles.relSectionHeader}>
              <span className={styles.relSectionLabel}><LinkIcon sx={{ fontSize: 15 }} /> Family connections</span>
              <button className={styles.addRelBtn} onClick={addRelRow}
                disabled={members.filter(m => m.id !== editing?.id).length === 0}>
                + Add connection
              </button>
            </div>
            {relRows.length === 0 && (
              <p className={styles.relEmpty}>
                {members.filter(m => m.id !== editing?.id).length === 0
                  ? 'Add more members first.'
                  : 'Click "Add connection" to link family members.'}
              </p>
            )}
            {relRows.map((row, i) => (
              <div key={i} className={styles.relRow}>
                <TextField select size="small" label="Member" value={row.memberId}
                  onChange={e => updateRelRow(i, { memberId: e.target.value })} sx={{ flex: 1 }}>
                  <MenuItem value=""><em>Select…</em></MenuItem>
                  {members.filter(m => m.id !== editing?.id).map(m => (
                    <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
                  ))}
                </TextField>
                <TextField select size="small" label="Is my" value={row.type}
                  onChange={e => updateRelRow(i, { type: e.target.value as RelationType })} sx={{ width: 150 }}>
                  {RELATION_TYPES.map(r => (
                    <MenuItem key={r.value} value={r.value}>{lang === 'he' ? r.labelHe : r.labelEn}</MenuItem>
                  ))}
                </TextField>
                <IconButton size="small" onClick={() => removeRelRow(i)} sx={{ color: '#9896a0', '&:hover': { color: '#e05c5c' } }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </div>
            ))}
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <button className={styles.cancelBtn} onClick={closeDialog}>{t('common.cancel')}</button>
          <button className={styles.saveBtn} onClick={handleSave}
            disabled={saving || !form.name?.trim() || !!dateErrors.born || !!dateErrors.died}>
            {saving && <CircularProgress size={13} color="inherit" sx={{ mr: 1 }} />}
            {t('common.save')}
          </button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

// ── Shared detail panel ───────────────────────────────────
const DetailPanel = ({ member, members, lang, relLabel, onEdit, onClose, onSelectRelated }: {
  member: FamilyMember; members: FamilyMember[]; lang: string
  relLabel: (t: RelationType) => string
  onEdit: (m: FamilyMember) => void
  onClose: () => void
  onSelectRelated: (m: FamilyMember) => void
}) => (
  <div className={styles.detail}>
    <div className={styles.detailHeader}>
      <h2 className={styles.detailName}>{member.name}</h2>
      <div style={{ display: 'flex', gap: 4 }}>
        <Tooltip title="Edit"><IconButton size="small" onClick={() => onEdit(member)} sx={{ color: '#9896a0' }}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Close"><IconButton size="small" onClick={onClose} sx={{ color: '#9896a0' }}><CloseIcon fontSize="small" /></IconButton></Tooltip>
      </div>
    </div>
    {member.photoUrl && <img src={member.photoUrl} alt={member.name} className={styles.detailPhoto} />}
    <div className={styles.detailFields}>
      {member.born && (
        <div className={styles.detailField}>
          <span className={styles.detailLabel}>Born</span>
          <span className={styles.detailValue}>{member.born}{member.birthplace ? ` · ${member.birthplace}` : ''}</span>
        </div>
      )}
      {member.died && (
        <div className={styles.detailField}>
          <span className={styles.detailLabel}>Died</span>
          <span className={styles.detailValue}>{member.died}</span>
        </div>
      )}
      {member.bio && (
        <div className={styles.detailField}>
          <span className={styles.detailLabel}>About</span>
          <span className={styles.detailValue}>{member.bio}</span>
        </div>
      )}
    </div>
    {member.relations.length > 0 && (
      <div className={styles.detailRelations}>
        <span className={styles.detailLabel}>Family connections</span>
        {member.relations.map(r => {
          const rel = members.find(m => m.id === r.memberId)
          return rel ? (
            <div key={r.memberId} className={styles.relationChip} onClick={() => onSelectRelated(rel)}>
              <PersonOutlineIcon sx={{ fontSize: 13 }} />
              <span className={styles.relName}>{rel.name}</span>
              <span className={styles.relType}>{relLabel(r.type)}</span>
            </div>
          ) : null
        })}
      </div>
    )}
  </div>
)

export default FamilyTreePage