# Claude Docs - 在线Markdown文档编辑器

功能完善的在线Markdown文档编辑器应用，基于 React + TypeScript + Vite + Supabase 构建。

## 功能特性

### 文档编辑
- 所见即所得(WYSIWYG)的Markdown编辑界面
- 支持标准Markdown语法及常用扩展语法（GFM、表格、任务列表等）
- 实时预览功能，支持编辑与预览同步滚动
- 代码块高亮显示，支持多种编程语言

### 文件管理
- 多级文件夹结构，支持文件夹的创建、重命名、移动和删除
- 支持Markdown文件的创建、重命名、移动、删除和复制
- 文件列表视图和网格视图切换
- 文件排序功能（按名称、修改时间、创建时间等）

### 搜索功能
- 全局文档内容搜索
- 文件夹和文件名搜索
- 搜索结果高亮显示
- 搜索结果预览和快速定位

### Supabase同步
- 用户认证系统（注册、登录、密码重置）
- 文档实时同步功能
- 文档版本历史记录，支持版本回溯
- 离线编辑支持，网络恢复后自动同步

### 其他增强功能
- 响应式设计，支持桌面端和移动端
- 文档标签和分类管理
- 文档分享功能（公开分享和密码保护分享）
- 快捷键支持
- 多种编辑主题和预览主题选择

## 技术栈

- **前端框架**: React 18 + TypeScript + Vite
- **UI组件**: shadcn/ui (Radix UI + Tailwind CSS)
- **编辑器**: CodeMirror 6
- **状态管理**: Zustand
- **路由**: React Router v7
- **后端/BaaS**: Supabase
- **本地存储**: IndexedDB

## 快速开始

### 前置要求

- Node.js 18+
- npm 或 pnpm
- Supabase 账号

### 环境配置

1. 克隆项目
```bash
git clone <repository-url>
cd claude-docs
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量

复制 `.env.example` 到 `.env.local` 并填写你的 Supabase 凭证：

```bash
cp .env.example .env.local
```

在 `.env.local` 中填写：
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
npm run preview
```

## Supabase 数据库设置

> **项目标识前缀**：为避免与其他项目冲突，所有表名、索引名和策略名均使用 `claude_docs_` 前缀。

### 方法一：使用 SQL 文件（推荐）

直接在 Supabase SQL Editor 中打开并执行项目根目录下的 [`supabase/schema.sql`](supabase/schema.sql) 文件。

### 方法二：手动执行 SQL 脚本

在 Supabase SQL Editor 中执行以下 SQL 脚本：

```sql
-- ============================================
-- Claude Docs 数据库表结构
-- 项目前缀: claude_docs_
-- ============================================

-- 用户资料表
CREATE TABLE public.claude_docs_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 文件夹表
CREATE TABLE public.claude_docs_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.claude_docs_profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.claude_docs_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 文档表
CREATE TABLE public.claude_docs_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.claude_docs_profiles(id) ON DELETE CASCADE NOT NULL,
  folder_id UUID REFERENCES public.claude_docs_folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  is_starred BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 标签表
CREATE TABLE public.claude_docs_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.claude_docs_profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- 文档标签关联表
CREATE TABLE public.claude_docs_document_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.claude_docs_documents(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.claude_docs_tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(document_id, tag_id)
);

-- 版本历史表
CREATE TABLE public.claude_docs_document_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.claude_docs_documents(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.claude_docs_profiles(id)
);

-- 分享表
CREATE TABLE public.claude_docs_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.claude_docs_documents(id) ON DELETE CASCADE NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  password TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.claude_docs_profiles(id)
);

-- ============================================
-- 创建索引 (带项目前缀)
-- ============================================
CREATE INDEX claude_docs_idx_documents_user_id ON public.claude_docs_documents(user_id);
CREATE INDEX claude_docs_idx_documents_folder_id ON public.claude_docs_documents(folder_id);
CREATE INDEX claude_docs_idx_documents_updated_at ON public.claude_docs_documents(updated_at DESC);
CREATE INDEX claude_docs_idx_folders_user_id ON public.claude_docs_folders(user_id);
CREATE INDEX claude_docs_idx_folders_parent_id ON public.claude_docs_folders(parent_id);
CREATE INDEX claude_docs_idx_document_versions_document_id ON public.claude_docs_document_versions(document_id);
CREATE INDEX claude_docs_idx_shares_share_token ON public.claude_docs_shares(share_token);

-- ============================================
-- 启用行级安全 (RLS)
-- ============================================
ALTER TABLE public.claude_docs_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claude_docs_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claude_docs_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claude_docs_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claude_docs_document_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claude_docs_document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claude_docs_shares ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS 策略 (带项目前缀)
-- ============================================

-- Profiles 策略
CREATE POLICY "claude_docs_users_view_own_profile" ON public.claude_docs_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "claude_docs_users_update_own_profile" ON public.claude_docs_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "claude_docs_users_insert_own_profile" ON public.claude_docs_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Documents 策略
CREATE POLICY "claude_docs_users_select_own_documents" ON public.claude_docs_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "claude_docs_users_insert_own_documents" ON public.claude_docs_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "claude_docs_users_update_own_documents" ON public.claude_docs_documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "claude_docs_users_delete_own_documents" ON public.claude_docs_documents
  FOR DELETE USING (auth.uid() = user_id);

-- Folders 策略
CREATE POLICY "claude_docs_users_select_own_folders" ON public.claude_docs_folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "claude_docs_users_insert_own_folders" ON public.claude_docs_folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "claude_docs_users_update_own_folders" ON public.claude_docs_folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "claude_docs_users_delete_own_folders" ON public.claude_docs_folders
  FOR DELETE USING (auth.uid() = user_id);

-- Tags 策略
CREATE POLICY "claude_docs_users_select_own_tags" ON public.claude_docs_tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "claude_docs_users_insert_own_tags" ON public.claude_docs_tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "claude_docs_users_update_own_tags" ON public.claude_docs_tags
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "claude_docs_users_delete_own_tags" ON public.claude_docs_tags
  FOR DELETE USING (auth.uid() = user_id);

-- Document Tags 策略
CREATE POLICY "claude_docs_users_select_own_document_tags" ON public.claude_docs_document_tags
  FOR SELECT USING (
    auth.uid() = (
      SELECT user_id FROM public.claude_docs_documents
      WHERE claude_docs_documents.id = claude_docs_document_tags.document_id
    )
  );

CREATE POLICY "claude_docs_users_insert_own_document_tags" ON public.claude_docs_document_tags
  FOR INSERT WITH CHECK (
    auth.uid() = (
      SELECT user_id FROM public.claude_docs_documents
      WHERE claude_docs_documents.id = claude_docs_document_tags.document_id
    )
  );

CREATE POLICY "claude_docs_users_delete_own_document_tags" ON public.claude_docs_document_tags
  FOR DELETE USING (
    auth.uid() = (
      SELECT user_id FROM public.claude_docs_documents
      WHERE claude_docs_documents.id = claude_docs_document_tags.document_id
    )
  );

-- Document Versions 策略
CREATE POLICY "claude_docs_users_select_own_document_versions" ON public.claude_docs_document_versions
  FOR SELECT USING (
    auth.uid() = (
      SELECT user_id FROM public.claude_docs_documents
      WHERE claude_docs_documents.id = claude_docs_document_versions.document_id
    )
  );

CREATE POLICY "claude_docs_users_insert_own_document_versions" ON public.claude_docs_document_versions
  FOR INSERT WITH CHECK (
    auth.uid() = (
      SELECT user_id FROM public.claude_docs_documents
      WHERE claude_docs_documents.id = claude_docs_document_versions.document_id
    )
  );

-- Shares 策略
CREATE POLICY "claude_docs_users_select_own_shares" ON public.claude_docs_shares
  FOR SELECT USING (
    auth.uid() = (
      SELECT user_id FROM public.claude_docs_documents
      WHERE claude_docs_documents.id = claude_docs_shares.document_id
    )
  );

CREATE POLICY "claude_docs_users_insert_own_shares" ON public.claude_docs_shares
  FOR INSERT WITH CHECK (
    auth.uid() = (
      SELECT user_id FROM public.claude_docs_documents
      WHERE claude_docs_documents.id = claude_docs_shares.document_id
    )
  );

CREATE POLICY "claude_docs_users_update_own_shares" ON public.claude_docs_shares
  FOR UPDATE USING (
    auth.uid() = created_by
  );

CREATE POLICY "claude_docs_users_delete_own_shares" ON public.claude_docs_shares
  FOR DELETE USING (
    auth.uid() = created_by
  );

-- 公开分享访问策略（无需登录即可访问分享的文档）
CREATE POLICY "claude_docs_public_select_shares" ON public.claude_docs_shares
  FOR SELECT USING (true);
```

## 项目结构

```
src/
├── components/           # UI组件
│   ├── editor/          # 编辑器组件
│   ├── file-tree/       # 文件树组件
│   ├── search/          # 搜索组件
│   ├── auth/            # 认证组件
│   └── ui/              # shadcn/ui基础组件
├── pages/               # 页面组件
├── hooks/               # 自定义Hooks
├── store/               # Zustand状态管理
├── services/            # 服务层（Supabase）
├── types/               # TypeScript类型定义
├── utils/               # 工具函数
└── styles/              # 样式文件
```

## 开发计划

- [x] 阶段1: 项目初始化
- [x] 阶段2: 认证系统
- [x] 阶段3: 编辑器核心功能
- [x] 阶段4: 文件管理系统
- [x] 阶段5: 搜索功能
- [x] 阶段6: 实时同步与离线支持
- [x] 阶段7: 增强功能 (标签系统、文档分享、快捷键、主题切换、设置页面)
- [ ] 阶段8: 测试与优化

## 许可证

MIT License
