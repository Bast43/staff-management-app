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

    console.log('📝 Marquage attendance:', { user_id, date, status }) // ← AJOUTÉ : Debug

    // Récupérer l'employé pour avoir son store_id
    const { data: employee } = await supabase
      .from('users')
      .select('store_id')
      .eq('id', user_id)
      .single()

    if (!employee) {
      return NextResponse.json({ error: 'Employé non trouvé' }, { status: 404 })
    }

    // ← CORRIGÉ : maybeSingle() au lieu de single() pour éviter les erreurs
    const { data: existing } = await supabase
      .from('attendance')
      .select('id')
      .eq('user_id', user_id)
      .eq('date', date)
      .maybeSingle() // ← IMPORTANT : maybeSingle() ne crashe pas si 0 résultat

    let result
    if (existing) {
      console.log('🔄 Mise à jour attendance existante:', existing.id) // ← AJOUTÉ : Debug
      
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

      if (error) {
        console.error('❌ Erreur update:', error) // ← AJOUTÉ : Debug
        throw error
      }
      result = data
    } else {
      console.log('➕ Création nouvelle attendance') // ← AJOUTÉ : Debug
      
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

      if (error) {
        console.error('❌ Erreur insert:', error) // ← AJOUTÉ : Debug
        throw error
      }
      result = data
    }

    console.log('✅ Attendance enregistrée:', result.id) // ← AJOUTÉ : Debug

    return NextResponse.json(result)
  } catch (error) {
    console.error('Attendance error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
