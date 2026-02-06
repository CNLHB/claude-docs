-- ============================================
-- Claude Docs 数据库表结构
-- 项目前缀: claude_docs_
-- 创建日期: 2025-01-06
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

-- ============================================
-- 启用 Realtime (用于实时同步)
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.claude_docs_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.claude_docs_folders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.claude_docs_tags;
