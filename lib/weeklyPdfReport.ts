/**
 * Генерация недельного PDF-отчёта (jsPDF) с локальными шрифтами Noto Sans.
 * Шрифты лежат в: public/fonts/
 * - public/fonts/NotoSans-Regular.ttf
 * - public/fonts/NotoSans-SemiBold.ttf
 *
 * Важно:
 * 1) Этот код должен выполняться в браузере (client-side), потому что использует fetch + FileReader.
 * 2) Шрифты будут доступны по URL: /fonts/...
 */

export type HabitRow = { title: string; completed: number; total: number }
export type GoalRow = { title: string; progress: number; isCompleted: boolean }

export type WeeklyReportData = {
  weekLabel: string
  habits: HabitRow[]
  goals: GoalRow[]
  summary: { weekPct: number; activeHabits: number; goalsCount: number }
}

export async function downloadWeeklyPdf(data: WeeklyReportData): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  // --- helpers
  const getFontBase64 = async (url: string): Promise<string> => {
    const res = await fetch(url, { cache: 'force-cache' })
    if (!res.ok) throw new Error(`Font fetch failed: ${url} (${res.status})`)
    const blob = await res.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => reject(new Error('FileReader error'))
      reader.onloadend = () => {
        const result = reader.result as string
        // "data:font/ttf;base64,AAAA..." -> берём то, что после запятой
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.readAsDataURL(blob)
    })
  }

  const loadFonts = async () => {
    // ✅ локальные шрифты из public/fonts/
    const regularB64 = await getFontBase64('/fonts/NotoSans-Regular.ttf')
    const semiBoldB64 = await getFontBase64('/fonts/NotoSans-SemiBold.ttf')

    // ВАЖНО: имя файла в VFS должно совпадать с тем, что ты передаёшь в addFont
    doc.addFileToVFS('NotoSans-Regular.ttf', regularB64)
    doc.addFileToVFS('NotoSans-SemiBold.ttf', semiBoldB64)

    // familyName = 'NotoSans' (любой), style = normal/bold (так удобнее пользоваться)
    doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal')
    doc.addFont('NotoSans-SemiBold.ttf', 'NotoSans', 'bold')

    doc.setFont('NotoSans', 'normal')
  }

  try {
    await loadFonts()
  } catch (e) {
    console.error('Ошибка загрузки Noto Sans. PDF будет со стандартным шрифтом:', e)
    // fallback: helvetica
    doc.setFont('helvetica', 'normal')
  }

  // --- layout
  let y = 20
  const lineH = 7
  const margin = 20
  const pageH = doc.internal.pageSize.getHeight()

  const ensureSpace = (need: number) => {
    if (y + need > pageH - 15) {
      doc.addPage()
      y = 20
      // на новой странице повторно выставим шрифт (на всякий)
      try {
        doc.setFont('NotoSans', 'normal')
      } catch {
        doc.setFont('helvetica', 'normal')
      }
    }
  }

  const addText = (text: string, fontSize = 11, bold = false) => {
    ensureSpace(lineH + 2)
    doc.setFontSize(fontSize)
    try {
      doc.setFont('NotoSans', bold ? 'bold' : 'normal')
    } catch {
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
    }

    // splitTextToSize спасает от вылезания за правый край
    const maxWidth = doc.internal.pageSize.getWidth() - margin * 2
    const lines = doc.splitTextToSize(text, maxWidth)
    doc.text(lines, margin, y)
    y += lineH * lines.length
  }

  // --- content
  addText('Недельный отчёт — Solace', 16, true)
  y += 2
  addText(`Неделя: ${data.weekLabel}`, 12, false)
  y += 6

  addText('Привычки', 12, true)
  if (data.habits.length === 0) {
    addText('Нет активных привычек', 10, false)
  } else {
    data.habits.forEach((h) => {
      addText(`• ${h.title}: ${h.completed}/${h.total}`, 10, false)
    })
  }
  y += 4

  addText('Цели', 12, true)
  if (data.goals.length === 0) {
    addText('Нет целей', 10, false)
  } else {
    data.goals.forEach((g) => {
      const status = g.isCompleted ? ' ✓' : ` ${g.progress}%`
      addText(`• ${g.title}${status}`, 10, false)
    })
  }
  y += 4

  addText('Итог', 12, true)
  addText(
    `Выполнение за неделю: ${data.summary.weekPct}%. Активных привычек: ${data.summary.activeHabits}. Целей: ${data.summary.goalsCount}.`,
    10,
    false
  )

  const filename = `solace-report-${String(data.weekLabel).replace(/\s+/g, '-')}.pdf`
  doc.save(filename)
}