import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDocumentStore } from '@/store/documentStore'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, FileText, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function DocumentsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { documents, fetchDocuments, createDocument, setCurrentDocument, loading } =
    useDocumentStore()

  useEffect(() => {
    if (user) {
      fetchDocuments()
    }
  }, [user, fetchDocuments])

  const handleCreateDocument = async () => {
    try {
      const newDoc = await createDocument({
        title: '未命名文档',
        content: '',
      })
      setCurrentDocument(newDoc)
      navigate(`/editor/${newDoc.id}`)
    } catch (error) {
      console.error('Create document error:', error)
    }
  }

  const handleDocumentClick = (doc: any) => {
    setCurrentDocument(doc)
    navigate(`/editor/${doc.id}`)
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold">文档</h1>
          <p className="text-sm text-muted-foreground">
            管理您的 Markdown 文档
          </p>
        </div>
        <Button onClick={handleCreateDocument}>
          <Plus className="mr-2 h-4 w-4" />
          新建文档
        </Button>
      </header>

      {/* Documents Grid */}
      <main className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : documents.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Card className="p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">暂无文档</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                创建您的第一个文档开始写作
              </p>
              <Button className="mt-4" onClick={handleCreateDocument}>
                <Plus className="mr-2 h-4 w-4" />
                新建文档
              </Button>
            </Card>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => handleDocumentClick(doc)}
              >
                <div className="p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="flex items-center text-xs text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      {formatDistanceToNow(new Date(doc.updated_at), {
                        addSuffix: true,
                        locale: zhCN,
                      })}
                    </span>
                  </div>
                  <h3 className="mb-1 truncate font-semibold">{doc.title}</h3>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {doc.content?.slice(0, 100) || '空文档'}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
