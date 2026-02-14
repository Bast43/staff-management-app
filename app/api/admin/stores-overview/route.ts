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

    // Utilise la date du jour en UTC pour éviter les soucis de fuseau
    const now = new Date()
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const today = todayUTC.toISOString().split('T')[0]
    const todayDayOfWeek = todayUTC.getUTCDay() // 0 = dimanche, 6 = samedi

    // Récupérer tous les magasins
    const { data: stores } = await supabase
      .from('stores')
      .select('*')
      .order('name')

    if (!stores) {
      return NextResponse.json([])
    }

    // Pour chaque magasin, compter les employés et leur statut
    const storesWithStats = await Promise.all(
      stores.map(async (store) => {
        // Compter total employés du magasin
        const { data: employees } = await supabase
          .from('users')
          .select('id')
          .eq('store_id', store.id)
          .eq('role', 'employee')

        const totalEmployees = employees?.length || 0

        if (totalEmployees === 0) {
          return {
            ...store,
            totalEmployees: 0,
            expectedToday: 0,
            presentCount: 0,
            absentCount: 0,
          }
        }

        // Pour chaque employé, vérifier s'il doit travailler aujourd'hui
        const employeeIds = employees?.map(e => e.id) || []
        
        // Récupérer les grilles horaires
        const { data: schedules } = await supabase
          .from('work_schedules')
          .select('*')
          .in('user_id', employeeIds)
          .eq('day_of_week', todayDayOfWeek)

        // Récupérer les congés approuvés pour aujourd'hui
        const { data: leavesToday } = await supabase
          .from('leave_requests')
          .select('user_id')
          .eq('status', 'approved')
          .lte('start_date', today)
          .gte('end_date', today)
          .in('user_id', employeeIds)

        const onLeaveIds = leavesToday?.map(l => l.user_id) || []

        // Calculer combien doivent travailler aujourd'hui
        let expectedToday = 0
        for (const empId of employeeIds) {
          // Si en congé, ne compte pas
          if (onLeaveIds.includes(empId)) {
            continue
          }

          // Vérifier grille horaire
          const schedule = schedules?.find(s => s.user_id === empId)
          
          if (schedule) {
            // Si a une grille, suivre la grille
            if (schedule.is_working_day) {
              expectedToday++
            }
          } else {
            // Pas de grille : par défaut lundi-vendredi
            if (todayDayOfWeek >= 1 && todayDayOfWeek <= 5) {
              expectedToday++
            }
          }
        }

        // Compter présents marqués
        const { count: presentCount } = await supabase
          .from('attendance')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', store.id)
          .eq('date', today)
          .eq('status', 'present')

        // Compter absents marqués
        const { count: absentCount } = await supabase
          .from('attendance')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', store.id)
          .eq('date', today)
          .eq('status', 'absent')

        return {
          ...store,
          totalEmployees,
          expectedToday,
          presentCount: presentCount || 0,
          absentCount: absentCount || 0,
        }
      })
    )

    return NextResponse.json(storesWithStats)
  } catch (error) {
    console.error('Stores overview error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
