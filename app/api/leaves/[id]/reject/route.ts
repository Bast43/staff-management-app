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

    if (!comment || !comment.trim()) {
      return NextResponse.json(
        { error: 'Un commentaire est requis pour refuser une demande' },
        { status: 400 }
      )
    }

    // Refuser la demande
    const { error } = await supabase
      .from('leave_requests')
      .update({
        status: 'rejected',
        admin_comment: comment,
        reviewed_by: user.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reject leave error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
