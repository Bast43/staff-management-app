import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: 'Mot de passe requis' },
        { status: 400 }
      )
    }

    // Récupérer l'admin
    const { data: admin, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin')
      .single()

    if (error || !admin) {
      return NextResponse.json(
        { error: 'Administrateur non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier le mot de passe
    const isValid = await bcrypt.compare(password, admin.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Créer le token
    const token = createToken({
      userId: admin.id,
      email: admin.email,
      role: admin.role,
    })

    // Définir le cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
