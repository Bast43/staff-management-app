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
  const [error, setError] = useState<string | null>(null) // ← AJOUTÉ : Gestion erreur

  useEffect(() => {
    // ← AJOUTÉ : Debug au chargement
    console.log('🏪 Store Display - Store ID:', storeId)
    console.log('📍 URL complète:', window.location.href)
    
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
      setError(null) // ← AJOUTÉ : Reset erreur
      
      // ← AJOUTÉ : Debug URL API
      const storeUrl = `/api/stores/${storeId}`
      console.log('🔍 Fetching store:', storeUrl)
      
      // Charger nom du magasin
      const storeRes = await fetch(storeUrl)
      console.log('📡 Store API status:', storeRes.status) // ← AJOUTÉ : Debug
      
      if (!storeRes.ok) {
        throw new Error(`Magasin non trouvé (${storeRes.status})`)
      }
      
      const store = await storeRes.json()
      console.log('✅ Store loaded:', store.name) // ← AJOUTÉ : Debug
      setStoreName(store.name)

      // Charger planning
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth() + 1
      const scheduleUrl = `/api/schedule/month?store=${storeId}&year=${year}&month=${month}`
      console.log('🔍 Fetching schedule:', scheduleUrl) // ← AJOUTÉ : Debug
      
      const scheduleRes = await fetch(scheduleUrl)
      console.log('📡 Schedule API status:', scheduleRes.status) // ← AJOUTÉ : Debug
      
      if (scheduleRes.ok) {
        const data = await scheduleRes.json()
        console.log('✅ Schedule loaded:', data.length, 'days') // ← AJOUTÉ : Debug
        setMonthSchedule(data)
      }
    } catch (err: any) {
      console.error('❌ Error loading data:', err) // ← AJOUTÉ : Debug
      setError(err.message)
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
  const now = new Date()
  const currentTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  // ← AJOUTÉ : Écran d'erreur détaillé
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-3xl font-bold text-red-600 mb-4">Erreur de chargement</h1>
            <p className="text-xl text-gray-700 mb-6">{error}</p>
            
            <div className="bg-gray-50 rounded-xl p-6 text-left mb-6">
              <h2 className="font-bold mb-3 text-lg">Informations de debug :</h2>
              <div className="space-y-2 text-sm font-mono">
                <div><strong>Store ID :</strong> {storeId}</div>
                <div><strong>URL :</strong> {window.location.href}</div>
                <div><strong>API URL :</strong> /api/stores/{storeId}</div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 text-left mb-6">
              <h2 className="font-bold mb-3">Comment obtenir l'ID du magasin ?</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Connectez-vous en tant qu'admin</li>
                <li>Allez dans "Magasins"</li>
                <li>L'ID est dans l'URL ou visible dans Supabase</li>
                <li>Format : abc12345-def6-7890-ghij-klmnopqrstuv</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => window.location.reload()} 
                className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all"
              >
                🔄 Réessayer
              </button>
              <button 
                onClick={() => window.history.back()} 
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
              >
                ← Retour
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-bg-main flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-2xl text-text-light mb-2">Chargement du planning...</p>
          <p className="text-sm text-gray-500">Store ID: {storeId}</p>
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
        <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
          <button
            onClick={previousMonth}
            className="px-4 md:px-6 py-2 md:py-3 bg-primary text-white rounded-xl font-semibold text-base md:text-lg hover:bg-primary/90 transition-all shadow-lg"
          >
            ← Mois précédent
          </button>
          <button
            onClick={thisMonth}
            className="px-4 md:px-6 py-2 md:py-3 bg-success text-white rounded-xl font-semibold text-base md:text-lg hover:bg-success/90 transition-all shadow-lg"
          >
            Ce mois
          </button>
          <button
            onClick={nextMonth}
            className="px-4 md:px-6 py-2 md:py-3 bg-primary text-white rounded-xl font-semibold text-base md:text-lg hover:bg-primary/90 transition-all shadow-lg"
          >
            Mois suivant →
          </button>
        </div>
      </div>

      {/* Calendrier */}
      <div className="bg-white rounded-3xl shadow-2xl p-4 md:p-8 mb-6">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Jours de la semaine */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekDays.map((day) => (
                <div key={day} className="text-center font-bold text-lg md:text-2xl text-primary py-2 md:py-3 bg-primary/10 rounded-xl">
                  {day}
                </div>
              ))}
            </div>

            {/* Grille calendrier */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((date, index) => {
                const schedule = getScheduleForDate(date)
                const isWeekend = date && (date.getUTCDay() === 0 || date.getUTCDay() === 6)
                const isToday = date && date.toDateString() === new Date().toDateString()
                const workingEmployees = schedule?.employees.filter(e => e.isWorking) || []

                return (
                  <div
                    key={index}
                    className={`min-h-[100px] md:min-h-[140px] lg:min-h-[180px] p-2 md:p-3 rounded-2xl transition-all ${
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
                        <div className={`text-xl md:text-2xl lg:text-3xl font-bold mb-2 md:mb-3 ${isToday ? 'text-white' : 'text-text-main'}`}>
                          {date.getDate()}
                        </div>
                        <div className="flex flex-wrap gap-1 md:gap-2">
                          {workingEmployees.map((emp) => (
                            <div
                              key={emp.id}
                              className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-white text-xs md:text-sm lg:text-base font-bold shadow-lg hover:scale-110 transition-transform cursor-pointer"
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
      <div className="bg-white rounded-3xl shadow-2xl p-4 md:p-8">
        <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-primary mb-4 md:mb-6">👥 Équipe</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {monthSchedule.length > 0 && monthSchedule[0]?.employees.map((emp) => (
            <div key={emp.id} className="flex items-center gap-3 p-3 md:p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl shadow-md hover:shadow-lg transition-all">
              <div
                className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center text-white text-base md:text-lg font-bold shadow-lg flex-shrink-0"
                style={{ backgroundColor: emp.color }}
              >
                {emp.initials}
              </div>
              <span className="text-base md:text-lg lg:text-xl font-semibold truncate">{emp.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-6 text-text-light text-xs md:text-sm">
        <p>Mise à jour automatique toutes les 5 minutes • Dernière actualisation : {currentTime}</p>
      </div>
    </div>
  )
}
