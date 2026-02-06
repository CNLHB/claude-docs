import { useRef, useEffect, useCallback } from 'react'

interface SplitViewProps {
  left: React.ReactNode
  right: React.ReactNode
  className?: string
}

export function SplitView({ left, right, className = '' }: SplitViewProps) {
  const leftPanelRef = useRef<HTMLDivElement>(null)
  const rightPanelRef = useRef<HTMLDivElement>(null)
  const leftContentRef = useRef<HTMLDivElement>(null)
  const rightContentRef = useRef<HTMLDivElement>(null)
  const isScrolling = useRef<'left' | 'right' | null>(null)

  // Sync scroll from left to right
  const handleLeftScroll = useCallback(() => {
    if (!leftContentRef.current || !rightContentRef.current) return
    if (isScrolling.current === 'right') return

    isScrolling.current = 'left'

    const leftPanel = leftContentRef.current
    const rightPanel = rightContentRef.current

    const leftRatio = leftPanel.scrollTop / (leftPanel.scrollHeight - leftPanel.clientHeight)
    const rightScrollTop = leftRatio * (rightPanel.scrollHeight - rightPanel.clientHeight)

    rightPanel.scrollTop = rightScrollTop

    requestAnimationFrame(() => {
      isScrolling.current = null
    })
  }, [])

  // Sync scroll from right to left
  const handleRightScroll = useCallback(() => {
    if (!leftContentRef.current || !rightContentRef.current) return
    if (isScrolling.current === 'left') return

    isScrolling.current = 'right'

    const leftPanel = leftContentRef.current
    const rightPanel = rightContentRef.current

    const rightRatio = rightPanel.scrollTop / (rightPanel.scrollHeight - rightPanel.clientHeight)
    const leftScrollTop = rightRatio * (leftPanel.scrollHeight - leftPanel.clientHeight)

    leftPanel.scrollTop = leftScrollTop

    requestAnimationFrame(() => {
      isScrolling.current = null
    })
  }, [])

  useEffect(() => {
    const leftPanel = leftContentRef.current
    const rightPanel = rightContentRef.current

    if (!leftPanel || !rightPanel) return

    leftPanel.addEventListener('scroll', handleLeftScroll, { passive: true })
    rightPanel.addEventListener('scroll', handleRightScroll, { passive: true })

    return () => {
      leftPanel.removeEventListener('scroll', handleLeftScroll)
      rightPanel.removeEventListener('scroll', handleRightScroll)
    }
  }, [handleLeftScroll, handleRightScroll])

  return (
    <div className={`flex h-full gap-4 ${className}`}>
      {/* Left Panel - Editor */}
      <div ref={leftPanelRef} className="flex-1 overflow-hidden">
        {typeof left === 'string' ? (
          <div
            ref={leftContentRef}
            className="h-full overflow-y-auto custom-scrollbar"
          >
            {left}
          </div>
        ) : (
          <div ref={leftContentRef as React.RefObject<HTMLDivElement>} className="h-full overflow-y-auto custom-scrollbar">
            {left}
          </div>
        )}
      </div>

      {/* Right Panel - Preview */}
      <div ref={rightPanelRef} className="flex-1 overflow-hidden">
        {typeof right === 'string' ? (
          <div
            ref={rightContentRef}
            className="h-full overflow-y-auto custom-scrollbar"
          >
            {right}
          </div>
        ) : (
          <div ref={rightContentRef as React.RefObject<HTMLDivElement>} className="h-full overflow-y-auto custom-scrollbar">
            {right}
          </div>
        )}
      </div>
    </div>
  )
}
