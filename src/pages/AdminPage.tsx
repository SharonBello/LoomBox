import { useEffect, useState } from 'react'
import {
    CircularProgress, Alert, Tabs, Tab, Chip,
    IconButton, Tooltip, Dialog, DialogTitle,
    DialogContent, DialogActions,
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import FlagIcon from '@mui/icons-material/Flag'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import PersonIcon from '@mui/icons-material/Person'
import { adminService } from '@/services/AdminService'
import type { AdminUser } from '@/services/AdminService'
import type { Story } from '@/types'
import styles from './AdminPage.module.scss'

interface Stats {
    totalStories: number
    totalUsers: number
    totalRecipes: number
    totalMembers: number
    flaggedCount: number
}

const AdminPage = () => {
    const [tab, setTab] = useState(0)
    const [stats, setStats] = useState<Stats | null>(null)
    const [users, setUsers] = useState<AdminUser[]>([])
    const [flagged, setFlagged] = useState<Story[]>([])
    const [allStories, setAllStories] = useState<Story[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

    useEffect(() => {
        loadAll()
    }, [])

    const loadAll = async () => {
        setLoading(true)
        setError('')
        try {
            const [s, u, f, a] = await Promise.all([
                adminService.getStats(),
                adminService.listUsers(),
                adminService.getFlaggedStories(),
                adminService.getAllStories(50),
            ])
            setStats(s); setUsers(u); setFlagged(f); setAllStories(a)
        } catch (e) {
            setError('Could not load admin data. Make sure your Firestore rules allow admin access.')
            console.error(e)
        } finally { setLoading(false) }
    }

    const handleApprove = async (id: string) => {
        await adminService.approveStory(id)
        setFlagged(f => f.filter(s => s.id !== id))
        setStats(s => s ? { ...s, flaggedCount: s.flaggedCount - 1 } : s)
    }

    const handleDelete = async (id: string) => {
        await adminService.deleteStory(id)
        setFlagged(f => f.filter(s => s.id !== id))
        setAllStories(a => a.filter(s => s.id !== id))
        setStats(s => s ? { ...s, totalStories: s.totalStories - 1 } : s)
        setConfirmDelete(null)
    }

    const handleRoleToggle = async (user: AdminUser) => {
        const newRole = user.role === 'admin' ? 'member' : 'admin'
        await adminService.setUserRole(user.uid, newRole)
        setUsers(u => u.map(x => x.uid === user.uid ? { ...x, role: newRole } : x))
    }

    if (loading) return (
        <div className={styles.loader}><CircularProgress sx={{ color: '#c9954a' }} /></div>
    )

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>⚙ Admin Dashboard</h1>
                    <p className={styles.sub}>LoomBox platform management</p>
                </div>
                <button className={styles.refreshBtn} onClick={loadAll}>↺ Refresh</button>
            </header>

            {error && <Alert severity="error" sx={{ borderRadius: '10px' }}>{error}</Alert>}

            {/* Stats */}
            {stats && (
                <div className={styles.statsGrid}>
                    {[
                        { label: 'Total Stories', value: stats.totalStories, emoji: '📖' },
                        { label: 'Total Users', value: stats.totalUsers, emoji: '👥' },
                        { label: 'Recipes', value: stats.totalRecipes, emoji: '🍳' },
                        { label: 'Family Members', value: stats.totalMembers, emoji: '🌳' },
                        { label: 'Flagged', value: stats.flaggedCount, emoji: '🚩', alert: stats.flaggedCount > 0 },
                    ].map(s => (
                        <div key={s.label} className={`${styles.statCard} ${s.alert ? styles.statCardAlert : ''}`}>
                            <span className={styles.statEmoji}>{s.emoji}</span>
                            <span className={styles.statValue}>{s.value}</span>
                            <span className={styles.statLabel}>{s.label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Tabs */}
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid #e8e4dc', mb: 3 }}>
                <Tab label={`Flagged Content${flagged.length > 0 ? ` (${flagged.length})` : ''}`} />
                <Tab label={`All Stories (${allStories.length})`} />
                <Tab label={`Users (${users.length})`} />
            </Tabs>

            {/* ── Tab 0: Flagged ── */}
            {tab === 0 && (
                <div className={styles.tableWrap}>
                    {flagged.length === 0 ? (
                        <div className={styles.empty}>
                            <span style={{ fontSize: 48 }}>✅</span>
                            <p>No flagged content — everything looks clean.</p>
                        </div>
                    ) : flagged.map(story => (
                        <div key={story.id} className={styles.flaggedCard}>
                            <div className={styles.flaggedMeta}>
                                <FlagIcon sx={{ fontSize: 16, color: '#e05c5c' }} />
                                <span className={styles.flaggedTitle}>{story.title}</span>
                                <Chip label={story.flagReason ?? 'Flagged'} size="small"
                                    sx={{ background: '#fdeaea', color: '#a32d2d', fontSize: 11 }} />
                            </div>
                            <p className={styles.flaggedPreview}>{(story.content ?? '').slice(0, 200)}…</p>
                            <p className={styles.flaggedUser}>User: {story.userId}</p>
                            <div className={styles.flaggedActions}>
                                <Tooltip title="Approve — content is fine">
                                    <IconButton size="small" onClick={() => handleApprove(story.id)}
                                        sx={{ color: '#4caf82' }}>
                                        <CheckCircleIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete permanently">
                                    <IconButton size="small" onClick={() => setConfirmDelete(story.id)}
                                        sx={{ color: '#e05c5c' }}>
                                        <DeleteOutlineIcon />
                                    </IconButton>
                                </Tooltip>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Tab 1: All Stories ── */}
            {tab === 1 && (
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>User ID</th>
                                <th>Created</th>
                                <th>In Book</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {allStories.map(s => (
                                <tr key={s.id} className={(s as Story & { flagged?: boolean }).flagged ? styles.rowFlagged : ''}>
                                    <td className={styles.tdTitle}>{s.title}</td>
                                    <td className={styles.tdMono}>{s.userId.slice(0, 12)}…</td>
                                    <td className={styles.tdMono}>{s.createdAt.toLocaleDateString()}</td>
                                    <td>{s.isInBook ? '✓' : '—'}</td>
                                    <td>
                                        {(s as Story & { flagged?: boolean }).flagged
                                            ? <Chip label="Flagged" size="small" sx={{ background: '#fdeaea', color: '#a32d2d', fontSize: 10 }} />
                                            : <Chip label="OK" size="small" sx={{ background: '#eafaf1', color: '#2d6a4f', fontSize: 10 }} />}
                                    </td>
                                    <td>
                                        <Tooltip title="Delete">
                                            <IconButton size="small" onClick={() => setConfirmDelete(s.id)}
                                                sx={{ color: '#9896a0', '&:hover': { color: '#e05c5c' } }}>
                                                <DeleteOutlineIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Tab 2: Users ── */}
            {tab === 2 && (
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Joined</th>
                                <th>Role</th>
                                <th>Toggle</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.uid}>
                                    <td>{u.name}</td>
                                    <td className={styles.tdMono}>{u.email}</td>
                                    <td className={styles.tdMono}>{u.createdAt.toLocaleDateString()}</td>
                                    <td>
                                        <Chip
                                            icon={u.role === 'admin' ? <AdminPanelSettingsIcon sx={{ fontSize: 14 }} /> : <PersonIcon sx={{ fontSize: 14 }} />}
                                            label={u.role}
                                            size="small"
                                            sx={u.role === 'admin'
                                                ? { background: '#f8f0e0', color: '#9e7030', fontWeight: 600 }
                                                : { background: '#f4f4f4', color: '#666' }}
                                        />
                                    </td>
                                    <td>
                                        <Tooltip title={u.role === 'admin' ? 'Demote to member' : 'Promote to admin'}>
                                            <button className={styles.roleBtn} onClick={() => handleRoleToggle(u)}>
                                                {u.role === 'admin' ? 'Demote' : 'Make admin'}
                                            </button>
                                        </Tooltip>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Delete confirm dialog */}
            <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} maxWidth="xs">
                <DialogTitle sx={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '1rem' }}>
                    Delete this story permanently?
                </DialogTitle>
                <DialogContent>
                    <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, color: '#666' }}>
                        This cannot be undone. The story will be removed for the user.
                    </p>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <button className={styles.cancelBtn} onClick={() => setConfirmDelete(null)}>Cancel</button>
                    <button className={styles.deleteBtn} onClick={() => confirmDelete && handleDelete(confirmDelete)}>Delete</button>
                </DialogActions>
            </Dialog>
        </div>
    )
}

export default AdminPage