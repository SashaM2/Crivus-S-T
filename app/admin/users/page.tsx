'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Plus, Trash2, Edit, UserX, UserCheck, MoreVertical } from 'lucide-react'
import type { Profile } from '@/lib/types'
import { formatDate } from '@/lib/utils'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user',
  })
  const { toast } = useToast()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      toast({
        title: 'Acesso negado',
        description: 'Apenas administradores podem acessar esta página',
        variant: 'destructive',
      })
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar usuários',
        variant: 'destructive',
      })
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!formData.email || !formData.password) {
      toast({
        title: 'Erro',
        description: 'Email e senha são obrigatórios',
        variant: 'destructive',
      })
      return
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast({
        title: 'Erro',
        description: 'Email inválido',
        variant: 'destructive',
      })
      return
    }

    // Validação de senha
    if (formData.password.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres',
        variant: 'destructive',
      })
      return
    }

    try {
      // Obter o token de acesso do Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        toast({
          title: 'Erro',
          description: 'Sessão expirada. Faça login novamente.',
          variant: 'destructive',
        })
        return
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          role: formData.role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar usuário')
      }

      toast({
        title: 'Sucesso',
        description: 'Usuário criado com sucesso',
      })
      setFormData({ email: '', password: '', role: 'user' })
      setOpen(false)
      await loadUsers()
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar usuário. Verifique o console para mais detalhes.',
        variant: 'destructive',
      })
    }
  }

  const handleUpdate = async (user: Profile) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          email: formData.email,
          role: formData.role,
        })
        .eq('id', user.id)

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: 'Usuário atualizado com sucesso',
      })
      setEditingUser(null)
      setFormData({ email: '', password: '', role: 'user' })
      setOpen(false)
      loadUsers()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar usuário',
        variant: 'destructive',
      })
    }
  }

  const handleToggleActive = async (user: Profile) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active: !user.active })
        .eq('id', user.id)

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: `Usuário ${!user.active ? 'ativado' : 'desativado'} com sucesso`,
      })
      loadUsers()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar usuário',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (user: Profile) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${user.email}?`)) return

    try {
      const response = await fetch(`/api/admin/users?id=${user.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir usuário')
      }

      toast({
        title: 'Sucesso',
        description: 'Usuário excluído com sucesso',
      })
      loadUsers()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir usuário',
        variant: 'destructive',
      })
    }
  }

  const openEditDialog = (user: Profile) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: '',
      role: user.role,
    })
    setOpen(true)
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      // Limpar formulário quando fechar
      setEditingUser(null)
      setFormData({ email: '', password: '', role: 'user' })
    } else if (!editingUser) {
      // Limpar formulário quando abrir para criar novo usuário
      setFormData({ email: '', password: '', role: 'user' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando usuários...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Administração</p>
            <h1 className="text-3xl font-semibold text-foreground">Gerenciar Usuários</h1>
            <p className="mt-2 text-sm text-muted-foreground">Controle acessos e mantenha sua equipe organizada</p>
          </div>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                </DialogTitle>
                <DialogDescription>
                  {editingUser ? 'Atualize as informações do usuário' : 'Crie um novo usuário no sistema'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="usuario@exemplo.com"
                  />
                </div>
                {!editingUser && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="••••••••"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="role">Papel</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: 'admin' | 'user') => setFormData(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => editingUser ? handleUpdate(editingUser) : handleCreate()}>
                  {editingUser ? 'Salvar' : 'Criar'}
                </Button>
              </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Papel</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Criado em</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-border/70 bg-card text-foreground transition hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        user.role === 'admin' ? 'bg-purple-100/80 text-purple-700' : 'bg-muted text-muted-foreground'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        user.active ? 'bg-emerald-100/80 text-emerald-700' : 'bg-rose-100/80 text-rose-700'
                      }`}>
                        {user.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md border border-border/60 hover:bg-muted/60"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => openEditDialog(user)}
                            className="cursor-pointer"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar usuário
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleActive(user)}
                            className="cursor-pointer"
                          >
                            {user.active ? (
                              <>
                                <UserX className="mr-2 h-4 w-4" />
                                Desativar usuário
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Ativar usuário
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(user)}
                            className="cursor-pointer text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir usuário
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                Nenhum usuário encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

