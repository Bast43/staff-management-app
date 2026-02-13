import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
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
    const { user_id, date, status, justification } = body

    if (!user_id || !date || !status) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Récupérer l'employé pour avoir son store_id
    const { data: employee } = await supabase
      .from('users')
      .select('store_id')
      .eq('id', user_id)
      .single()

    if (!employee) {
      return NextResponse.json({ error: 'Employé non trouvé' }, { status: 404 })
    }

    // Vérifier si une présence existe déjà pour ce jour
    const { data: existing } = await supabase
      .from('attendance')
      .select('id')
      .eq('user_id', user_id)
      .eq('date', date)
      .single()

    let result
    if (existing) {
      // Mettre à jour
      const { data, error } = await supabase
        .from('attendance')
        .update({
          status,
          justification: justification || null,
          justified_by: user.userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Créer
      const { data, error } = await supabase
        .from('attendance')
        .insert({
          user_id,
          store_id: employee.store_id,
          date,
          status,
          justification: justification || null,
          justified_by: status === 'absent' ? user.userId : null,
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Attendance error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
