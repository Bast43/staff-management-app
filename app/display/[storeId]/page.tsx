'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

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

export default function StoreDisplay() {
  const params = useParams()
  const storeId = params.storeId as string

  const [storeName, setStoreName] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [monthSchedule, setMonthSchedule] = useState<DaySchedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [storeId, currentMonth])

  useEffect(() => {
    // Auto-refresh toutes les 5 minutes
    const interval = setInterval(() => {
      loadData()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [storeId, currentMonth])

  const loadData = async () => {
    try {
      // Charger nom du magasin
      const storeRes = await fetch(`/api/stores/${storeId}`)
      if (storeRes.ok) {
        const store = await storeRes.json()
        setStoreName(store.name)
      }

      // Charger planning
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth() + 1
      const scheduleRes = await fetch(`/api/schedule/month?store=${storeId}&year=${year}&month=${month}`)
      if (scheduleRes.ok) {
        setMonthSchedule(await scheduleRes.json())
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
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
    // Correction : lundi = 1, donc (startDayOfWeek + 6) % 7
    const emptyDays = (startDayOfWeek + 6) % 7
    for (let i = 0; i < emptyDays; i++) {
      days.push(null)
    }
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
  const now = new Date()
  const currentTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-bg-main flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-2xl text-text-light">Chargement du planning...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-bg-main p-4 md:p-8">
      {/* En-tête */}
      <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold text-primary mb-2">
              🏪 {storeName}
            </h1>
            <p className="text-xl md:text-2xl text-text-light capitalize font-semibold">
              Planning {monthName}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl md:text-6xl font-bold text-primary">
              {now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
            </div>
            <div className="text-2xl md:text-3xl text-text-light font-semibold">
              {currentTime}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={previousMonth}
            className="px-6 py-3 bg-primary text-white rounded-xl font-semibold text-lg hover:bg-primary/90 transition-all shadow-lg"
          >
            ← Mois précédent
          </button>
          <button
            onClick={thisMonth}
            className="px-6 py-3 bg-success text-white rounded-xl font-semibold text-lg hover:bg-success/90 transition-all shadow-lg"
          >
            Ce mois
          </button>
          <button
            onClick={nextMonth}
            className="px-6 py-3 bg-primary text-white rounded-xl font-semibold text-lg hover:bg-primary/90 transition-all shadow-lg"
          >
            Mois suivant →
          </button>
        </div>
      </div>

      {/* Calendrier */}
      <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 mb-6">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Jours de la semaine */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekDays.map((day, i) => (
                <div key={day} className="text-center font-bold text-xl md:text-2xl text-primary py-3 bg-primary/10 rounded-xl">
                  {weekDays[i]}
                </div>
              ))}
            </div>

            {/* Grille calendrier */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((date, index) => {
                const schedule = getScheduleForDate(date)
                const isWeekend = date && (date.getDay() === 0 || date.getDay() === 6)
                const isToday = date && date.toDateString() === new Date().toDateString()
                const workingEmployees = schedule?.employees.filter(e => e.isWorking) || []

                return (
                  <div
                    key={index}
                    className={`min-h-[140px] md:min-h-[180px] p-3 rounded-2xl transition-all ${
                      !date 
                        ? 'bg-transparent'
                        : isToday
                        ? 'bg-gradient-to-br from-primary to-primary/80 shadow-xl scale-105'
                        : isWeekend
                        ? 'bg-gradient-to-br from-gray-100 to-gray-50'
                        : 'bg-gradient-to-br from-white to-gray-50 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {date && (
                      <>
                        <div className={`text-2xl md:text-3xl font-bold mb-3 ${isToday ? 'text-white' : 'text-text-main'}`}>
                          {date.getDate()}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {workingEmployees.map((emp) => (
                            <div
                              key={emp.id}
                              className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white text-sm md:text-base font-bold shadow-lg hover:scale-110 transition-transform cursor-pointer"
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
      </div>

      {/* Légende */}
      <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8">
        <h3 className="text-2xl md:text-3xl font-bold text-primary mb-6">👥 Équipe</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {monthSchedule.length > 0 && monthSchedule[0]?.employees.map((emp) => (
            <div key={emp.id} className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl shadow-md hover:shadow-lg transition-all">
              <div
                className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg"
                style={{ backgroundColor: emp.color }}
              >
                {emp.initials}
              </div>
              <span className="text-lg md:text-xl font-semibold">{emp.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-6 text-text-light text-sm">
        <p>Mise à jour automatique toutes les 5 minutes • Dernière actualisation : {currentTime}</p>
      </div>
    </div>
  )
}
