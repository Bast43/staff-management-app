import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    let query = supabase
      .from('users')
      .select(`
        *,
        store:stores(name)
      `)
      .eq('role', 'employee')
      .order('name')

    const { data, error } = await query

    if (error) throw error

    // Aplatir les résultats
    const formattedData = data?.map(item => ({
      ...item,
      store_name: item.store?.name || null,
    })) || []

    return NextResponse.json(formattedData)
  } catch (error) {
    console.error('Employees error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, personal_email, phone, password, position, store_id, total_leave_per_year, hire_date } = body

    if (!name || !email || !password || !position || !store_id) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    // Vérifier si l'email existe déjà
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 400 })
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Créer l'employé
    const { data, error } = await supabase
      .from('users')
      .insert({
        name,
        email,
        personal_email: personal_email || null,
        phone: phone || null,
        password: hashedPassword,
        role: 'employee',
        position,
        store_id,
        total_leave_per_year: total_leave_per_year || 25,
        used_leave: 0,
        recovery_hours: 0,
        hire_date: hire_date || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Create employee error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
