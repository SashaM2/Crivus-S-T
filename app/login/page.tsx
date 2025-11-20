'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, LayoutDashboard } from 'lucide-react'
import { AppLogo } from '@/components/logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { setUser } = useAuthStore()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        let errorMessage = 'Credenciais inválidas'

        if (authError.message.includes('Invalid login credentials')) {
          errorMessage = 'Email ou senha incorretos. Verifique suas credenciais.'
        } else if (authError.message.includes('Email not confirmed')) {
          errorMessage = 'Email não confirmado. Verifique sua caixa de entrada.'
        } else if (authError.message.includes('User not found')) {
          errorMessage = 'Usuário não encontrado. Verifique se o email está correto.'
        } else {
          errorMessage = authError.message || 'Erro ao fazer login'
        }

        toast({
          title: 'Erro ao fazer login',
          description: errorMessage,
          variant: 'destructive',
        })
        return
      }

      if (!authData.user) {
        toast({
          title: 'Erro ao fazer login',
          description: 'Não foi possível obter os dados do usuário',
          variant: 'destructive',
        })
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileError || !profile) {
        toast({
          title: 'Erro ao carregar perfil',
          description: 'Não foi possível carregar seu perfil. Tente novamente.',
          variant: 'destructive',
        })
        await supabase.auth.signOut()
        return
      }

      if (!profile.active) {
        toast({
          title: 'Conta desativada',
          description: 'Sua conta foi desativada. Entre em contato com o administrador.',
          variant: 'destructive',
        })
        await supabase.auth.signOut()
        return
      }

      setUser(profile)

      if (profile.role === 'admin') {
        router.push('/admin/users')
      } else {
        router.push('/dashboard')
      }
    } catch (error: any) {
      console.error('Erro inesperado no login:', error)
      toast({
        title: 'Erro ao fazer login',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r overflow-hidden">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 opacity-90" />

        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <LayoutDashboard className="h-[400px] w-[400px] animate-float" />
        </div>

        <div className="relative z-20 flex items-center text-lg font-medium">
          <LayoutDashboard className="mr-2 h-6 w-6" />
          Crivus Quiz Analytics
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;A melhor maneira de prever o futuro é criá-lo. Otimize seus funis e converta mais com dados precisos.&rdquo;
            </p>
            <footer className="text-sm">Equipe Crivus</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Bem-vindo de volta
            </h1>
            <p className="text-sm text-muted-foreground">
              Entre com seu email e senha para acessar
            </p>
          </div>

          <div className="grid gap-6">
            <form onSubmit={handleLogin}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    placeholder="nome@exemplo.com"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      placeholder="••••••••"
                      type={showPassword ? 'text' : 'password'}
                      autoCapitalize="none"
                      autoComplete="current-password"
                      disabled={loading}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Button disabled={loading} className="h-11">
                  {loading ? 'Entrando...' : 'Entrar com Email'}
                </Button>
              </div>
            </form>
          </div>

          <p className="px-8 text-center text-sm text-muted-foreground">
            <Link
              href="/"
              className="hover:text-brand underline underline-offset-4"
            >
              Voltar para o site
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
