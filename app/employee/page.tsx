'use client'

import { useEffect, useState } from 'react'
import StatCard from '@/components/StatCard'
import Modal from '@/components/Modal'

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

export default function EmployeeDashboard() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    available: 0,
    used: 0,
    pending: 0,
    approved: 0,
    recovery_hours: 0,
  })
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [monthSchedule, setMonthSchedule] = useState<DaySchedule[]>([])
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [leaveForm, setLeaveForm] = useState({
    request_type: 'leave_days',
    period_type: 'period',
    start_date: '',
    end_date: '',
    single_date: '',
    type: 'vacation',
    reason: '',
    recovery_hours_requested: 0,
  })
  const [calculatedDays, setCalculatedDays] = useState(0)
  const [calculating, setCalculating] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (user?.store_id) {
      loadMonthSchedule()
    }
  }, [user, currentMonth])

  useEffect(() => {
    if (leaveForm.request_type === 'leave_days' && 
        ((leaveForm.period_type === 'period' && leaveForm.start_date && leaveForm.end_date) ||
         (leaveForm.period_type === 'single_day' && leaveForm.single_date))) {
      calculateWorkingDays()
    }
  }, [leaveForm.start_date, leaveForm.end_date, leaveForm.single_date, leaveForm.period_type])

  const loadData = async () => {
    try {
      const res = await fetch('/api/employees/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data)
        setStats({
          available: data.total_leave_per_year - data.used_leave,
          used: data.used_leave,
          pending: data.pending_count || 0,
          approved: data.approved_count || 0,
          recovery_hours: data.recovery_hours || 0,
        })
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMonthSchedule = async () => {
    try {
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth() + 1
      const res = await fetch(`/api/schedule/month?store=${user.store_id}&year=${year}&month=${month}`)
      if (res.ok) {
        setMonthSchedule(await res.json())
      }
    } catch (error) {
      console.error('Error loading schedule:', error)
    }
  }

  const calculateWorkingDays = async () => {
    if (leaveForm.request_type !== 'leave_days') return

    setCalculating(true)
    try {
      let start, end
      if (leaveForm.period_type === 'single_day') {
        start = end = leaveForm.single_date
      } else {
        start = leaveForm.start_date
        end = leaveForm.end_date
      }

      const res = await fetch(`/api/leaves/calculate-days?start=${start}&end=${end}`)
      if (res.ok) {
        const data = await res.json()
        setCalculatedDays(data.working_days)
      }
    } catch (error) {
      console.error('Error calculating days:', error)
    } finally {
      setCalculating(false)
    }
  }

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (leaveForm.request_type === 'recovery_hours' && leaveForm.recovery_hours_requested <= 0) {
      alert('Veuillez indiquer le nombre d\'heures')
      return
    }

    try {
      let payload: any = {
        type: leaveForm.type,
        reason: leaveForm.reason,
      }

      if (leaveForm.request_type === 'leave_days') {
        if (leaveForm.period_type === 'single_day') {
          payload.start_date = leaveForm.single_date
          payload.end_date = leaveForm.single_date
        } else {
          payload.start_date = leaveForm.start_date
          payload.end_date = leaveForm.end_date
        }
        payload.request_type = 'leave_days'
      } else {
        payload.request_type = 'recovery_hours'
        payload.recovery_hours = leaveForm.recovery_hours_requested
        payload.start_date = new Date().toISOString().split('T')[0]
        payload.end_date = new Date().toISOString().split('T')[0]
      }

      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setShowLeaveModal(false)
        setLeaveForm({
          request_type: 'leave_days',
          period_type: 'period',
          start_date: '',
          end_date: '',
          single_date: '',
          type: 'vacation',
          reason: '',
          recovery_hours_requested: 0,
        })
        setCalculatedDays(0)
        loadData()
        loadMonthSchedule()
        alert('Demande envoyée !')
      } else {
        const error = await res.json()
        alert(error.error || 'Erreur')
      }
    } catch (error) {
      alert('Erreur de connexion')
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
  const usagePercent = user ? (stats.used / user.total_leave_per_year) * 100 : 0

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>
  }

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Bonjour {user?.name || ''} !</h1>
        <p className="text-text-light text-sm sm:text-base">{user?.position || ''} • {user?.store_name || ''}</p>
      </div>

      {/* Stats personnelles - ✅ RESPONSIVE */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <StatCard icon="🏖️" iconColor="green" value={stats.available} label="Jours disponibles" />
        <StatCard icon="📅" iconColor="blue" value={stats.used} label="Jours utilisés" />
        <StatCard icon="⏳" iconColor="yellow" value={stats.pending} label="En attente" />
        <StatCard icon="✓" iconColor="green" value={stats.approved} label="Approuvés" />
        <StatCard icon="⏰" iconColor="purple" value={`${stats.recovery_hours}h`} label="Heures récup" />
      </div>

      {/* Barre de progression - ✅ RESPONSIVE */}
      {user && (
        <div className="card mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <h3 className="text-base sm:text-lg font-semibold">Utilisation des congés</h3>
            <button onClick={() => setShowLeaveModal(true)} className="btn btn-primary w-full sm:w-auto">
              ➕ Nouvelle demande
            </button>
          </div>
          <div className="mb-2 flex justify-between text-xs sm:text-sm">
            <span className="text-text-light">
              {stats.used} / {user.total_leave_per_year} jours utilisés
            </span>
            <span className="text-text-light">{usagePercent.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-bg-main rounded-full h-3 sm:h-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                usagePercent >= 90 ? 'bg-danger' : usagePercent >= 70 ? 'bg-warning' : 'bg-success'
              }`}
              style={{ width: `${Math.min(100, usagePercent)}%` }}
            />
          </div>
        </div>
      )}

      {/* ✅ PLANNING RESPONSIVE COMPLET */}
      <div className="card mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold">Planning de l'équipe</h2>
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

        <div className="mb-4 text-center">
          <h3 className="text-lg sm:text-xl font-semibold capitalize">{monthName}</h3>
        </div>

        {/* Container scrollable horizontal */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[640px] px-4 sm:px-0">
            {/* En-têtes jours */}
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
                      rounded-lg border
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
                        <div className={`text-xs sm:text-sm font-semibold mb-1 sm:mb-2 ${isToday ? 'text-primary' : 'text-text-light'}`}>
                          {date.getDate()}
                        </div>
                        {/* ✅ PASTILLES AVEC TOOLTIP HORAIRES */}
                        <div className="flex flex-wrap gap-1">
                          {workingEmployees.map((emp) => (
                            <div key={emp.id} className="group relative">
                              <div
                                className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-bold shadow-sm cursor-help"
                                style={{ backgroundColor: emp.color }}
                              >
                                {emp.initials}
                              </div>
                              {/* Tooltip au survol */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 whitespace-nowrap pointer-events-none">
                                <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl">
                                  <div className="font-semibold">{emp.name}</div>
                                  {emp.work_hours && (
                                    <div className="text-gray-300 mt-1 font-mono text-[10px]">{emp.work_hours}</div>
                                  )}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                </div>
                              </div>
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

        {/* Indication scroll mobile */}
        <div className="sm:hidden text-center text-xs text-gray-500 mt-3 py-2 bg-gray-50 rounded-lg">
          👈 Glissez pour voir plus 👉
        </div>

        {/* Légende */}
        {monthSchedule.length > 0 && monthSchedule[0]?.employees && (
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
            <h3 className="font-semibold mb-3 text-xs sm:text-sm">Légende de l'équipe</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {monthSchedule[0].employees.map((emp) => (
                <div key={emp.id} className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <div
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: emp.color }}
                  >
                    {emp.initials}
                  </div>
                  <span className="truncate">{emp.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal nouvelle demande - ✅ RESPONSIVE */}
      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="Nouvelle demande"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitLeave} className="space-y-4">
          {user && (
            <div className="p-3 sm:p-4 bg-bg-main rounded-xl text-xs sm:text-sm grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <strong>Congés disponibles :</strong>{' '}
                <span className="text-base sm:text-lg font-bold text-success block">
                  {stats.available} / {user.total_leave_per_year} jours
                </span>
              </div>
              <div>
                <strong>Heures récup :</strong>{' '}
                <span className="text-base sm:text-lg font-bold text-primary block">
                  {stats.recovery_hours}h
                </span>
              </div>
            </div>
          )}

          {/* Type de demande */}
          <div>
            <label className="block font-semibold mb-2 text-sm sm:text-base">Type de demande *</label>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                type="button"
                className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                  leaveForm.request_type === 'leave_days'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setLeaveForm({ ...leaveForm, request_type: 'leave_days' })}
              >
                <div className="text-xl sm:text-2xl mb-1 sm:mb-2">🏖️</div>
                <div className="font-semibold text-xs sm:text-sm">Jours de congés</div>
              </button>
              <button
                type="button"
                className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                  leaveForm.request_type === 'recovery_hours'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setLeaveForm({ ...leaveForm, request_type: 'recovery_hours' })}
              >
                <div className="text-xl sm:text-2xl mb-1 sm:mb-2">⏰</div>
                <div className="font-semibold text-xs sm:text-sm">Heures récupération</div>
              </button>
            </div>
          </div>

          {leaveForm.request_type === 'leave_days' ? (
            <>
              {/* Période ou jour unique */}
              <div>
                <label className="block font-semibold mb-2 text-sm sm:text-base">Durée *</label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    type="button"
                    className={`p-2 sm:p-3 rounded-xl border-2 transition-all ${
                      leaveForm.period_type === 'single_day'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setLeaveForm({ ...leaveForm, period_type: 'single_day' })}
                  >
                    <div className="font-semibold text-xs sm:text-sm">Un seul jour</div>
                  </button>
                  <button
                    type="button"
                    className={`p-2 sm:p-3 rounded-xl border-2 transition-all ${
                      leaveForm.period_type === 'period'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setLeaveForm({ ...leaveForm, period_type: 'period' })}
                  >
                    <div className="font-semibold text-xs sm:text-sm">Période</div>
                  </button>
                </div>
              </div>

              {leaveForm.period_type === 'single_day' ? (
                <div>
                  <label className="block font-semibold mb-2 text-sm sm:text-base">Date *</label>
                  <input
                    type="date"
                    required
                    className="input"
                    value={leaveForm.single_date}
                    onChange={(e) => setLeaveForm({ ...leaveForm, single_date: e.target.value })}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-2 text-sm sm:text-base">Date de début *</label>
                    <input
                      type="date"
                      required
                      className="input"
                      value={leaveForm.start_date}
                      onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-2 text-sm sm:text-base">Date de fin *</label>
                    <input
                      type="date"
                      required
                      className="input"
                      value={leaveForm.end_date}
                      min={leaveForm.start_date}
                      onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {calculatedDays > 0 && (
                <div className="p-3 sm:p-4 bg-success/10 rounded-xl border-2 border-success/20">
                  <div className="text-base sm:text-lg font-bold text-success">
                    {calculatedDays} jour{calculatedDays > 1 ? 's' : ''} ouvré{calculatedDays > 1 ? 's' : ''}
                  </div>
                  <div className="text-xs sm:text-sm text-text-light mt-1">
                    (Calculé selon votre grille horaire)
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold mb-2 text-sm sm:text-base">Type de congé *</label>
                <select
                  className="input"
                  value={leaveForm.type}
                  onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
                >
                  <option value="vacation">Congés payés</option>
                  <option value="sick">Maladie</option>
                  <option value="personal">Personnel</option>
                  <option value="other">Autre</option>
                </select>
              </div>
            </>
          ) : (
            <>
              {/* Heures récupération */}
              <div>
                <label className="block font-semibold mb-2 text-sm sm:text-base">Nombre d'heures à récupérer *</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  className="input"
                  placeholder="Ex: 7.5"
                  value={leaveForm.recovery_hours_requested || ''}
                  onChange={(e) => setLeaveForm({ ...leaveForm, recovery_hours_requested: parseFloat(e.target.value) })}
                />
                <p className="text-xs text-text-light mt-1">
                  Heures supplémentaires prestées à valider par l'admin
                </p>
              </div>
            </>
          )}

          <div>
            <label className="block font-semibold mb-2 text-sm sm:text-base">Motif (optionnel)</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Précisez le motif..."
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
            />
          </div>

          <button type="submit" className="btn btn-primary w-full">
            📤 Envoyer la demande
          </button>
        </form>
      </Modal>
    </div>
  )
}
