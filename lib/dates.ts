import { differenceInBusinessDays, format, isWeekend, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

export function calculateBusinessDays(startDate: string, endDate: string): number {
  const start = parseISO(startDate)
  const end = parseISO(endDate)
  return differenceInBusinessDays(end, start) + 1
}

export function formatDate(date: string): string {
  return format(parseISO(date), 'dd MMM yyyy', { locale: fr })
}

export function formatDateTime(date: string): string {
  return format(parseISO(date), 'dd MMM yyyy HH:mm', { locale: fr })
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = []
  const date = new Date(year, month, 1)
  
  while (date.getMonth() === month) {
    days.push(new Date(date))
    date.setDate(date.getDate() + 1)
  }
  
  return days
}

export function isWorkDay(date: Date): boolean {
  return !isWeekend(date)
}

export function getMonthName(month: number): string {
  return format(new Date(2024, month, 1), 'MMMM yyyy', { locale: fr })
}

export function getWeekDays(): string[] {
  return ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
}

export function getStartOfWeek(date: Date): Date {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(date.setDate(diff))
}

export function getWeekDates(startDate: Date): Date[] {
  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    dates.push(date)
  }
  return dates
}
