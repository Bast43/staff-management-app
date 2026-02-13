import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || '')
    const month = parseInt(searchParams.get('month') || '')
    const storeFilter = searchParams.get('store')

    if (!year || !month) {
      return NextResponse.json({ error: 'Année et mois requis' }, { status: 400 })
    }

    // Calculer les dates du mois
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    // Récupérer les employés
    let employeesQuery = supabase
      .from('users')
      .select('id, name, position, store_id')
      .eq('role', 'employee')
      .order('name')

    if (storeFilter && storeFilter !== 'all') {
      employeesQuery = employeesQuery.eq('store_id', storeFilter)
    }

    const { data: employees } = await employeesQuery

    if (!employees || employees.length === 0) {
      return NextResponse.json([])
    }

    // Pour chaque employé, calculer les stats
    const stats = await Promise.all(
      employees.map(async (emp) => {
        // Récupérer grille horaire
        const { data: schedules } = await supabase
          .from('work_schedules')
          .select('*')
          .eq('user_id', emp.id)

        // Calculer jours travaillés du mois
        let totalWorkDays = 0
        const currentDate = new Date(startDate + 'T00:00:00Z')
        
        while (currentDate <= endDate) {
          const dayOfWeek = currentDate.getUTCDay() // 0 = dimanche, 6 = samedi
          
          if (schedules && schedules.length > 0) {
            const daySchedule = schedules.find(s => s.day_of_week === dayOfWeek)
            if (daySchedule?.is_working_day) {
              totalWorkDays++
            }
          } else {
            // Par défaut lundi-vendredi
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
              totalWorkDays++
            }
          }
          
          currentDate.setUTCDate(currentDate.getUTCDate() + 1)
        }

        // Compter présences
        const { count: presentCount } = await supabase
          .from('attendance')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', emp.id)
          .gte('date', startDateStr)
          .lte('date', endDateStr)
          .eq('status', 'present')

        // Compter absences
        const { count: absentCount } = await supabase
          .from('attendance')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', emp.id)
          .gte('date', startDateStr)
          .lte('date', endDateStr)
          .eq('status', 'absent')

        // Compter jours de congés approuvés
        const { data: leaves } = await supabase
          .from('leave_requests')
          .select('start_date, end_date')
          .eq('user_id', emp.id)
          .eq('status', 'approved')
          .or(`start_date.lte.${endDateStr},end_date.gte.${startDateStr}`)

        let leaveDays = 0
        leaves?.forEach(leave => {
          const leaveStart = new Date(Math.max(new Date(leave.start_date).getTime(), startDate.getTime()))
          const leaveEnd = new Date(Math.min(new Date(leave.end_date).getTime(), endDate.getTime()))
          
          const leaveDate = new Date(leaveStart)
          while (leaveDate <= leaveEnd) {
            const dayOfWeek = leaveDate.getUTCDay() // 0 = dimanche, 6 = samedi
            
            if (schedules && schedules.length > 0) {
              const daySchedule = schedules.find(s => s.day_of_week === dayOfWeek)
              if (daySchedule?.is_working_day) {
                leaveDays++
              }
            } else {
              if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                leaveDays++
              }
            }
            
            leaveDate.setUTCDate(leaveDate.getUTCDate() + 1)
          }
        })

        const presentDays = presentCount || 0
        const absentDays = absentCount || 0
        
        // Taux de présence = présences / (jours travaillés - congés)
        const workDaysMinusLeave = Math.max(1, totalWorkDays - leaveDays)
        const presenceRate = totalWorkDays > 0 ? (presentDays / workDaysMinusLeave) * 100 : 0

        return {
          id: emp.id,
          name: emp.name,
          position: emp.position,
          total_days: totalWorkDays,
          present_days: presentDays,
          absent_days: absentDays,
          leave_days: leaveDays,
          presence_rate: presenceRate,
        }
      })
    )

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Reports error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
