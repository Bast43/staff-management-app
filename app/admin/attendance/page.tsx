'use client'

import { useEffect, useState } from 'react'
import Modal from '@/components/Modal'

type Employee = {
  id: string
  name: string
  position: string
  store_id: string
  store_name: string
}

type DayAttendance = {
  date: string
  status: 'present' | 'absent' | 'leave' | null
  justification?: string
}

type WeekAttendance = {
  employee: Employee
  days: DayAttendance[]
  nextLeave?: {
    start_date: string
    end_date: string
    days: number
  }
}

export default function AdminAttendance() {
  const [stores, setStores] = useState<any[]>([])
  const [selectedStore, setSelectedStore] = useState<string>('all')
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [weekData, setWeekData] = useState<WeekAttendance[]>([])
  const [loading, setLoading] = useState(true)
  const [showJustifyModal, setShowJustifyModal] = useState(false)
  const [selectedCell, setSelectedCell] = useState<any>(null)
  const [justification, setJustification] = useState('')

  useEffect(() => {
    loadStores()
  }, [])

  useEffect(() => {
    loadWeekData()
  }, [currentWeek, selectedStore])

  const loadStores = async () => {
    try {
      const res = await fetch('/api/stores')
      if (res.ok) setStores(await res.json())
    } catch (error) {
      console.error('Error loading stores:', error)
    }
  }

  const loadWeekData = async () => {
    setLoading(true)
    try {
      const monday = getMonday(currentWeek)
      const url = `/api/attendance/week?date=${monday.toISOString().split('T')[0]}${selectedStore !== 'all' ? `&store=${selectedStore}` : ''}`
      const res = await fetch(url)
      if (res.ok) {
        setWeekData(await res.json())
      }
    } catch (error) {
      console.error('Error loading week data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMonday = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  const getWeekDates = () => {
    const monday = getMonday(currentWeek)
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const weekDates = getWeekDates()
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  const handleStatusChange = async (employeeId: string, date: string, newStatus: 'present' | 'absent') => {
    if (newStatus === 'absent') {
      setSelectedCell({ employeeId, date, status: newStatus })
      setShowJustifyModal(true)
    } else {
      await updateAttendance(employeeId, date, newStatus, null)
    }
  }

  const updateAttendance = async (employeeId: string, date: string, status: 'present' | 'absent', justif: string | null) => {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: employeeId,
          date,
          status,
          justification: justif,
        }),
      })

      if (res.ok) {
        loadWeekData()
        setShowJustifyModal(false)
        setJustification('')
      } else {
        alert('Erreur lors de la mise à jour')
      }
    } catch (error) {
      alert('Erreur de connexion')
    }
  }

  const handleJustifySubmit = () => {
    if (selectedCell) {
      updateAttendance(selectedCell.employeeId, selectedCell.date, selectedCell.status, justification)
    }
  }

  const previousWeek = () => {
    const newDate = new Date(currentWeek)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentWeek(newDate)
  }

  const nextWeek = () => {
    const newDate = new Date(currentWeek)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentWeek(newDate)
  }

  const thisWeek = () => {
    setCurrentWeek(new Date())
  }

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Gestion des présences</h1>
        <p className="text-text-light">Suivi hebdomadaire par employé</p>
      </div>

      {/* Filtres et navigation */}
      <div className="card mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="font-semibold">Magasin :</label>
            <select
              className="input w-64"
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
            >
              <option value="all">Tous les magasins</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={previousWeek} className="btn btn-secondary btn-small">
              ← Précédente
            </button>
            <button onClick={thisWeek} className="btn btn-primary btn-small">
              Cette semaine
            </button>
            <button onClick={nextWeek} className="btn btn-secondary btn-small">
              Suivante →
            </button>
          </div>
        </div>

        <div className="mt-4 text-center font-semibold text-lg">
          Semaine du {weekDates[0].toLocaleDateString('fr-FR')} au {weekDates[6].toLocaleDateString('fr-FR')}
        </div>
      </div>

      {/* Tableau hebdomadaire */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="text-left py-3 px-2 font-semibold sticky left-0 bg-card-bg z-10">
                Employé
              </th>
              <th className="text-left py-3 px-2 font-semibold">Prochain congé</th>
              {weekDates.map((date, i) => (
                <th key={i} className="text-center py-3 px-2 font-semibold">
                  <div>{weekDays[i]}</div>
                  <div className="text-xs font-normal">{date.getDate()}/{date.getMonth() + 1}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weekData.map((row) => (
              <tr key={row.employee.id} className="border-b border-border hover:bg-bg-main">
                <td className="py-3 px-2 sticky left-0 bg-card-bg z-10">
                  <div className="font-semibold">{row.employee.name}</div>
                  <div className="text-xs text-text-light">{row.employee.position}</div>
                  {selectedStore === 'all' && (
                    <div className="text-xs text-text-light mt-0.5">{row.employee.store_name}</div>
                  )}
                </td>
                <td className="py-3 px-2">
                  {row.nextLeave ? (
                    <div className="text-xs">
                      <div className="font-semibold text-primary">
                        {new Date(row.nextLeave.start_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                      </div>
                      <div className="text-text-light">
                        {row.nextLeave.days}j
                      </div>
                    </div>
                  ) : (
                    <span className="text-text-light text-xs">-</span>
                  )}
                </td>
                {row.days.map((day, i) => {
                  const isWeekend = i >= 5
                  return (
                    <td
                      key={i}
                      className={`py-3 px-2 text-center ${isWeekend ? 'bg-bg-main' : ''}`}
                    >
                      {day.status === 'leave' ? (
                        <div className="text-primary text-xl" title="En congé">🏖️</div>
                      ) : (
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => handleStatusChange(row.employee.id, day.date, 'present')}
                            className={`w-7 h-7 rounded-lg transition-colors text-sm font-bold ${
                              day.status === 'present'
                                ? 'bg-success text-white'
                                : 'bg-bg-main hover:bg-success/20 text-text-light'
                            }`}
                            title="Marquer présent"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => handleStatusChange(row.employee.id, day.date, 'absent')}
                            className={`w-7 h-7 rounded-lg transition-colors text-sm font-bold ${
                              day.status === 'absent'
                                ? 'bg-danger text-white'
                                : 'bg-bg-main hover:bg-danger/20 text-text-light'
                            }`}
                            title="Marquer absent"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                      {day.justification && (
                        <div className="text-xs mt-1" title={day.justification}>
                          <span className="cursor-help">📝</span>
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {weekData.length === 0 && (
          <div className="text-center py-12 text-text-light">
            Aucun employé trouvé
          </div>
        )}
      </div>

      {/* Légende */}
      <div className="card mt-6">
        <h3 className="font-semibold mb-3">Légende</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-success text-white flex items-center justify-center font-bold text-sm">✓</div>
            <span>Présent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-danger text-white flex items-center justify-center font-bold text-sm">✕</div>
            <span>Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary text-xl">🏖️</span>
            <span>En congé approuvé</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">📝</span>
            <span>Justification disponible (survoler)</span>
          </div>
        </div>
      </div>

      {/* Modal Justification */}
      <Modal
        isOpen={showJustifyModal}
        onClose={() => {
          setShowJustifyModal(false)
          setJustification('')
        }}
        title="Justifier l'absence"
      >
        <div className="space-y-4">
          <p className="text-text-light">
            Veuillez indiquer la raison de l'absence pour cet employé
          </p>
          
          <div>
            <label className="block font-semibold mb-2">Justification *</label>
            <textarea
              className="input"
              rows={3}
              required
              placeholder="Ex: Maladie, Rendez-vous médical, Absence non justifiée, Accident..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />
          </div>

          <button
            onClick={handleJustifySubmit}
            disabled={!justification.trim()}
            className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmer l'absence
          </button>
        </div>
      </Modal>
    </div>
  )
}
