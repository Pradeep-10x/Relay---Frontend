import { clsx, type ClassValue } from 'clsx'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'
import type { IssuePriority } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  if (isToday(d)) return `Today at ${format(d, 'h:mm a')}`
  if (isYesterday(d)) return `Yesterday at ${format(d, 'h:mm a')}`
  return format(d, 'MMM d, yyyy')
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatShort(date: string | Date): string {
  return format(new Date(date), 'MMM d')
}

export function getInitials(name: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function getAvatarColor(name: string): string {
  const colors = [
    '#06a6f0','#8b5cf6','#10b981','#f59e0b',
    '#ef4444','#ec4899','#14b8a6','#f97316',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str
}

export function priorityToNumber(p: IssuePriority): number {
  return { HIGH: 3, MEDIUM: 2, LOW: 1 }[p]
}

export function debounce<T extends (...args: any[]) => any>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

export function parseMentions(content: string): string[] {
  const regex = /@(\w+)/g
  const usernames: string[] = []
  let match
  while ((match = regex.exec(content)) !== null) usernames.push(match[1])
  return usernames
}

export function renderMentionContent(content: string): string {
  return content.replace(
    /@(\w+)/g,
    '<span class="mention">@$1</span>'
  )
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}
