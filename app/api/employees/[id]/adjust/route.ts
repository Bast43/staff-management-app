import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { type, amount, reason } = body
    const { id: userId } = params

    if (!type || amount === undefined || !reason) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    if (type !== 'leave_days' && type !== 'recovery_hours') {
      return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
    }

    // Récupérer l'employé
    const { data: employee, error: empError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (empError || !employee) {
      return NextResponse.json({ error: 'Employé non trouvé' }, { status: 404 })
    }

    // Calculer la nouvelle valeur
    let updateData: any = {}
    
    if (type === 'leave_days') {
      // Ajuster used_leave (montant négatif = ajouter des jours disponibles)
      const newUsedLeave = Math.max(0, employee.used_leave - amount)
      updateData.used_leave = newUsedLeave
    } else {
      // Ajuster recovery_hours
      const newRecoveryHours = Math.max(0, (employee.recovery_hours || 0) + amount)
      updateData.recovery_hours = newRecoveryHours
    }

    // Mettre à jour l'employé
    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)

    if (updateError) throw updateError

    // Enregistrer l'ajustement dans l'historique
    const { error: adjustError } = await supabase
      .from('leave_adjustments')
      .insert({
        user_id: userId,
        adjustment_type: type,
        amount: amount,
        reason: reason,
        adjusted_by: user.userId,
      })

    if (adjustError) {
      console.error('Adjustment history error:', adjustError)
      // On continue même si l'historique échoue
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Adjustment error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
