import { create } from 'zustand'
import { supabase } from '@/services/supabase/client'
import type { User, Session, LoginInput, RegisterInput } from '@/types'

interface AuthStore {
  user: User | null
  session: Session | null
  loading: boolean
  initialized: boolean
  initializing: boolean

  // Actions
  initialize: () => Promise<void>
  signIn: (input: LoginInput) => Promise<void>
  signUp: (input: RegisterInput) => Promise<void>
  signOut: () => Promise<void>
  ensureProfile: (userId: string, email: string, displayName?: string) => Promise<void>
  loadUserProfile: (userId: string, email?: string, displayName?: string) => Promise<User | null>
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
}

// 用于存储订阅引用，防止重复订阅
let authStateChangeSubscription: { unsubscribe: () => void } | null = null
// 防止重复初始化的锁
let initializePromise: Promise<void> | null = null
// 防止并发加载 profile 的锁
let loadingProfileUserId: string | null = null
let loadingProfilePromise: Promise<User | null> | null = null

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  initialized: false,
  initializing: false,

  // 确保 profile 存在，如果不存在则创建
  ensureProfile: async (userId: string, email: string, displayName?: string) => {
    try {
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
          // PGRST116 = duplicate key violation - profile 已存在（被其他请求创建）
          // AbortError = 请求被中止，可能已创建成功
          if (profileError.code === 'PGRST116' || profileError.message?.includes('Abort')) {
            console.log('Profile already exists or creation was aborted, verifying...')
            // 验证 profile 是否已存在
            const { data: verifyProfile } = await supabase
              .from('claude_docs_profiles')
              .select('id')
              .eq('id', userId)
              .maybeSingle()
            if (verifyProfile) {
              console.log('Profile verified to exist')
              return // Profile 已存在，无需担心
            }
          }
          console.error('Error creating profile:', profileError)
        }
      }
    } catch (error: any) {
      // 忽略 AbortError，可能由于并发请求导致
      if (error?.name === 'AbortError' || error?.message?.includes('abort')) {
        console.log('Profile creation aborted, likely due to concurrent request')
        return
      }
      console.error('Unexpected error in ensureProfile:', error)
    }
  },

  // 加载用户 profile（带锁机制防止并发）
  loadUserProfile: async (userId: string, email?: string, displayName?: string) => {
    // 如果正在加载同一个用户的 profile，返回现有的 promise
    if (loadingProfileUserId === userId && loadingProfilePromise) {
      return loadingProfilePromise
    }

    // 创建新的加载 promise
    loadingProfileUserId = userId
    loadingProfilePromise = (async () => {
      try {
        const { data: profile } = await supabase
          .from('claude_docs_profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle()

        // 如果没有 profile，自动创建一个
        if (!profile) {
          await get().ensureProfile(userId, email || '', displayName)

          // 重新获取 profile
          const { data: newProfile } = await supabase
            .from('claude_docs_profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle()

          return newProfile
        }

        return profile
      } finally {
        // 清除锁
        loadingProfileUserId = null
        loadingProfilePromise = null
      }
    })()

    return loadingProfilePromise
  },

  initialize: async () => {
    // 如果已经在初始化中，返回现有的 promise
    if (initializePromise) {
      return initializePromise
    }

    // 如果已经初始化完成，直接返回
    if (get().initialized) {
      return
    }

    // 设置初始化中状态
    set({ initializing: true })

    // 创建初始化 promise
    initializePromise = (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          const email = session.user.email || ''
          const displayName = session.user.user_metadata?.display_name as string | undefined
          const profile = await get().loadUserProfile(session.user.id, email, displayName)

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
          console.log('Auth state changed:', _event, session?.user?.id)
          if (session) {
            try {
              const email = session.user.email || ''
              const displayName = session.user.user_metadata?.display_name as string | undefined
              const profile = await get().loadUserProfile(session.user.id, email, displayName)

              console.log('Profile loaded:', profile)

              set({
                user: profile || null,
                session: {
                  access_token: session.access_token,
                  refresh_token: session.refresh_token,
                  expires_at: session.expires_at || 0,
                  user: profile || null,
                },
              })
            } catch (error) {
              console.error('Error loading user profile after auth change:', error)
            }
          } else {
            set({ user: null, session: null })
          }
          set({ loading: false })
        })

        authStateChangeSubscription = { unsubscribe: () => subscription?.unsubscribe() }
      } catch (error) {
        // AbortError 通常是由于重复初始化导致的，可以忽略
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Auth initialization aborted (likely due to concurrent init)')
        } else {
          console.error('Error initializing auth:', error)
        }
      } finally {
        set({ loading: false, initializing: false, initialized: true })
        initializePromise = null
      }
    })()

    return initializePromise
  },

  signIn: async ({ email, password }) => {
    console.log('Attempting sign in for:', email)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Sign in error:', error)
      throw error
    }

    console.log('Sign in successful:', data.user?.id, data.session)

    // 立即设置会话和用户状态以减少等待时间
    if (data.session) {
      const userEmail = data.session.user.email || ''
      const displayName = data.session.user.user_metadata?.display_name as string | undefined
      let profile = await get().loadUserProfile(data.session.user.id, userEmail, displayName)

      // 如果 profile 加载失败，等待一小段时间后重试（给并发请求完成的时间）
      if (!profile) {
        console.log('Profile not loaded, retrying after delay...')
        await new Promise(resolve => setTimeout(resolve, 800))
        profile = await get().loadUserProfile(data.session.user.id, userEmail, displayName)
      }

      // 使用 profile，如果为 null 则创建一个基本的 user 对象用于会话管理
      const user: User = profile || {
        id: data.session.user.id,
        email: userEmail,
        display_name: displayName || userEmail.split('@')[0],
        avatar_url: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // 设置状态
      set({
        user,
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at || 0,
          user,
        },
        loading: false,
      })

      console.log('State after sign in:', { userId: user.id, hasProfile: !!profile })
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
