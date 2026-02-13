import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('name')

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Stores error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { name, address } = await request.json()

    if (!name || !address) {
      return NextResponse.json({ error: 'Nom et adresse requis' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('stores')
      .insert({ name, address })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Create store error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
