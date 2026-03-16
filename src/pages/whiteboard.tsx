import { useRef, useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Pencil, Eraser, Trash2, Minus, Plus as PlusIcon, Circle } from 'lucide-react'
import { useWhiteboard } from '@/hooks'
import { getSocket, connectSocket } from '@/lib/socket'
import { useAuthStore } from '@/store/auth-store'
import type { Stroke } from '@/types'

const COLORS = ['#e6edf3', '#f97316', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#f59e0b']

export default function WhiteboardPage() {
  const { projectId = '' } = useParams()
  const { user } = useAuthStore()
  const { data: board } = useWhiteboard(projectId)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const currentStroke = useRef<{ x: number; y: number }[]>([])

  const [tool, setTool] = useState<'pen' | 'eraser'>('pen')
  const [color, setColor] = useState('#e6edf3')
  const [width, setWidth] = useState(2)
  const [strokes, setStrokes] = useState<Stroke[]>([])

  // Load initial strokes from API
  useEffect(() => {
    if (board?.strokes) setStrokes(board.strokes)
  }, [board])

  // Connect socket and join board room
  useEffect(() => {
    connectSocket()
    const socket = getSocket()
    socket.emit('joinProjectBoard', projectId, user?.id)

    socket.on('drawStroke', (stroke: Stroke) => {
      setStrokes((prev) => [...prev, stroke])
    })

    socket.on('clearBoard', () => {
      setStrokes([])
    })

    return () => {
      socket.off('drawStroke')
      socket.off('clearBoard')
    }
  }, [projectId, user?.id])

  // Redraw canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Size canvas to container
    const rect = canvas.parentElement?.getBoundingClientRect()
    if (rect) {
      canvas.width = rect.width
      canvas.height = rect.height
    }

    ctx.fillStyle = '#0a0c10'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    ctx.strokeStyle = '#1a1c2408'
    ctx.lineWidth = 1
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke()
    }
    for (let y = 0; y < canvas.height; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke()
    }

    // Draw all strokes
    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue
      ctx.strokeStyle = stroke.tool === 'eraser' ? '#0a0c10' : stroke.color
      ctx.lineWidth = stroke.tool === 'eraser' ? stroke.width * 4 : stroke.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      }
      ctx.stroke()
    }
  }, [strokes])

  useEffect(() => {
    redraw()
  }, [redraw])

  useEffect(() => {
    const handleResize = () => redraw()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [redraw])

  const getPos = (e: React.MouseEvent): { x: number; y: number } => {
    const rect = canvasRef.current?.getBoundingClientRect()
    return { x: e.clientX - (rect?.left || 0), y: e.clientY - (rect?.top || 0) }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    isDrawing.current = true
    currentStroke.current = [getPos(e)]
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing.current) return
    const pos = getPos(e)
    currentStroke.current.push(pos)

    // Draw live
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx && currentStroke.current.length >= 2) {
      const points = currentStroke.current
      ctx.strokeStyle = tool === 'eraser' ? '#0a0c10' : color
      ctx.lineWidth = tool === 'eraser' ? width * 4 : width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    }
  }

  const handleMouseUp = () => {
    if (!isDrawing.current) return
    isDrawing.current = false

    if (currentStroke.current.length >= 2) {
      const stroke: Stroke = {
        points: currentStroke.current,
        color,
        width,
        tool,
      }
      setStrokes((prev) => [...prev, stroke])
      getSocket().emit('drawStroke', { projectId, stroke })
    }
    currentStroke.current = []
  }

  const handleClear = () => {
    setStrokes([])
    getSocket().emit('clearBoard', { projectId })
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[#1e2028] bg-[#0e1017] flex-shrink-0">
        <div className="flex gap-1 bg-[#12141a] border border-[#1e2028] rounded-lg p-0.5">
          <button onClick={() => setTool('pen')} className={`w-8 h-8 rounded-md flex items-center justify-center transition ${tool === 'pen' ? 'bg-cyan-600 text-white' : 'text-zinc-500 hover:text-white'}`}>
            <Pencil size={14} />
          </button>
          <button onClick={() => setTool('eraser')} className={`w-8 h-8 rounded-md flex items-center justify-center transition ${tool === 'eraser' ? 'bg-cyan-600 text-white' : 'text-zinc-500 hover:text-white'}`}>
            <Eraser size={14} />
          </button>
        </div>

        <div className="w-px h-6 bg-[#1e2028]" />

        {/* Colors */}
        <div className="flex gap-1.5">
          {COLORS.map((c) => (
            <button key={c} onClick={() => { setColor(c); setTool('pen') }}
              className={`w-6 h-6 rounded-full border-2 transition ${color === c && tool === 'pen' ? 'border-white scale-110' : 'border-transparent hover:scale-110'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="w-px h-6 bg-[#1e2028]" />

        {/* Size */}
        <div className="flex items-center gap-1.5">
          <button onClick={() => setWidth(Math.max(1, width - 1))} className="text-zinc-500 hover:text-white transition"><Minus size={13} /></button>
          <span className="text-xs text-zinc-400 w-5 text-center">{width}</span>
          <button onClick={() => setWidth(Math.min(12, width + 1))} className="text-zinc-500 hover:text-white transition"><PlusIcon size={13} /></button>
        </div>

        <div className="flex-1" />

        <button onClick={handleClear} className="h-7 px-3 rounded-md text-[11px] font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 transition flex items-center gap-1.5">
          <Trash2 size={12} /> Clear
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  )
}
