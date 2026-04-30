import { useMemo, useState } from 'react'
import type { FamilyMember } from '@/types'

// ── Layout constants ──────────────────────────────────────
const NODE_W = 140
const NODE_H = 72
const H_GAP = 40   // horizontal gap between nodes
const V_GAP = 90   // vertical gap between generations
const PAD = 40   // canvas padding

// ── Generation detection ──────────────────────────────────
// Assigns each member a "tier" (row) based on relationships.
// grandparent=0, parent=1, self/sibling/spouse=2, child=3, grandchild=4

const PARENT_LIKE = new Set(['parent', 'grandparent'])
const CHILD_LIKE = new Set(['child', 'grandchild'])

function assignTiers(members: FamilyMember[]): Map<string, number> {
    const tiers = new Map<string, number>()

    // Give everyone a starting tier of 2
    members.forEach(m => tiers.set(m.id, 2))

    // Propagate up/down through relationships — iterate a few times to settle
    for (let pass = 0; pass < 4; pass++) {
        members.forEach(m => {
            const myTier = tiers.get(m.id)!
            m.relations.forEach(r => {
                const theirTier = tiers.get(r.memberId)
                if (theirTier === undefined) return

                if (PARENT_LIKE.has(r.type)) {
                    // r.memberId is my parent/grandparent → they go above me
                    const delta = r.type === 'grandparent' ? 2 : 1
                    tiers.set(r.memberId, Math.min(theirTier, myTier - delta))
                } else if (CHILD_LIKE.has(r.type)) {
                    // r.memberId is my child/grandchild → they go below me
                    const delta = r.type === 'grandchild' ? 2 : 1
                    tiers.set(r.memberId, Math.max(theirTier, myTier + delta))
                }
            })
        })
    }

    // Normalise: shift so minimum tier = 0
    const min = Math.min(...tiers.values())
    tiers.forEach((v, k) => tiers.set(k, v - min))

    return tiers
}

// ── Position nodes ────────────────────────────────────────
interface NodePos { x: number; y: number; member: FamilyMember }

function layoutNodes(members: FamilyMember[]): { nodes: NodePos[]; width: number; height: number } {
    const tiers = assignTiers(members)

    // Group by tier
    const byTier = new Map<number, FamilyMember[]>()
    members.forEach(m => {
        const t = tiers.get(m.id)!
        if (!byTier.has(t)) byTier.set(t, [])
        byTier.get(t)!.push(m)
    })

    const maxPerRow = Math.max(...Array.from(byTier.values()).map(g => g.length))
    const totalW = Math.max(maxPerRow * (NODE_W + H_GAP) - H_GAP, NODE_W)

    const nodes: NodePos[] = []
    const sortedTiers = Array.from(byTier.keys()).sort((a, b) => a - b)

    sortedTiers.forEach((tier, rowIdx) => {
        const group = byTier.get(tier)!
        const rowW = group.length * NODE_W + (group.length - 1) * H_GAP
        const startX = (totalW - rowW) / 2

        group.forEach((m, colIdx) => {
            nodes.push({
                member: m,
                x: PAD + startX + colIdx * (NODE_W + H_GAP),
                y: PAD + rowIdx * (NODE_H + V_GAP),
            })
        })
    })

    const height = sortedTiers.length * (NODE_H + V_GAP) - V_GAP + PAD * 2
    const width = totalW + PAD * 2

    return { nodes, width, height }
}

// ── Build edge list ───────────────────────────────────────
interface Edge { from: string; to: string; type: string }

function buildEdges(members: FamilyMember[]): Edge[] {
    const edges: Edge[] = []
    const seen = new Set<string>()

    members.forEach(m => {
        m.relations.forEach(r => {
            const key = [m.id, r.memberId].sort().join('|')
            if (!seen.has(key)) {
                seen.add(key)
                edges.push({ from: m.id, to: r.memberId, type: r.type })
            }
        })
    })
    return edges
}

// ── Connector line colours ────────────────────────────────
const edgeColor = (type: string): string => {
    if (['parent', 'child'].includes(type)) return '#C9954A'
    if (type === 'spouse') return '#7C6FE0'
    if (type === 'sibling') return '#4CAF82'
    if (['grandparent', 'grandchild'].includes(type)) return '#E8A04A'
    return '#9896A0'
}

// ── Props ─────────────────────────────────────────────────
interface FamilyTreeDiagramProps {
    members: FamilyMember[]
    selected: FamilyMember | null
    onSelect: (m: FamilyMember) => void
}

// ============================================================
// FamilyTreeDiagram
// ============================================================

export const FamilyTreeDiagram = ({ members, selected, onSelect }: FamilyTreeDiagramProps) => {
    const [hovered, setHovered] = useState<string | null>(null)

    const { nodes, width, height } = useMemo(() => layoutNodes(members), [members])
    const edges = useMemo(() => buildEdges(members), [members])

    const nodeMap = useMemo(() => {
        const m = new Map<string, NodePos>()
        nodes.forEach(n => m.set(n.member.id, n))
        return m
    }, [nodes])

    if (members.length === 0) return null

    return (
        <div style={{
            width: '100%', overflowX: 'auto', overflowY: 'hidden', borderRadius: 14,
            border: '1px solid #e8e4dc', background: '#faf8f4'
        }}>
            <svg
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                style={{ display: 'block', minWidth: '100%' }}
            >
                {/* Subtle dot-grid background */}
                <defs>
                    <pattern id="dot" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1" fill="#e8e4dc" />
                    </pattern>
                </defs>
                <rect width={width} height={height} fill="url(#dot)" />

                {/* ── Edges ── */}
                {edges.map(edge => {
                    const from = nodeMap.get(edge.from)
                    const to = nodeMap.get(edge.to)
                    if (!from || !to) return null

                    const x1 = from.x + NODE_W / 2
                    const y1 = from.y + NODE_H / 2
                    const x2 = to.x + NODE_W / 2
                    const y2 = to.y + NODE_H / 2

                    // Curved path for visual clarity
                    const mx = (x1 + x2) / 2
                    const my = (y1 + y2) / 2

                    const isSpouse = edge.type === 'spouse'
                    const stroke = edgeColor(edge.type)

                    const isHighlighted =
                        selected?.id === edge.from ||
                        selected?.id === edge.to ||
                        hovered === edge.from ||
                        hovered === edge.to

                    return (
                        <g key={`${edge.from}-${edge.to}`}>
                            <path
                                d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
                                fill="none"
                                stroke={stroke}
                                strokeWidth={isHighlighted ? 2.5 : 1.5}
                                strokeOpacity={isHighlighted ? 0.9 : 0.35}
                                strokeDasharray={isSpouse ? '6 3' : undefined}
                            />
                            {/* Midpoint label for short connections */}
                            {isHighlighted && (
                                <g>
                                    <rect x={mx - 24} y={my - 10} width={48} height={18} rx={9}
                                        fill={stroke} fillOpacity={0.15} stroke={stroke} strokeOpacity={0.4} strokeWidth={1} />
                                    <text x={mx} y={my + 4} textAnchor="middle"
                                        fontSize={9} fill={stroke} fontFamily="'Plus Jakarta Sans',sans-serif" fontWeight={600}>
                                        {edge.type}
                                    </text>
                                </g>
                            )}
                        </g>
                    )
                })}

                {/* ── Nodes ── */}
                {nodes.map(({ x, y, member }) => {
                    const isSelected = selected?.id === member.id
                    const isHovered = hovered === member.id
                    const isConnected = selected
                        ? selected.relations.some(r => r.memberId === member.id) ||
                        members.some(m => m.id !== selected.id && m.relations.some(r => r.memberId === member.id && selected.relations.some(s => s.memberId === m.id)))
                        : false

                    const bg = isSelected ? '#1a1929' : isConnected ? '#f8f0e0' : '#ffffff'
                    const border = isSelected ? '#1a1929' : isHovered ? '#c9954a' : isConnected ? '#c9954a' : '#e8e4dc'
                    const nameCol = isSelected ? '#ffffff' : '#1a1929'
                    const metaCol = isSelected ? 'rgba(255,255,255,0.65)' : '#9896a0'

                    return (
                        <g
                            key={member.id}
                            onClick={() => onSelect(member)}
                            onMouseEnter={() => setHovered(member.id)}
                            onMouseLeave={() => setHovered(null)}
                            style={{ cursor: 'pointer' }}
                        >
                            {/* Card shadow */}
                            <rect x={x + 2} y={y + 3} width={NODE_W} height={NODE_H} rx={12}
                                fill="rgba(26,25,41,0.08)" />

                            {/* Card bg */}
                            <rect x={x} y={y} width={NODE_W} height={NODE_H} rx={12}
                                fill={bg} stroke={border} strokeWidth={isSelected || isHovered ? 2 : 1.5}
                            />

                            {/* Avatar circle */}
                            {member.photoUrl ? (
                                <image
                                    x={x + 10} y={y + 14} width={44} height={44}
                                    href={member.photoUrl}
                                    clipPath={`circle(22px at ${x + 32}px ${y + 36}px)`}
                                    preserveAspectRatio="xMidYMid slice"
                                />
                            ) : (
                                <g>
                                    <circle cx={x + 32} cy={y + 36} r={22}
                                        fill={isSelected ? 'rgba(255,255,255,0.12)' : '#f8f0e0'}
                                        stroke={isSelected ? 'rgba(255,255,255,0.2)' : '#e8e4dc'}
                                        strokeWidth={1} />
                                    <text x={x + 32} y={y + 41} textAnchor="middle"
                                        fontSize={18} fill={isSelected ? 'rgba(255,255,255,0.7)' : '#c9954a'}>
                                        {member.name.charAt(0).toUpperCase()}
                                    </text>
                                </g>
                            )}

                            {/* Name */}
                            <text
                                x={x + 64} y={y + 30}
                                fontSize={12} fontWeight={600}
                                fontFamily="'Cormorant Garamond',serif"
                                fill={nameCol}
                                clipPath={`inset(0 0 0 0)`}
                            >
                                {member.name.length > 12 ? member.name.slice(0, 12) + '…' : member.name}
                            </text>

                            {/* Dates */}
                            {(member.born || member.died) && (
                                <text x={x + 64} y={y + 46} fontSize={9} fill={metaCol}
                                    fontFamily="'Plus Jakarta Sans',sans-serif">
                                    {[member.born, member.died].filter(Boolean).join(' – ')}
                                </text>
                            )}

                            {/* Connections badge */}
                            {member.relations.length > 0 && (
                                <g>
                                    <circle cx={x + NODE_W - 10} cy={y + 12} r={10}
                                        fill={isSelected ? 'rgba(255,255,255,0.15)' : '#f8f0e0'}
                                        stroke={isSelected ? 'rgba(255,255,255,0.3)' : '#c9954a'}
                                        strokeWidth={1} />
                                    <text x={x + NODE_W - 10} y={y + 16} textAnchor="middle"
                                        fontSize={9} fontWeight={700} fill={isSelected ? '#ffffff' : '#c9954a'}
                                        fontFamily="'Plus Jakarta Sans',sans-serif">
                                        {member.relations.length}
                                    </text>
                                </g>
                            )}
                        </g>
                    )
                })}
            </svg>

            {/* Legend */}
            <div style={{
                display: 'flex', gap: 16, padding: '10px 16px', borderTop: '1px solid #e8e4dc',
                flexWrap: 'wrap', background: '#ffffff'
            }}>
                {[
                    { color: '#C9954A', label: 'Parent / Child', dash: false },
                    { color: '#7C6FE0', label: 'Spouse', dash: true },
                    { color: '#4CAF82', label: 'Sibling', dash: false },
                    { color: '#E8A04A', label: 'Grandparent', dash: false },
                ].map(({ color, label, dash }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width={28} height={10}>
                            <line x1={0} y1={5} x2={28} y2={5}
                                stroke={color} strokeWidth={2}
                                strokeDasharray={dash ? '5 3' : undefined} />
                        </svg>
                        <span style={{
                            fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 11,
                            color: '#9896a0', fontWeight: 500
                        }}>{label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default FamilyTreeDiagram