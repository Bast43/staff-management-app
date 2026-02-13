'use client'

import { useEffect, useState } from 'react'

type Store = {
  id: string
  name: string
}

type Employee = {
  id: string
  name: string
  initials: string
  color: string
}

type DaySchedule = {
  date: string
  employees: {
    id: string
    name: string
    initials: string
    color: string
    isWorking: boolean
  }[]
}

type LeaveRequest = {
  id: string
  user_name: string
  store_name: string
  start_date: string
  end_date: string
  type: string
}

export default function AdminDashboard() {
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStore, setSelectedStore] = useState<string>('')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [monthSchedule, setMonthSchedule] = useState<DaySchedule[]>([])
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStores()
  }, [])

  useEffect(() => {
    if (selectedStore) {
      loadMonthSchedule()
      loadPendingRequests()
    }
  }, [selectedStore, currentMonth])

  const loadStores = async () => {
    try {
      const res = await fetch('/api/stores')
      if (res.ok) {
        const data = await res.json()
        setStores(data)
        if (data.length > 0) {
          setSelectedStore(data[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading stores:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMonthSchedule = async () => {
    try {
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth() + 1
      const res = await fetch(`/api/schedule/month?store=${selectedStore}&year=${year}&month=${month}`)
      if (res.ok) {
        setMonthSchedule(await res.json())
      }
    } catch (error) {
      console.error('Error loading schedule:', error)
    }
  }

  const loadPendingRequests = async () => {
    try {
      const res = await fetch(`/api/leaves?status=pending&store=${selectedStore}`)
      if (res.ok) {
        setPendingRequests(await res.json())
      }
    } catch (error) {
      console.error('Error loading requests:', error)
    }
  }

  const previousMonth = () => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(newDate.getMonth() - 1)
    setCurrentMonth(newDate)
  }

  const nextMonth = () => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(newDate.getMonth() + 1)
    setCurrentMonth(newDate)
  }

  const thisMonth = () => {
    setCurrentMonth(new Date())
  }

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()

    const days: (Date | null)[] = []
    
    // Ajouter jours vides au début
    for (let i = 0; i < (startDayOfWeek === 0 ? 6 : startDayOfWeek - 1); i++) {
      days.push(null)
    }
    
    // Ajouter tous les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getScheduleForDate = (date: Date | null) => {
    if (!date) return null
    const dateStr = date.toISOString().split('T')[0]
    return monthSchedule.find(d => d.date === dateStr)
  }

  const monthName = currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const days = getDaysInMonth()
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Tableau de bord</h1>
        <p className="text-text-light">Planning mensuel par magasin</p>
      </div>

      {/* Sélection magasin et navigation mois */}
      <div className="card mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <label className="font-semibold text-lg">Magasin :</label>
            <select
              className="input text-lg"
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
            >
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  🏪 {store.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={previousMonth} className="btn btn-secondary btn-small">
              ← Mois précédent
            </button>
            <button onClick={thisMonth} className="btn btn-primary btn-small">
              Ce mois
            </button>
            <button onClick={nextMonth} className="btn btn-secondary btn-small">
              Mois suivant →
            </button>
          </div>
        </div>

        <div className="mt-4 text-center">
          <h2 className="text-2xl font-bold capitalize">{monthName}</h2>
        </div>
      </div>

      {/* Calendrier mensuel avec pastilles */}
      <div className="card mb-8">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* En-têtes jours de la semaine */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div key={day} className="text-center font-semibold py-2 text-sm">
                  {day}
                </div>
              ))}
            </div>

            {/* Grille du calendrier */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((date, index) => {
                const schedule = getScheduleForDate(date)
                const isWeekend = date && (date.getDay() === 0 || date.getDay() === 6)
                const isToday = date && date.toDateString() === new Date().toDateString()
                const workingEmployees = schedule?.employees.filter(e => e.isWorking) || []

                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 rounded-lg border ${
                      !date 
                        ? 'bg-transparent border-transparent'
                        : isToday
                        ? 'border-2 border-primary bg-primary/5'
                        : isWeekend
                        ? 'bg-bg-main border-border'
                        : 'bg-card-bg border-border'
                    }`}
                  >
                    {date && (
                      <>
                        <div className={`text-sm font-semibold mb-2 ${isToday ? 'text-primary' : 'text-text-light'}`}>
                          {date.getDate()}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {workingEmployees.map((emp) => (
                            <div
                              key={emp.id}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                              style={{ backgroundColor: emp.color }}
                              title={emp.name}
                            >
                              {emp.initials}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Légende */}
        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="font-semibold mb-3">Légende des employés</h3>
          <div className="flex flex-wrap gap-3">
            {monthSchedule.length > 0 && monthSchedule[0]?.employees.map((emp) => (
              <div key={emp.id} className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: emp.color }}
                >
                  {emp.initials}
                </div>
                <span className="text-sm">{emp.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Demandes en attente */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Demandes de congé en attente</h2>
        
        {pendingRequests.length > 0 ? (
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div key={request.id} className="p-4 bg-bg-main rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-semibold">{request.user_name}</div>
                  <div className="text-sm text-text-light">
                    {new Date(request.start_date).toLocaleDateString('fr-FR')} 
                    {' → '}
                    {new Date(request.end_date).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <a href="/admin/leaves" className="btn btn-primary btn-small">
                  Examiner
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-text-light">
            Aucune demande en attente
          </div>
        )}
      </div>
    </div>
  )
}
