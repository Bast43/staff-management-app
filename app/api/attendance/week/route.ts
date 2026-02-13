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
    const date = searchParams.get('date') // Date du lundi
    const storeFilter = searchParams.get('store')

    if (!date) {
      return NextResponse.json({ error: 'Date requise' }, { status: 400 })
    }

    // Générer les 7 jours de la semaine
    const monday = new Date(date)
    const weekDates: string[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      weekDates.push(d.toISOString().split('T')[0])
    }

    // Récupérer les employés
    let employeesQuery = supabase
      .from('users')
      .select(`
        id,
        name,
        position,
        store_id,
        store:stores(name)
      `)
      .eq('role', 'employee')
      .order('name')

    if (storeFilter && storeFilter !== 'all') {
      employeesQuery = employeesQuery.eq('store_id', storeFilter)
    }

    const { data: employees } = await employeesQuery

    if (!employees) {
      return NextResponse.json([])
    }

    // Récupérer toutes les présences de la semaine
    const { data: attendances } = await supabase
      .from('attendance')
      .select('*')
      .in('date', weekDates)

    // Récupérer les congés approuvés qui impactent cette semaine
    const { data: leaves } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('status', 'approved')
      .or(`start_date.lte.${weekDates[6]},end_date.gte.${weekDates[0]}`)

    // Récupérer les prochains congés pour chaque employé (après cette semaine)
    const today = new Date().toISOString().split('T')[0]
    const { data: nextLeaves } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('status', 'approved')
      .gte('start_date', today)
      .order('start_date', { ascending: true })

    // Construire les données
    const weekData = employees.map(emp => {
      const empAttendances = attendances?.filter(a => a.user_id === emp.id) || []
      const empLeaves = leaves?.filter(l => l.user_id === emp.id) || []
      const empNextLeave = nextLeaves?.find(l => l.user_id === emp.id && l.start_date > weekDates[6])

      const days = weekDates.map(dateStr => {
        // Vérifier si en congé
        const isOnLeave = empLeaves.some(leave => 
          dateStr >= leave.start_date && dateStr <= leave.end_date
        )

        if (isOnLeave) {
          return { date: dateStr, status: 'leave' as const }
        }

        // Vérifier présence/absence
        const att = empAttendances.find(a => a.date === dateStr)
        if (att) {
          return {
            date: dateStr,
            status: att.status as 'present' | 'absent',
            justification: att.justification || undefined,
          }
        }

        return { date: dateStr, status: null }
      })

      // Calculer les jours du prochain congé
      let nextLeaveInfo = undefined
      if (empNextLeave) {
        const start = new Date(empNextLeave.start_date)
        const end = new Date(empNextLeave.end_date)
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
        
        nextLeaveInfo = {
          start_date: empNextLeave.start_date,
          end_date: empNextLeave.end_date,
          days: daysDiff,
        }
      }

      return {
        employee: {
          id: emp.id,
          name: emp.name,
          position: emp.position,
          store_id: emp.store_id,
          store_name: (() => {
            const store: any = emp.store;
            if (Array.isArray(store)) {
              return store.length > 0 && store[0]?.name ? store[0].name : 'N/A';
            }
            return store && store.name ? store.name : 'N/A';
          })(),
        },
        days,
        nextLeave: nextLeaveInfo,
      }
    })

    return NextResponse.json(weekData)
  } catch (error) {
    console.error('Week attendance error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
