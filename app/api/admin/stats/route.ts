export const dynamic = "force-dynamic";
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

    // ← CORRIGÉ : Format de date plus strict pour éviter les problèmes timezone
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    console.log('📅 Date today:', today) // ← AJOUTÉ : Debug

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

    // ← CORRIGÉ : Utiliser count exact de Supabase au lieu de filter
    const { count: presentCount } = await supabase
      .from('attendance')
      .select('id', { count: 'exact', head: true })
      .eq('date', today)
      .eq('status', 'present')

    const { count: absentCount } = await supabase
      .from('attendance')
      .select('id', { count: 'exact', head: true })
      .eq('date', today)
      .eq('status', 'absent')

    console.log('✓ Présents:', presentCount, '✕ Absents:', absentCount) // ← AJOUTÉ : Debug

    // Compter demandes en attente
    const { count: pendingCount } = await supabase
      .from('leave_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Calculer total congés disponibles
    const totalLeaveAvailable = employees.reduce((sum, emp) => {
      return sum + (emp.total_leave_per_year - emp.used_leave)
    }, 0)

    return NextResponse.json({
      presentToday: presentCount || 0,
      absentToday: absentCount || 0,
      pendingRequests: pendingCount || 0,
      totalLeaveAvailable,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
