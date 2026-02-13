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

    const today = new Date().toISOString().split('T')[0]

    // Récupérer tous les employés
    const { data: employees } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'employee')

    if (!employees) {
      return NextResponse.json({
        presentToday: 0,
        absentToday: 0,
        pendingRequests: 0,
        totalLeaveAvailable: 0,
      })
    }

    // Compter présents/absents aujourd'hui
    const { data: attendanceToday } = await supabase
      .from('attendance')
      .select('status')
      .eq('date', today)

    const presentToday = attendanceToday?.filter(a => a.status === 'present').length || 0
    const absentToday = attendanceToday?.filter(a => a.status === 'absent').length || 0

    // Compter demandes en attente
    const { data: pendingLeaves } = await supabase
      .from('leave_requests')
      .select('id')
      .eq('status', 'pending')

    // Calculer total congés disponibles (CORRECTION DU BUG)
    const totalLeaveAvailable = employees.reduce((sum, emp) => {
      return sum + (emp.total_leave_per_year - emp.used_leave)
    }, 0)

    return NextResponse.json({
      presentToday,
      absentToday,
      pendingRequests: pendingLeaves?.length || 0,
      totalLeaveAvailable,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
