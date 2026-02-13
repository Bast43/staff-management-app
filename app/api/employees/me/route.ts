import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: employee, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.userId)
      .single()

    if (error || !employee) {
      return NextResponse.json({ error: 'Employé non trouvé' }, { status: 404 })
    }

    // Compter les demandes
    const { data: leaves } = await supabase
      .from('leave_requests')
      .select('status')
      .eq('user_id', user.userId)

    const pending_count = leaves?.filter(l => l.status === 'pending').length || 0
    const approved_count = leaves?.filter(l => l.status === 'approved').length || 0

    return NextResponse.json({
      ...employee,
      pending_count,
      approved_count,
    })
  } catch (error) {
    console.error('Employee me error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
