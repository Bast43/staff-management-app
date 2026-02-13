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
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const status = searchParams.get('status')
    const storeFilter = searchParams.get('store')

    let query = supabase
      .from('leave_requests')
      .select(`
        *,
        store:stores(name)
      `)
      .order('submitted_at', { ascending: false })

    if (user.role === 'employee') {
      query = query.eq('user_id', user.userId)
    } else if (storeFilter && storeFilter !== 'all') {
      query = query.eq('store_id', storeFilter)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error

    const formattedData = data?.map(item => ({
      ...item,
      store_name: item.store?.name || 'N/A',
    })) || []

    return NextResponse.json(formattedData)
  } catch (error) {
    console.error('Leaves error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user || user.role !== 'employee') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { start_date, end_date, type, reason, request_type, recovery_hours } = body

    // Récupérer l'employé
    const { data: employee } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.userId)
      .single()

    if (!employee) {
      return NextResponse.json({ error: 'Employé non trouvé' }, { status: 404 })
    }

    if (request_type === 'recovery_hours') {
      // Demande d'heures de récupération
      if (!recovery_hours || recovery_hours <= 0) {
        return NextResponse.json({ error: 'Nombre d\'heures invalide' }, { status: 400 })
      }

      // Créer la demande avec type spécial
      const { data, error } = await supabase
        .from('leave_requests')
        .insert({
          user_id: user.userId,
          user_name: employee.name,
          store_id: employee.store_id,
          start_date,
          end_date,
          type: 'recovery_hours',
          reason: `Demande ${recovery_hours}h récupération. ${reason || ''}`,
          status: 'pending',
          recovery_hours_requested: recovery_hours,
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data)
    } else {
      // Demande de congés normale
      if (!start_date || !end_date) {
        return NextResponse.json({ error: 'Dates requises' }, { status: 400 })
      }

      // Récupérer la grille horaire
      const { data: schedules } = await supabase
        .from('work_schedules')
        .select('*')
        .eq('user_id', user.userId)

      // Calculer les jours ouvrés selon la grille
      let workingDays = 0
      const current = new Date(start_date)
      const end = new Date(end_date)

      while (current <= end) {
        const dayOfWeek = current.getDay()

        if (schedules && schedules.length > 0) {
          const daySchedule = schedules.find(s => s.day_of_week === dayOfWeek)
          if (daySchedule?.is_working_day) {
            workingDays++
          }
        } else {
          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            workingDays++
          }
        }

        current.setDate(current.getDate() + 1)
      }

      // Vérifier le solde
      const remaining = employee.total_leave_per_year - employee.used_leave
      if (workingDays > remaining) {
        return NextResponse.json(
          { error: `Solde insuffisant. Vous avez ${remaining} jours disponibles, vous demandez ${workingDays} jours ouvrés.` },
          { status: 400 }
        )
      }

      // Créer la demande
      const { data, error } = await supabase
        .from('leave_requests')
        .insert({
          user_id: user.userId,
          user_name: employee.name,
          store_id: employee.store_id,
          start_date,
          end_date,
          type,
          reason,
          status: 'pending',
          calculated_days: workingDays,
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data)
    }
  } catch (error) {
    console.error('Create leave error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
