'use client'

import type { ComponentType } from 'react'
import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Activity, FileText, LayoutDashboard, LogOut, Settings, Users } from 'lucide-react'

import { AppLogo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { ModeToggle } from '@/components/mode-toggle'

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
      <div className="flex min-h-screen items-center justify-center bg-background" suppressHydrationWarning>
        <div className="rounded-md border border-border bg-card px-6 py-5 text-center" suppressHydrationWarning>
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border border-muted-foreground/40 border-t-primary" suppressHydrationWarning />
          <p className="mt-3 text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const isAdmin = user.role === 'admin'

  type NavItem = {
    href: string
    label: string
    icon: ComponentType<{ className?: string }>
  }

  const userNavItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/quizzes', label: 'Meus Quizzes', icon: FileText },
    { href: '/history', label: 'Histórico', icon: Activity },
    { href: '/integration', label: 'Integração', icon: Settings },
  ]

  const adminNavItems: NavItem[] = [
    { href: '/admin/users', label: 'Usuários', icon: Users },
    { href: '/admin/audit', label: 'Auditoria', icon: Activity },
  ]

  const navItems = isAdmin ? adminNavItems : userNavItems

  const renderNavLink = (item: NavItem, variant: "sidebar" | "pill" = "sidebar") => {
    const Icon = item.icon
    const isActive = pathname === item.href

    return (
      <Link
        key={`${variant}-${item.href}`}
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
          variant === "pill" && "flex-none",
          isActive
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
        )}
      >
        <span
          className={cn(
            "h-1 w-1 rounded-full bg-transparent transition group-hover:bg-primary/60",
            isActive && "h-2 w-2 bg-primary"
          )}
        />
        <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
        <span>{item.label}</span>
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-background" suppressHydrationWarning>
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-full flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <AppLogo />
          <div className="flex items-center gap-4">
            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                      {user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {isAdmin ? 'Administrador' : 'Usuário'}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="lg:hidden">
        <div className="mx-auto w-full max-w-full px-4 pt-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {navItems.map((item) => renderNavLink(item, "pill"))}
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-full flex-col gap-8 px-4 pb-10 pt-6 lg:flex-row lg:px-8">
        <aside className="hidden w-60 flex-shrink-0 lg:block">
          <nav className="space-y-1">
            {navItems.map((item) => renderNavLink(item))}
          </nav>
        </aside>

        <main className="flex-1" suppressHydrationWarning>
          <div className="flex flex-col gap-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

