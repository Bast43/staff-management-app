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
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Dates requises' }, { status: 400 })
    }

    // Récupérer la grille horaire de l'utilisateur
    const { data: schedules } = await supabase
      .from('work_schedules')
      .select('*')
      .eq('user_id', user.userId)

    // Calculer les jours ouvrés
    let workingDays = 0
    const current = new Date(startDate)
    const end = new Date(endDate)

    while (current <= end) {
      const dayOfWeek = current.getDay() // 0 = dimanche, 6 = samedi

      if (schedules && schedules.length > 0) {
        // Si grille horaire définie, suivre la grille
        const daySchedule = schedules.find(s => s.day_of_week === dayOfWeek)
        if (daySchedule?.is_working_day) {
          workingDays++
        }
      } else {
        // Pas de grille : par défaut lundi-vendredi
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          workingDays++
        }
      }

      current.setDate(current.getDate() + 1)
    }

    return NextResponse.json({
      working_days: workingDays,
      total_days: Math.ceil((end.getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1,
    })
  } catch (error) {
    console.error('Calculate days error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
