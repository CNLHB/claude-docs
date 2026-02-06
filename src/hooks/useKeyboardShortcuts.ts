import { useEffect, useCallback } from 'react'

export interface Shortcut {
  key: string
  description: string
  action: () => void
  enabled?: boolean
}

interface ShortcutCategory {
  name: string
  shortcuts: Shortcut[]
}

export function useKeyboardShortcuts(
  shortcuts: Shortcut[],
  enabled = true
) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return

    // Ignore if user is typing in an input
    const target = e.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true' ||
      target.closest('[contenteditable="true"]')
    ) {
      return
    }

    for (const shortcut of shortcuts) {
      if (shortcut.enabled === false) continue

      if (matchesShortcut(e, shortcut.key)) {
        e.preventDefault()
        shortcut.action()
        break
      }
    }
  }, [shortcuts, enabled])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// Check if keyboard event matches shortcut key
function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.split('+').map(p => p.trim().toLowerCase())
  const key = event.key.toLowerCase()
  const ctrl = event.ctrlKey || event.metaKey
  const alt = event.altKey
  const shift = event.shiftKey

  return parts.every(part => {
    switch (part) {
      case 'ctrl':
      case 'cmd':
      case 'meta':
        return ctrl
      case 'alt':
        return alt
      case 'shift':
        return shift
      case 'mod':
        return ctrl
      default:
        return part === key
    }
  })
}

// Format shortcut for display
export function formatShortcut(shortcut: string): string {
  return shortcut
    .split('+')
    .map((part) => {
      const p = part.trim().toLowerCase()
      switch (p) {
        case 'ctrl':
        case 'cmd':
        case 'meta':
        case 'mod':
          return '⌘'
        case 'alt':
          return '⌥'
        case 'shift':
          return '⇧'
        default:
          return p.toUpperCase()
      }
    })
    .join(' + ')
}

// Common shortcuts
export const commonShortcuts: ShortcutCategory[] = [
  {
    name: '编辑',
    shortcuts: [
      { key: 'mod+s', description: '保存', action: () => {} },
      { key: 'mod+z', description: '撤销', action: () => {} },
      { key: 'mod+shift+z', description: '重做', action: () => {} },
      { key: 'mod+f', description: '查找', action: () => {} },
      { key: 'mod+/', description: '注释', action: () => {} },
    ],
  },
  {
    name: '导航',
    shortcuts: [
      { key: 'mod+k', description: '命令面板', action: () => {} },
      { key: 'mod+b', description: '切换侧边栏', action: () => {} },
      { key: 'mod+p', description: '切换预览', action: () => {} },
      { key: 'escape', description: '退出/关闭', action: () => {} },
    ],
  },
  {
    name: '文档',
    shortcuts: [
      { key: 'mod+n', description: '新建文档', action: () => {} },
      { key: 'mod+shift+n', description: '新建文件夹', action: () => {} },
      { key: 'mod+d', description: '删除', action: () => {} },
    ],
  },
]

// Show keyboard shortcuts dialog
export function showKeyboardShortcutsDialog() {
  // This would open a dialog showing all available shortcuts
  console.log('Show keyboard shortcuts')
}
