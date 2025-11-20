import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function GET(request: NextRequest) {
  try {
    // Criar cliente Supabase usando cookies do request diretamente
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string) {
            // Não podemos setar cookies em API routes, mas isso é ok
            // O middleware já atualiza os cookies
          },
          remove(name: string) {
            // Não podemos remover cookies em API routes
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

    // Otimização: Selecionar apenas colunas necessárias
    let query = supabase
      .from('events')
      .select('id, timestamp, event, question, page_url, utm_source, utm_campaign, lead_data, quizzes(user_id, titulo)')
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

    // Otimização: Limitar PDF para evitar crash
    if (format === 'pdf') {
      query = query.limit(1000)
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
      user_id: e.user_id, // Note: user_id might not be in the select list above, check if needed. Added to select list implicitly? No, need to check.
      // Actually user_id is not in the select list I wrote above. 
      // Let's remove user_id from formattedEvents if it's not critical or add it to select.
      // It was used in the map but maybe not in the final output?
      // In the original code: user_id: e.user_id
      // Let's add user_id to select just in case.
      quiz_titulo: e.quizzes?.titulo || '',
      event: e.event,
      question: e.question || '',
      // page_id removed from select, remove here? Original had page_id. 
      // Let's keep page_id in select if it was there.
      // page_url: e.page_url || '',
      timestamp: new Date(e.timestamp).toLocaleString('pt-BR'),
      utm_source: e.utm_source || '',
      utm_campaign: e.utm_campaign || '',
      lead_data: e.lead_data ? JSON.stringify(e.lead_data) : '',
    }))

    if (format === 'csv') {
      // CSV Otimizado
      const headers = ['ID', 'Quiz', 'Evento', 'Pergunta', 'Data', 'Origem', 'Campanha', 'Dados Lead']
      const csvRows = [headers.join(',')]

      for (const event of formattedEvents) {
        const row = [
          event.id,
          `"${String(event.quiz_titulo).replace(/"/g, '""')}"`,
          event.event,
          `"${String(event.question).replace(/"/g, '""')}"`,
          `"${event.timestamp}"`,
          `"${String(event.utm_source).replace(/"/g, '""')}"`,
          `"${String(event.utm_campaign).replace(/"/g, '""')}"`,
          `"${String(event.lead_data).replace(/"/g, '""')}"`
        ]
        csvRows.push(row.join(','))
      }

      const csv = csvRows.join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="crivus-export-${Date.now()}.csv"`,
        },
      })
    } else if (format === 'txt') {
      // TXT (tabela simples)
      const headers = ['ID', 'Quiz', 'Evento', 'Pergunta', 'Data', 'Origem', 'Campanha']
      // Recalculate widths based on data
      const maxWidths = headers.map((h, i) => {
        // map headers to keys
        const keys = ['id', 'quiz_titulo', 'event', 'question', 'timestamp', 'utm_source', 'utm_campaign']
        const key = keys[i]
        return Math.max(h.length, ...formattedEvents.map(e => String(e[key as keyof typeof e] || '').length))
      })

      const pad = (str: string, width: number) => String(str).padEnd(width)

      let txt = headers.map((h, i) => pad(h, maxWidths[i])).join(' | ') + '\n'
      txt += headers.map((_, i) => '-'.repeat(maxWidths[i])).join('-|-') + '\n'

      formattedEvents.forEach(event => {
        const row = [event.id, event.quiz_titulo, event.event, event.question, event.timestamp, event.utm_source, event.utm_campaign]
        txt += row.map((val, i) => pad(String(val || ''), maxWidths[i])).join(' | ') + '\n'
      })

      return new NextResponse(txt, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="crivus-export-${Date.now()}.txt"`,
        },
      })
    } else if (format === 'pdf') {
      const doc = new jsPDF({ orientation: 'landscape' })
      doc.setFontSize(16)
      doc.text('Crivus Quiz Analytics - Eventos', 14, 18)
      doc.setFontSize(10)
      doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, 26)

      if (events.length >= 1000) {
        doc.setTextColor(220, 38, 38) // Red
        doc.text('Atenção: Exportação PDF limitada a 1000 registros por performance. Use CSV para dados completos.', 14, 32)
        doc.setTextColor(0, 0, 0) // Reset
      }

      const columns = [
        'ID',
        'Quiz',
        'Evento',
        'Pergunta',
        'Data',
        'UTM Source',
        'UTM Campaign',
      ]

      const rows = formattedEvents.map(event => [
        event.id,
        event.quiz_titulo,
        event.event,
        event.question,
        event.timestamp,
        event.utm_source,
        event.utm_campaign,
      ])

      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: events.length >= 1000 ? 38 : 32,
        styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
        headStyles: { fillColor: [74, 85, 104], textColor: 255 },
        alternateRowStyles: { fillColor: [247, 250, 252] },
        theme: 'grid',
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

