import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'

interface MarkdownPreviewProps {
  content: string
  className?: string
}

export function MarkdownPreview({ content, className = '' }: MarkdownPreviewProps) {
  return (
    <div className={`markdown-preview h-full overflow-y-auto ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // Code blocks
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !className || !match
            return !isInline ? (
              <code className={className} {...props}>
                {children}
              </code>
            ) : (
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono" {...props}>
                {children}
              </code>
            )
          },
          // Headings
          h1: ({ children }) => (
            <h1 className="mb-4 text-3xl font-bold tracking-tight">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 text-2xl font-semibold tracking-tight">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 text-xl font-semibold tracking-tight">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="mb-2 text-lg font-semibold">{children}</h4>
          ),
          h5: ({ children }) => (
            <h5 className="mb-1 text-base font-semibold">{children}</h5>
          ),
          h6: ({ children }) => (
            <h6 className="mb-1 text-sm font-semibold">{children}</h6>
          ),
          // Paragraphs
          p: ({ children }) => (
            <p className="mb-4 leading-7">{children}</p>
          ),
          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-primary underline-offset-4 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic">
              {children}
            </blockquote>
          ),
          // Lists
          ul: ({ children }) => (
            <ul className="ml-6 list-disc space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="ml-6 list-decimal space-y-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-7">{children}</li>
          ),
          // Tables
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full border-collapse border border-border">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-border px-4 py-2 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-4 py-2">{children}</td>
          ),
          // Horizontal rule
          hr: () => <hr className="my-8 border-border" />,
          // Images
          img: ({ src, alt }) => (
            <img src={src} alt={alt} className="rounded-lg" loading="lazy" />
          ),
          // Strong/Bold
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          // Emphasis/Italic
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
          // Code
          pre: ({ children }) => (
            <pre className="my-4 overflow-x-auto rounded-lg border bg-muted p-4">
              {children}
            </pre>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
