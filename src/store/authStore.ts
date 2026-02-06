import { create } from 'zustand'
import { supabase } from '@/services/supabase/client'
import type { User, Session, LoginInput, RegisterInput } from '@/types'

interface AuthStore {
  user: User | null
  session: Session | null
  loading: boolean
  initialized: boolean

  // Actions
  initialize: () => Promise<void>
  signIn: (input: LoginInput) => Promise<void>
  signUp: (input: RegisterInput) => Promise<void>
  signOut: () => Promise<void>
  ensureProfile: (userId: string, email: string, displayName?: string) => Promise<void>
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
}

// 用于存储订阅引用，防止重复订阅
let authStateChangeSubscription: { unsubscribe: () => void } | null = null

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  initialized: false,

  // 确保 profile 存在，如果不存在则创建
  ensureProfile: async (userId: string, email: string, displayName?: string) => {
    const { data: existingProfile } = await supabase
      .from('claude_docs_profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (!existingProfile) {
      // 创建 profile
      const { error: profileError } = await supabase.from('claude_docs_profiles').insert({
        id: userId,
        email,
        display_name: displayName,
      })

      if (profileError) {
        console.error('Error creating profile:', profileError)
      }
    }
  },

  // 加载用户 profile
  loadUserProfile: async (userId: string) => {
    const { data: profile } = await supabase
      .from('claude_docs_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    // 如果没有 profile，自动创建一个
    if (!profile) {
      await get().ensureProfile(
        userId,
        '', // email 将从 session 获取
        '' // displayName 将从 user_metadata 获取
      )

      // 重新获取 profile
      const { data: newProfile } = await supabase
        .from('claude_docs_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      return newProfile
    }

    return profile
  },

  initialize: async () => {
    // 防止重复初始化
    if (get().initialized) {
      return
    }

    set({ loading: true })

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        const profile = await get().loadUserProfile(session.user.id)

        set({
          user: profile || null,
          session: {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at || 0,
            user: profile || null,
          },
        })
      }

      // 清除之前的订阅（如果有）
      if (authStateChangeSubscription) {
        authStateChangeSubscription.unsubscribe()
        authStateChangeSubscription = null
      }

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session) {
          const profile = await get().loadUserProfile(session.user.id)

          set({
            user: profile || null,
            session: {
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              expires_at: session.expires_at || 0,
              user: profile || null,
            },
          })
        } else {
          set({ user: null, session: null })
        }
        set({ loading: false })
      })

      authStateChangeSubscription = { unsubscribe: () => subscription?.unsubscribe() }
    } catch (error) {
      console.error('Error initializing auth:', error)
      set({ loading: false })
    } finally {
      set({ loading: false, initialized: true })
    }
  },

  signIn: async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }
  },

  signUp: async ({ email, password, display_name }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name,
        },
      },
    })

    if (error) {
      throw error
    }

    if (data.user) {
      // 等待一小段时间确保用户创建完成，然后创建 profile
      await new Promise(resolve => setTimeout(resolve, 500))

      await get().ensureProfile(data.user.id, email, display_name)
    }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
    set({ user: null, session: null })
  },

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
}))
