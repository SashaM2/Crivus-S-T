"use client"

import * as React from "react"
import { format, parse } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Calendar as CalendarIcon } from "lucide-react"
import { DayPicker, type DayPickerProps } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { createPortal } from "react-dom"

export interface DatePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

const months = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
]

export function DatePicker({
  value,
  onChange,
  placeholder = "Selecione uma data",
  className,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [view, setView] = React.useState<'calendar' | 'month' | 'year'>('calendar')
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const popoverRef = React.useRef<HTMLDivElement>(null)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })
  const [mounted, setMounted] = React.useState(false)
  
  const date = React.useMemo(() => {
    if (!value) return undefined
    try {
      const parsed = parse(value, "yyyy-MM-dd", new Date())
      if (isNaN(parsed.getTime())) return undefined
      return parsed
    } catch {
      return undefined
    }
  }, [value])

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const updatePosition = React.useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
      })
    }
  }, [])

  React.useEffect(() => {
    if (open) {
      updatePosition()
      const handleScroll = () => updatePosition()
      const handleResize = () => updatePosition()
      
      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleResize)
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true)
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [open, updatePosition])

  const [displayMonth, setDisplayMonth] = React.useState<Date>(date || new Date())
  
  React.useEffect(() => {
    if (date) {
      setDisplayMonth(date)
    }
  }, [date])

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const formattedDate = format(selectedDate, "yyyy-MM-dd")
      onChange?.(formattedDate)
      setDisplayMonth(selectedDate)
      setOpen(false)
      setView('calendar')
    } else {
      onChange?.("")
    }
  }

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = date 
      ? new Date(date.getFullYear(), monthIndex, Math.min(date.getDate(), new Date(date.getFullYear(), monthIndex + 1, 0).getDate()))
      : new Date(new Date().getFullYear(), monthIndex, 1)
    setDisplayMonth(newDate)
    setView('calendar')
  }

  const handleYearSelect = (year: number) => {
    const newDate = date
      ? new Date(year, date.getMonth(), Math.min(date.getDate(), new Date(year, date.getMonth() + 1, 0).getDate()))
      : new Date(year, new Date().getMonth(), 1)
    setDisplayMonth(newDate)
    setView('calendar')
  }

  const handleClickOutside = (e: MouseEvent) => {
    if (
      popoverRef.current &&
      !popoverRef.current.contains(e.target as Node) &&
      triggerRef.current &&
      !triggerRef.current.contains(e.target as Node)
    ) {
      setOpen(false)
      setTimeout(() => setView('calendar'), 100)
    }
  }

  React.useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const currentYear = displayMonth.getFullYear()
  const currentMonth = displayMonth.getMonth()
  const years = Array.from({ length: 20 }, (_, i) => currentYear - 10 + i)

  const displayValue = date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : null

  if (!mounted) {
    return (
      <Button
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal h-10",
          !date && "text-muted-foreground",
          className
        )}
        disabled={disabled}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {displayValue || <span>{placeholder}</span>}
      </Button>
    )
  }

  return (
    <>
      <Button
        ref={triggerRef}
        variant="outline"
        onClick={() => {
          if (!open) {
            setView('calendar')
          }
          setOpen(!open)
        }}
        className={cn(
          "w-full justify-start text-left font-normal h-10",
          !date && "text-muted-foreground",
          className
        )}
        disabled={disabled}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {displayValue || <span>{placeholder}</span>}
      </Button>
      
      {open && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-[100] rounded-lg border border-border/50 bg-popover text-popover-foreground shadow-lg p-2.5"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {view === 'calendar' && (
            <>
              <div className="flex items-center justify-between mb-2.5 px-0.5">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setView('month')
                    }}
                    className="text-xs text-foreground/90 hover:text-foreground transition-colors font-normal cursor-pointer"
                  >
                    {months[currentMonth]}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setView('year')
                    }}
                    className="text-xs text-foreground/90 hover:text-foreground transition-colors font-normal cursor-pointer"
                  >
                    {currentYear}
                  </button>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDisplayMonth(new Date(currentYear, currentMonth - 1, 1))
                    }}
                    className="h-5 w-5 flex items-center justify-center hover:bg-muted/40 transition-colors rounded cursor-pointer"
                  >
                    <ChevronLeft className="h-3 w-3 text-foreground/60" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDisplayMonth(new Date(currentYear, currentMonth + 1, 1))
                    }}
                    className="h-5 w-5 flex items-center justify-center hover:bg-muted/40 transition-colors rounded cursor-pointer"
                  >
                    <ChevronRight className="h-3 w-3 text-foreground/60" />
                  </button>
                </div>
              </div>

              <DayPicker
                mode="single"
                selected={date}
                onSelect={handleSelect}
                locale={ptBR}
                month={displayMonth}
                onMonthChange={setDisplayMonth}
                className="p-0"
                formatters={{
                  formatWeekdayName: (date: Date) => {
                    const weekdays = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']
                    return weekdays[date.getDay()] || ''
                  }
                } as any}
                components={{
                  Caption: () => null,
                } as any}
                classNames={{
                  months: "flex flex-col",
                  month: "space-y-0",
                  caption: "!hidden",
                  caption_label: "!hidden",
                  nav: "!hidden",
                  table: "w-full border-collapse",
                  head_row: "flex mb-1",
                  head_cell: "text-muted-foreground/70 w-7 font-normal text-[9px] text-center lowercase",
                  row: "flex w-full",
                  cell: "h-7 w-7 text-center p-0 relative",
                  day: cn(
                    "h-7 w-7 p-0 font-normal text-xs text-foreground/90",
                    "hover:bg-muted/30 hover:text-foreground",
                    "rounded transition-colors",
                    "focus-visible:outline-none"
                  ),
                  day_selected: "bg-muted/50 text-foreground font-normal hover:bg-muted/60",
                  day_today: "text-foreground",
                  day_outside: "text-muted-foreground/40 opacity-50",
                  day_disabled: "text-muted-foreground/30 opacity-30",
                  day_hidden: "invisible",
                }}
              />
            </>
          )}

          {view === 'month' && (
            <div className="w-44">
              <div className="flex items-center justify-between mb-2.5">
                <button
                  onClick={() => setView('year')}
                  className="text-xs text-foreground/90 hover:text-foreground transition-colors font-normal"
                >
                  {currentYear}
                </button>
                <button
                  onClick={() => setView('calendar')}
                  className="text-[10px] text-muted-foreground/70 hover:text-foreground transition-colors"
                >
                  ←
                </button>
              </div>
              <div className="grid grid-cols-3 gap-0.5">
                {months.map((month, index) => (
                  <button
                    key={index}
                    onClick={() => handleMonthSelect(index)}
                    className={cn(
                      "text-[10px] px-1.5 py-1 rounded transition-colors text-left font-normal",
                      currentMonth === index
                        ? "bg-muted/40 text-foreground"
                        : "hover:bg-muted/20 text-foreground/80"
                    )}
                  >
                    {month.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {view === 'year' && (
            <div className="w-44 max-h-56 overflow-y-auto">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs text-foreground/90 font-normal">Ano</span>
                <button
                  onClick={() => setView('calendar')}
                  className="text-[10px] text-muted-foreground/70 hover:text-foreground transition-colors"
                >
                  ←
                </button>
              </div>
              <div className="grid grid-cols-4 gap-0.5">
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => handleYearSelect(year)}
                    className={cn(
                      "text-[10px] px-1.5 py-1 rounded transition-colors font-normal",
                      currentYear === year
                        ? "bg-muted/40 text-foreground"
                        : "hover:bg-muted/20 text-foreground/80"
                    )}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  )
}
