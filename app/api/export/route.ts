import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import jsPDF from 'jspdf'

export async function GET(request: NextRequest) {
  try {
    // Criar cliente Supabase usando cookies do request diretamente
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // Não podemos setar cookies em API routes, mas isso é ok
            // O middleware já atualiza os cookies
          },
        },
      }
    )
    
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const quiz_id = searchParams.get('quiz_id')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const utm_source = searchParams.get('utm_source')
    const utm_campaign = searchParams.get('utm_campaign')

    // Buscar eventos
    let query = supabase
      .from('events')
      .select('*, quizzes(user_id, titulo)')
      .order('timestamp', { ascending: false })

    // Se não for admin, filtrar apenas eventos dos próprios quizzes
    if (!isAdmin) {
      query = query.eq('quizzes.user_id', user.id)
    }

    if (quiz_id) {
      query = query.eq('quiz_id', quiz_id)
    }

    if (start_date) {
      query = query.gte('timestamp', start_date)
    }

    if (end_date) {
      query = query.lte('timestamp', end_date)
    }

    if (utm_source) {
      query = query.eq('utm_source', utm_source)
    }

    if (utm_campaign) {
      query = query.eq('utm_campaign', utm_campaign)
    }

    const { data: events, error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar eventos' },
        { status: 500 }
      )
    }

    if (!events || events.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum evento encontrado' },
        { status: 404 }
      )
    }

    // Formatar dados
    const formattedEvents = events.map((e: any) => ({
      id: e.id,
      user_id: e.user_id,
      quiz_titulo: e.quizzes?.titulo || '',
      event: e.event,
      question: e.question || '',
      page_id: e.page_id || '',
      page_url: e.page_url || '',
      timestamp: new Date(e.timestamp).toLocaleString('pt-BR'),
      utm_source: e.utm_source || '',
      utm_campaign: e.utm_campaign || '',
      lead_data: e.lead_data ? JSON.stringify(e.lead_data) : '',
    }))

    if (format === 'csv') {
      // CSV
      const headers = Object.keys(formattedEvents[0]).join(',')
      const rows = formattedEvents.map(e => 
        Object.values(e).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
      )
      const csv = [headers, ...rows].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="crivus-export-${Date.now()}.csv"`,
        },
      })
    } else if (format === 'txt') {
      // TXT (tabela simples)
      const headers = Object.keys(formattedEvents[0])
      const maxWidths = headers.map(h => 
        Math.max(h.length, ...formattedEvents.map(e => String(e[h as keyof typeof formattedEvents[0]]).length))
      )

      const pad = (str: string, width: number) => String(str).padEnd(width)

      let txt = headers.map((h, i) => pad(h, maxWidths[i])).join(' | ') + '\n'
      txt += headers.map((_, i) => '-'.repeat(maxWidths[i])).join('-|-') + '\n'

      formattedEvents.forEach(event => {
        txt += headers.map((h, i) => pad(String(event[h as keyof typeof formattedEvents[0]]), maxWidths[i])).join(' | ') + '\n'
      })

      return new NextResponse(txt, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="crivus-export-${Date.now()}.txt"`,
        },
      })
    } else if (format === 'pdf') {
      // PDF
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('Relatório de Eventos - Crivus Quiz Analytics', 14, 20)
      doc.setFontSize(10)

      let y = 35
      const pageHeight = doc.internal.pageSize.height
      const lineHeight = 7

      formattedEvents.forEach((event, index) => {
        if (y > pageHeight - 20) {
          doc.addPage()
          y = 20
        }

        doc.setFontSize(10)
        doc.text(`Evento ${index + 1}:`, 14, y)
        y += lineHeight

        Object.entries(event).forEach(([key, value]) => {
          if (y > pageHeight - 20) {
            doc.addPage()
            y = 20
          }
          doc.setFontSize(8)
          const text = `${key}: ${String(value)}`
          const lines = doc.splitTextToSize(text, 180)
          doc.text(lines, 20, y)
          y += lines.length * lineHeight
        })

        y += lineHeight
      })

      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="crivus-export-${Date.now()}.pdf"`,
        },
      })
    }

    return NextResponse.json(
      { error: 'Formato inválido. Use: csv, txt ou pdf' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Erro na API de exportação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

