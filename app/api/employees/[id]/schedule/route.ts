import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id: userId } = params

    // Récupérer la grille horaire
    const { data: schedules } = await supabase
      .from('work_schedules')
      .select('*')
      .eq('user_id', userId)
      .order('day_of_week')

    // Si pas de grille, créer une grille par défaut (lundi-vendredi 9h-17h)
    if (!schedules || schedules.length === 0) {
      const defaultSchedule = []
      for (let day = 0; day <= 6; day++) {
        const isWorkingDay = day >= 1 && day <= 5
        defaultSchedule.push({
          day_of_week: day,
          is_working_day: isWorkingDay,
          start_time: isWorkingDay ? '09:00' : null,
          end_time: isWorkingDay ? '17:00' : null,
        })
      }
      return NextResponse.json(defaultSchedule)
    }

    // Retourner la grille existante
    return NextResponse.json(schedules.map(s => ({
      day_of_week: s.day_of_week,
      is_working_day: s.is_working_day,
      start_time: s.start_time,
      end_time: s.end_time,
    })))
  } catch (error) {
    console.error('Get schedule error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

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

    const { id: userId } = params
    const { schedule } = await request.json()

    if (!schedule || !Array.isArray(schedule)) {
      return NextResponse.json({ error: 'Grille invalide' }, { status: 400 })
    }

    // Supprimer l'ancienne grille
    await supabase
      .from('work_schedules')
      .delete()
      .eq('user_id', userId)

    // Insérer la nouvelle grille
    const scheduleToInsert = schedule.map(day => ({
      user_id: userId,
      day_of_week: day.day_of_week,
      is_working_day: day.is_working_day,
      start_time: day.start_time,
      end_time: day.end_time,
    }))

    const { error } = await supabase
      .from('work_schedules')
      .insert(scheduleToInsert)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save schedule error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
