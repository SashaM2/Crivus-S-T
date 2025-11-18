'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { BarChart3, LayoutDashboard, FileText, Settings, Users, Activity, LogOut } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, setUser, loading, setLoading } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Se já temos o usuário carregado, não precisa verificar novamente
    const currentState = useAuthStore.getState()
    if (currentState.user && !currentState.loading) {
      console.log('✅ Usuário já carregado no store, pulando verificação')
      return
    }

    let isMounted = true
    let hasChecked = false
    let timeoutId: NodeJS.Timeout | null = null
    
    const checkUser = async () => {
      // Evitar múltiplas execuções simultâneas
      if (hasChecked) {
        console.log('⚠️ Verificação já em andamento, pulando...')
        return
      }
      hasChecked = true
      
      // Verificar novamente antes de começar
      const stateBeforeCheck = useAuthStore.getState()
      if (stateBeforeCheck.user && !stateBeforeCheck.loading) {
        console.log('✅ Usuário carregado antes de iniciar verificação')
        hasChecked = false
        return
      }

      try {
        setLoading(true)
        console.log('🔍 Verificando autenticação...')
        
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (!isMounted) return
        
        if (authError) {
          console.error('❌ Erro ao obter usuário:', authError)
          setLoading(false)
          router.push('/login')
          return
        }
        
        if (!authUser) {
          console.log('⚠️ Nenhum usuário autenticado')
          setLoading(false)
          router.push('/login')
          return
        }

        // Verificar se já temos o usuário no store antes de buscar
        const currentUser = useAuthStore.getState().user
        if (currentUser && currentUser.id === authUser.id) {
          console.log('✅ Usuário já carregado, pulando verificação')
          setLoading(false)
          return
        }

        console.log('✅ Usuário autenticado:', authUser.id)
        console.log('🔍 Buscando perfil...')

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (!isMounted) return

        if (profileError) {
          console.error('❌ Erro ao buscar perfil:', profileError)
          console.error('📋 Detalhes:', {
            message: profileError.message,
            code: profileError.code,
            details: profileError.details,
            hint: profileError.hint
          })
          setLoading(false)
          await supabase.auth.signOut()
          router.push('/login')
          return
        }

        if (!profile) {
          console.log('⚠️ Perfil não encontrado')
          setLoading(false)
          await supabase.auth.signOut()
          router.push('/login')
          return
        }

        if (!profile.active) {
          console.log('⚠️ Perfil desativado')
          setLoading(false)
          await supabase.auth.signOut()
          router.push('/login')
          return
        }

        console.log('✅ Perfil carregado:', profile.email, 'Role:', profile.role)
        console.log('💾 Salvando no store...')
        setUser(profile)
        console.log('⏸️ Desativando loading...')
        setLoading(false)
        console.log('✅ Store atualizado. Estado após update:', {
          user: useAuthStore.getState().user?.email,
          loading: useAuthStore.getState().loading
        })
        
        // Limpar timeout se ainda estiver ativo
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
      } catch (error) {
        console.error('❌ Erro inesperado:', error)
        if (isMounted) {
          setLoading(false)
          // Limpar timeout em caso de erro
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
          router.push('/login')
        }
      } finally {
        hasChecked = false
      }
    }

    // Timeout de segurança - se demorar mais de 15 segundos, redireciona
    // Aumentado para dar mais tempo em conexões lentas
    const timeout = setTimeout(() => {
      if (isMounted) {
        const currentUser = useAuthStore.getState().user
        const currentLoading = useAuthStore.getState().loading
        if (!currentUser && currentLoading) {
          console.error('⏱️ Timeout ao verificar usuário (15s)')
          console.error('📋 Estado atual:', {
            hasUser: !!currentUser,
            loading: currentLoading,
            isMounted
          })
          setLoading(false)
          router.push('/login')
        } else if (currentUser) {
          console.log('✅ Usuário encontrado antes do timeout')
        }
      }
      timeoutId = null
    }, 15000)

    timeoutId = timeout

    checkUser()
      .then(() => {
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
      })
      .catch((error) => {
        console.error('❌ Erro na verificação:', error)
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        if (isMounted) {
          setLoading(false)
          router.push('/login')
        }
      })

    return () => {
      isMounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      // Também limpar o timeout direto caso timeoutId não tenha sido atribuído
      clearTimeout(timeout)
    }
  }, [router, setUser, setLoading])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" suppressHydrationWarning>
        <div className="text-center" suppressHydrationWarning>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" suppressHydrationWarning></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const isAdmin = user.role === 'admin'

  const userNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/quizzes', label: 'Meus Quizzes', icon: FileText },
    { href: '/history', label: 'Histórico', icon: Activity },
    { href: '/integration', label: 'Integração', icon: Settings },
  ]

  const adminNavItems = [
    { href: '/admin/users', label: 'Usuários', icon: Users },
    { href: '/admin/audit', label: 'Auditoria', icon: Activity },
  ]

  return (
    <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Crivus Quiz Analytics ST</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
              {isAdmin ? 'Admin' : 'User'}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 flex gap-8">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0">
          <nav className="space-y-1">
            {isAdmin ? (
              <>
                {adminNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-primary/10 text-primary font-medium' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </>
            ) : (
              <>
                {userNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-primary/10 text-primary font-medium' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1" suppressHydrationWarning>
          {children}
        </main>
      </div>
    </div>
  )
}

