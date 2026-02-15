'use client'

import { useEffect, useState } from 'react'

type Store = {
  id: string
  name: string
}

type DaySchedule = {
  date: string
  employees: {
    id: string
    name: string
    initials: string
    color: string
    isWorking: boolean
    work_hours: string | null  // ✅ AJOUTÉ
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
    const firstDay = new Date(Date.UTC(year, month, 1))
    const lastDay = new Date(Date.UTC(year, month + 1, 0))
    const daysInMonth = lastDay.getUTCDate()
    const startDayOfWeek = firstDay.getUTCDay()

    const days: (Date | null)[] = []
    const emptyDays = (startDayOfWeek + 6) % 7
    for (let i = 0; i < emptyDays; i++) {
      days.push(null)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(Date.UTC(year, month, day)))
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
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Tableau de bord</h1>
        <p className="text-text-light text-sm sm:text-base">Planning mensuel par magasin</p>
      </div>

      {/* Sélection magasin et navigation mois - ✅ RESPONSIVE */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <label className="font-semibold text-base sm:text-lg">Magasin :</label>
            <select
              className="input text-base sm:text-lg w-full sm:w-auto"
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

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <button onClick={previousMonth} className="btn btn-secondary btn-small whitespace-nowrap">
              ← Précédent
            </button>
            <button onClick={thisMonth} className="btn btn-primary btn-small whitespace-nowrap">
              Ce mois
            </button>
            <button onClick={nextMonth} className="btn btn-secondary btn-small whitespace-nowrap">
              Suivant →
            </button>
          </div>
        </div>

        <div className="mt-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold capitalize">{monthName}</h2>
        </div>
      </div>

      {/* ✅ CALENDRIER RESPONSIVE COMPLET */}
      <div className="card mb-8">
        {/* Container scrollable horizontal */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          {/* Largeur minimum pour forcer le scroll sur mobile */}
          <div className="min-w-[640px] px-4 sm:px-0">
            
            {/* En-têtes jours de la semaine */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
              {weekDays.map((day) => (
                <div key={day} className="text-center font-semibold py-2 text-xs sm:text-sm">
                  {day}
                </div>
              ))}
            </div>

            {/* Grille calendrier */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {days.map((date, index) => {
                const schedule = getScheduleForDate(date)
                const isWeekend = date && (date.getUTCDay() === 0 || date.getUTCDay() === 6)
                const isToday = date && date.toDateString() === new Date().toDateString()
                const workingEmployees = schedule?.employees.filter(e => e.isWorking) || []

                return (
                  <div
                    key={index}
                    className={`
                      min-h-[80px] sm:min-h-[100px] lg:min-h-[120px]
                      p-1.5 sm:p-2 lg:p-3
                      rounded-lg border text-xs sm:text-sm
                      ${
                        !date 
                          ? 'bg-transparent border-transparent'
                          : isToday
                          ? 'border-2 border-primary bg-primary/5'
                          : isWeekend
                          ? 'bg-bg-main border-border'
                          : 'bg-card-bg border-border'
                      }
                    `}
                  >
                    {date && (
                      <>
                        {/* Numéro du jour */}
                        <div className={`text-xs sm:text-sm font-semibold mb-1 sm:mb-2 ${isToday ? 'text-primary' : 'text-text-light'}`}>
                          {date.getDate()}
                        </div>
                        
                        {/* ✅ PASTILLES AVEC HORAIRES */}
                        <div className="flex flex-col gap-0.5 sm:gap-1 items-start">
                          {workingEmployees.map((emp) => (
                            <div key={emp.id} className="flex items-center gap-1 sm:gap-2 group w-full">
                              {/* Pastille */}
                              <div
                                className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-bold shadow-sm flex-shrink-0"
                                style={{ backgroundColor: emp.color }}
                                title={emp.name}
                              >
                                {emp.initials}
                              </div>
                              
                              {/* ✅ HORAIRES (apparaît au survol sur desktop) */}
                              {emp.work_hours && (
                                <span className="hidden sm:group-hover:inline-block lg:inline-block px-1.5 sm:px-2 py-0.5 bg-gray-800 text-white rounded text-[10px] sm:text-xs font-mono whitespace-nowrap">
                                  {emp.work_hours}
                                </span>
                              )}
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

        {/* Indication scroll sur mobile */}
        <div className="sm:hidden text-center text-xs text-gray-500 mt-3 py-2 bg-gray-50 rounded-lg">
          👈 Glissez pour voir plus 👉
        </div>

        {/* Légende */}
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
          <h3 className="font-semibold mb-3 text-sm sm:text-base">Légende des employés</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {monthSchedule.length > 0 && monthSchedule[0]?.employees.map((emp) => (
              <div key={emp.id} className="flex items-center gap-2">
                <div
                  className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: emp.color }}
                >
                  {emp.initials}
                </div>
                <span className="text-xs sm:text-sm truncate">{emp.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Demandes en attente - ✅ RESPONSIVE */}
      <div className="card">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Demandes de congé en attente</h2>
        
        {pendingRequests.length > 0 ? (
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div key={request.id} className="p-4 bg-bg-main rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="font-semibold text-sm sm:text-base">{request.user_name}</div>
                  <div className="text-xs sm:text-sm text-text-light mt-1">
                    {new Date(request.start_date).toLocaleDateString('fr-FR')} 
                    {' → '}
                    {new Date(request.end_date).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <a href="/admin/leaves" className="btn btn-primary btn-small w-full sm:w-auto text-center">
                  Examiner
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-text-light text-sm sm:text-base">
            Aucune demande en attente
          </div>
        )}
      </div>
    </div>
  )
}
