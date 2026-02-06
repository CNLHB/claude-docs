import { useEffect, useRef, useCallback } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { oneDark } from '@codemirror/theme-one-dark'
import { keymap } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { autocompletion } from '@codemirror/autocomplete'
import { bracketMatching } from '@codemirror/language'
import { closeBrackets } from '@codemirror/autocomplete'
import { highlightSpecialChars } from '@codemirror/view'
import { crosshairCursor } from '@codemirror/view'
import { drawSelection } from '@codemirror/view'
import { dropCursor } from '@codemirror/view'
import { lineNumbers } from '@codemirror/view'
import { highlightActiveLineGutter } from '@codemirror/view'
import { foldGutter } from '@codemirror/language'
import { indentOnInput } from '@codemirror/language'
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { useUIStore } from '@/store/uiStore'

interface CodeMirrorEditorProps {
  content: string
  onChange: (value: string) => void
  theme?: 'light' | 'dark'
}

export function CodeMirrorEditor({ content, onChange, theme = 'light' }: CodeMirrorEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const editorTheme = useUIStore((state) => state.theme)

  // Update content from outside
  const updateContent = useCallback(
    (newValue: string) => {
      if (viewRef.current) {
        const currentDoc = viewRef.current.state.doc.toString()
        if (currentDoc !== newValue) {
          viewRef.current.dispatch({
            changes: {
              from: 0,
              to: currentDoc.length,
              insert: newValue,
            },
          })
        }
      }
    },
    []
  )

  // Update content when prop changes
  useEffect(() => {
    updateContent(content)
  }, [content, updateContent])

  // Initialize editor
  useEffect(() => {
    if (!editorRef.current) return

    const startState = EditorState.create({
      doc: content,
      extensions: [
        basicSetup,
        markdown({ codeLanguages: languages }),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...searchKeymap,
        ]),
        lineNumbers(),
        highlightActiveLineGutter(),
        foldGutter({
          openText: '▼',
          closedText: '▶',
        }),
        drawSelection(),
        dropCursor(),
        crosshairCursor(),
        highlightSelectionMatches(),
        autocompletion(),
        closeBrackets(),
        bracketMatching(),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        highlightSpecialChars(),
        history(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString())
          }
        }),
        EditorView.theme({
          '&': {
            fontSize: `${useUIStore.getState().editorFontSize}px`,
          },
          '.cm-scroller': {
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
          },
          '.cm-content': {
            padding: '16px',
          },
          '.cm-line': {
            minHeight: '1.5rem',
          },
        }),
        // Dark theme support
        (editorTheme === 'dark' || theme === 'dark') ? oneDark : [],
      ],
    })

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [theme, editorTheme])

  return (
    <div
      ref={editorRef}
      className="h-full overflow-hidden rounded-lg border border-border"
    />
  )
}
