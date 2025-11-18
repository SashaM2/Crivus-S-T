'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { BarChart3, Eye, EyeOff } from 'lucide-react'

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
        // Mensagens de erro mais específicas
        let errorMessage = 'Credenciais inválidas'
        
        if (authError.message.includes('Invalid login credentials')) {
          errorMessage = 'Email ou senha incorretos. Verifique suas credenciais.'
        } else if (authError.message.includes('Email not confirmed')) {
          errorMessage = 'Email não confirmado. Verifique sua caixa de entrada.'
        } else if (authError.message.includes('User not found')) {
          errorMessage = 'Usuário não encontrado. Verifique se o email está correto.'
        } else if (authError.message.includes('Invalid API key') || authError.message.includes('api key')) {
          errorMessage = 'Chave da API do Supabase inválida. Verifique o arquivo .env.local e certifique-se de que NEXT_PUBLIC_SUPABASE_ANON_KEY está configurada corretamente.'
        } else {
          errorMessage = authError.message || 'Erro ao fazer login'
        }
        
        console.error('Erro de autenticação:', {
          message: authError.message,
          status: authError.status,
          name: authError.name
        })
        
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

      // Buscar perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError)
        
        let errorMessage = 'Erro ao carregar perfil do usuário'
        
        if (profileError.code === 'PGRST116') {
          errorMessage = 'Perfil não encontrado. Entre em contato com o administrador.'
        } else if (profileError.message.includes('permission denied') || profileError.message.includes('policy')) {
          errorMessage = 'Erro de permissão. As políticas RLS podem estar incorretas. Execute o script de correção.'
        } else {
          errorMessage = profileError.message || errorMessage
        }
        
        toast({
          title: 'Erro ao carregar perfil',
          description: errorMessage,
          variant: 'destructive',
        })
        await supabase.auth.signOut()
        return
      }

      if (!profile) {
        toast({
          title: 'Perfil não encontrado',
          description: 'Seu perfil não foi encontrado. Entre em contato com o administrador.',
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
      
      // Redirecionar baseado no papel
      if (profile.role === 'admin') {
        router.push('/admin/users')
      } else {
        router.push('/dashboard')
      }
    } catch (error: any) {
      console.error('Erro inesperado no login:', error)
      toast({
        title: 'Erro ao fazer login',
        description: error.message || 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BarChart3 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Crivus Quiz Analytics ST</span>
          </div>
          <p className="text-gray-600">Faça login para acessar sua conta</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-gray-600">
              <Link href="/" className="hover:underline">
                Voltar para a página inicial
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

