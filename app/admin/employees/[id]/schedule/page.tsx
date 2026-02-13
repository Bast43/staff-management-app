'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type DaySchedule = {
  day_of_week: number
  is_working_day: boolean
  start_time: string | null
  end_time: string | null
}

export default function EmployeeSchedule() {
  const params = useParams()
  const router = useRouter()
  const employeeId = params.id as string

  const [employeeName, setEmployeeName] = useState('')
  const [schedule, setSchedule] = useState<DaySchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

  useEffect(() => {
    loadData()
  }, [employeeId])

  const loadData = async () => {
    try {
      // Récupérer info employé
      const empRes = await fetch(`/api/employees/${employeeId}`)
      if (empRes.ok) {
        const emp = await empRes.json()
        setEmployeeName(emp.name)
      }

      // Récupérer grille horaire
      const schedRes = await fetch(`/api/employees/${employeeId}/schedule`)
      if (schedRes.ok) {
        setSchedule(await schedRes.json())
      }
    } catch (error) {
      console.error('Error loading:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDay = (dayOfWeek: number) => {
    setSchedule(prev => prev.map(day => 
      day.day_of_week === dayOfWeek 
        ? { ...day, is_working_day: !day.is_working_day }
        : day
    ))
  }

  const handleTimeChange = (dayOfWeek: number, field: 'start_time' | 'end_time', value: string) => {
    setSchedule(prev => prev.map(day =>
      day.day_of_week === dayOfWeek
        ? { ...day, [field]: value || null }
        : day
    ))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/employees/${employeeId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule }),
      })

      if (res.ok) {
        alert('Grille horaire enregistrée !')
        router.push('/admin/employees')
      } else {
        alert('Erreur lors de l\'enregistrement')
      }
    } catch (error) {
      alert('Erreur de connexion')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>
  }

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => router.push('/admin/employees')}
          className="btn btn-secondary btn-small mb-4"
        >
          ← Retour
        </button>
        <h1 className="text-4xl font-bold mb-2">Grille horaire</h1>
        <p className="text-text-light text-lg">{employeeName}</p>
      </div>

      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Configuration hebdomadaire</h2>
        
        <div className="space-y-4">
          {schedule
            .slice()
            .sort((a, b) => {
              // Place lundi (1) en premier, dimanche (0) en dernier
              const orderA = a.day_of_week === 0 ? 7 : a.day_of_week;
              const orderB = b.day_of_week === 0 ? 7 : b.day_of_week;
              return orderA - orderB;
            })
            .map((day) => {
              // Pour l'affichage, lundi=1, dimanche=0
              const displayIndex = day.day_of_week === 0 ? 6 : day.day_of_week - 1;
              return (
                <div key={day.day_of_week} className="p-4 bg-bg-main rounded-xl">
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Jour */}
                    <div className="w-32">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={day.is_working_day}
                          onChange={() => handleToggleDay(day.day_of_week)}
                          className="w-5 h-5 rounded border-2 border-border checked:bg-primary checked:border-primary"
                        />
                        <span className="font-semibold">{dayNames[displayIndex]}</span>
                      </label>
                    </div>
                    {/* Horaires */}
                    {day.is_working_day ? (
                      <div className="flex items-center gap-4 flex-1">
                        <div>
                          <label className="block text-sm text-text-light mb-1">Début</label>
                          <input
                            type="time"
                            className="input"
                            value={day.start_time || '09:00'}
                            onChange={(e) => handleTimeChange(day.day_of_week, 'start_time', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-text-light mb-1">Fin</label>
                          <input
                            type="time"
                            className="input"
                            value={day.end_time || '17:00'}
                            onChange={(e) => handleTimeChange(day.day_of_week, 'end_time', e.target.value)}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 text-text-light italic">Jour de repos</div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        <div className="mt-8 p-4 bg-primary/10 rounded-xl">
          <h3 className="font-semibold mb-2">ℹ️ Informations</h3>
          <ul className="text-sm text-text-light space-y-1">
            <li>• Cochez les jours où l'employé travaille normalement</li>
            <li>• Définissez les horaires pour calculer automatiquement les jours de congés</li>
            <li>• Un congé pris un jour non travaillé ne sera pas décompté</li>
          </ul>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary flex-1"
          >
            {saving ? 'Enregistrement...' : '💾 Enregistrer la grille horaire'}
          </button>
          <button
            onClick={() => router.push('/admin/employees')}
            className="btn btn-secondary"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}
