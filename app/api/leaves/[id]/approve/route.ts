import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { comment } = await request.json()
    const { id } = params

    // Récupérer la demande
    const { data: leaveRequest, error: fetchError } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !leaveRequest) {
      return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 })
    }

    // Récupérer l'employé
    const { data: employee, error: empError } = await supabase
      .from('users')
      .select('*')
      .eq('id', leaveRequest.user_id)
      .single()

    if (empError || !employee) {
      return NextResponse.json({ error: 'Employé non trouvé' }, { status: 404 })
    }

    // Calculer les jours
    const start = new Date(leaveRequest.start_date)
    const end = new Date(leaveRequest.end_date)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    // Vérifier le solde
    const remaining = employee.total_leave_per_year - employee.used_leave
    if (days > remaining) {
      return NextResponse.json(
        { error: `Congés insuffisants. L'employé a ${remaining} jours disponibles.` },
        { status: 400 }
      )
    }

    // Approuver la demande
    const { error: updateError } = await supabase
      .from('leave_requests')
      .update({
        status: 'approved',
        admin_comment: comment || null,
        reviewed_by: user.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) throw updateError

    // Mettre à jour le solde de l'employé
    const { error: leaveError } = await supabase
      .from('users')
      .update({
        used_leave: employee.used_leave + days,
      })
      .eq('id', leaveRequest.user_id)

    if (leaveError) throw leaveError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Approve leave error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
