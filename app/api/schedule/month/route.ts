import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// Couleurs prédéfinies pour les pastilles
const EMPLOYEE_COLORS = [
  '#3B82F6', // Bleu
  '#10B981', // Vert
  '#F59E0B', // Orange
  '#EF4444', // Rouge
  '#8B5CF6', // Violet
  '#EC4899', // Rose
  '#14B8A6', // Turquoise
  '#F97316', // Orange foncé
  '#6366F1', // Indigo
  '#84CC16', // Lime
]

function getInitials(name: string): string {
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

function getColorForEmployee(index: number): string {
  return EMPLOYEE_COLORS[index % EMPLOYEE_COLORS.length]
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('store')
    const year = parseInt(searchParams.get('year') || '')
    const month = parseInt(searchParams.get('month') || '')

    if (!storeId || !year || !month) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    // Récupérer tous les employés du magasin
    const { data: employees, error: empError } = await supabase
      .from('users')
      .select('id, name')
      .eq('store_id', storeId)
      .eq('role', 'employee')
      .order('name')

    if (empError) throw empError

    if (!employees || employees.length === 0) {
      return NextResponse.json([])
    }

    // Créer la structure avec couleurs et initiales
    const employeesWithColors = employees.map((emp, index) => ({
      id: emp.id,
      name: emp.name,
      initials: getInitials(emp.name),
      color: getColorForEmployee(index),
    }))

    // Calculer le premier et dernier jour du mois
    const firstDay = new Date(Date.UTC(year, month - 1, 1))
    const lastDay = new Date(Date.UTC(year, month, 0))
    const startDate = firstDay.toISOString().split('T')[0]
    const endDate = lastDay.toISOString().split('T')[0]

    // Récupérer les congés approuvés pour ce mois
    const { data: leaves } = await supabase
      .from('leave_requests')
      .select('user_id, start_date, end_date')
      .eq('status', 'approved')
      .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)

    // Récupérer les grilles horaires (jours travaillés)
    const employeeIds = employees.map(e => e.id)
    const { data: schedules } = await supabase
      .from('work_schedules')
      .select('*')
      .in('user_id', employeeIds)

    // Créer un objet pour accès rapide aux grilles
    const scheduleMap = new Map<string, any[]>()
    schedules?.forEach(s => {
      if (!scheduleMap.has(s.user_id)) {
        scheduleMap.set(s.user_id, [])
      }
      scheduleMap.get(s.user_id)!.push(s)
    })

    // Générer tous les jours du mois
    const monthSchedule = []
    const currentDate = new Date(firstDay)

    while (currentDate <= lastDay) {
      const dateStr = currentDate.toISOString().split('T')[0]
      // Mapping JS: 0=dimanche, 1=lundi, ..., 6=samedi
      // Mapping affichage: 0=lundi, ..., 5=samedi, 6=dimanche
      const displayDayIndex = currentDate.getUTCDay() === 0 ? 6 : currentDate.getUTCDay() - 1;

      const dayEmployees = employeesWithColors.map(emp => {
        // Vérifier si en congé
        const isOnLeave = leaves?.some(leave => 
          leave.user_id === emp.id &&
          dateStr >= leave.start_date &&
          dateStr <= leave.end_date
        ) || false

        if (isOnLeave) {
          return {
            ...emp,
            isWorking: false,
          }
        }

        // Vérifier la grille horaire
        const userSchedule = scheduleMap.get(emp.id)
        if (userSchedule && userSchedule.length > 0) {
          const daySchedule = userSchedule.find(s => s.day_of_week === displayDayIndex)
          return {
            ...emp,
            isWorking: daySchedule?.is_working_day || false,
          }
        }

        // Par défaut : lundi-vendredi (displayDayIndex 0-4)
        return {
          ...emp,
          isWorking: displayDayIndex >= 0 && displayDayIndex <= 4,
        }
      })

      monthSchedule.push({
        date: dateStr,
        employees: dayEmployees,
      })

      currentDate.setUTCDate(currentDate.getUTCDate() + 1)
    }

    return NextResponse.json(monthSchedule)
  } catch (error) {
    console.error('Month schedule error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
