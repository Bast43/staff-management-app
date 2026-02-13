import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'employee') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || '0')
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    // Récupérer l'employé pour avoir son store_id
    const { data: currentEmployee } = await supabase
      .from('users')
      .select('store_id')
      .eq('id', user.userId)
      .single()

    if (!currentEmployee?.store_id) {
      return NextResponse.json([])
    }

    // Récupérer tous les employés du même magasin
    const { data: teammates } = await supabase
      .from('users')
      .select('id, name, position')
      .eq('store_id', currentEmployee.store_id)
      .eq('role', 'employee')
      .order('name')

    if (!teammates) {
      return NextResponse.json([])
    }

    // Calculer les dates du mois
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = firstDay.toISOString().split('T')[0]
    const endDate = lastDay.toISOString().split('T')[0]

    // Récupérer les présences du mois pour tous les employés
    const { data: attendance } = await supabase
      .from('attendance')
      .select('user_id, date, status')
      .eq('store_id', currentEmployee.store_id)
      .gte('date', startDate)
      .lte('date', endDate)

    // Récupérer les congés approuvés du mois
    const { data: leaves } = await supabase
      .from('leave_requests')
      .select('user_id, start_date, end_date')
      .eq('store_id', currentEmployee.store_id)
      .eq('status', 'approved')
      .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)

    // Construire le calendrier pour chaque employé
    const teamCalendar = teammates.map(emp => {
      const empAttendance = attendance?.filter(a => a.user_id === emp.id) || []
      const empLeaves = leaves?.filter(l => l.user_id === emp.id) || []

      // Générer tous les jours du mois avec leur statut
      const attendanceMap: any[] = []
      for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0]
        
        // Vérifier si en congé
        const isOnLeave = empLeaves.some(leave => 
          dateStr >= leave.start_date && dateStr <= leave.end_date
        )

        if (isOnLeave) {
          attendanceMap.push({ date: dateStr, status: 'leave' })
        } else {
          const att = empAttendance.find(a => a.date === dateStr)
          if (att) {
            attendanceMap.push({ date: dateStr, status: att.status })
          }
        }
      }

      return {
        ...emp,
        attendance: attendanceMap,
      }
    })

    return NextResponse.json(teamCalendar)
  } catch (error) {
    console.error('Team calendar error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
