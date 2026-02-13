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
    request_type: 'leave_days', // 'leave_days' ou 'recovery_hours'
    period_type: 'period', // 'single_day' ou 'period'
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
        // Demande d'heures récup
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
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Bonjour {user?.name || ''} !</h1>
        <p className="text-text-light">{user?.position || ''} • {user?.store_name || ''}</p>
      </div>

      {/* Stats personnelles */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <StatCard
          icon="🏖️"
          iconColor="green"
          value={stats.available}
          label="Jours disponibles"
        />
        <StatCard
          icon="📅"
          iconColor="blue"
          value={stats.used}
          label="Jours utilisés"
        />
        <StatCard
          icon="⏳"
          iconColor="yellow"
          value={stats.pending}
          label="En attente"
        />
        <StatCard
          icon="✓"
          iconColor="green"
          value={stats.approved}
          label="Approuvés"
        />
        <StatCard
          icon="⏰"
          iconColor="purple"
          value={`${stats.recovery_hours}h`}
          label="Heures récup"
        />
      </div>

      {/* Barre de progression */}
      {user && (
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Utilisation des congés</h3>
            <button onClick={() => setShowLeaveModal(true)} className="btn btn-primary">
              ➕ Nouvelle demande
            </button>
          </div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-text-light">
              {stats.used} / {user.total_leave_per_year} jours utilisés
            </span>
            <span className="text-text-light">{usagePercent.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-bg-main rounded-full h-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                usagePercent >= 90 ? 'bg-danger' : usagePercent >= 70 ? 'bg-warning' : 'bg-success'
              }`}
              style={{ width: `${Math.min(100, usagePercent)}%` }}
            />
          </div>
        </div>
      )}

      {/* Planning de l'équipe */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Planning de l'équipe</h2>
          <div className="flex items-center gap-2">
            <button onClick={previousMonth} className="btn btn-secondary btn-small">
              ← Précédent
            </button>
            <button onClick={thisMonth} className="btn btn-primary btn-small">
              Ce mois
            </button>
            <button onClick={nextMonth} className="btn btn-secondary btn-small">
              Suivant →
            </button>
          </div>
        </div>

        <div className="mb-4 text-center">
          <h3 className="text-xl font-semibold capitalize">{monthName}</h3>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day, i) => (
                <div key={day} className="text-center font-semibold py-2 text-sm">
                  {weekDays[i]}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((date, index) => {
                const schedule = getScheduleForDate(date)
                const isWeekend = date && (date.getDay() === 0 || date.getDay() === 6)
                const isToday = date && date.toDateString() === new Date().toDateString()
                const workingEmployees = schedule?.employees.filter(e => e.isWorking) || []

                return (
                  <div
                    key={index}
                    className={`min-h-[100px] p-2 rounded-lg border ${
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
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm cursor-help"
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

        {monthSchedule.length > 0 && monthSchedule[0]?.employees && (
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="font-semibold mb-3 text-sm">Légende de l'équipe</h3>
            <div className="flex flex-wrap gap-2">
              {monthSchedule[0].employees.map((emp) => (
                <div key={emp.id} className="flex items-center gap-1.5 text-sm">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: emp.color }}
                  >
                    {emp.initials}
                  </div>
                  <span>{emp.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal nouvelle demande */}
      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="Nouvelle demande"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitLeave} className="space-y-4">
          {user && (
            <div className="p-4 bg-bg-main rounded-xl text-sm grid grid-cols-2 gap-4">
              <div>
                <strong>Congés disponibles :</strong>{' '}
                <span className="text-lg font-bold text-success block">
                  {stats.available} / {user.total_leave_per_year} jours
                </span>
              </div>
              <div>
                <strong>Heures récup :</strong>{' '}
                <span className="text-lg font-bold text-primary block">
                  {stats.recovery_hours}h
                </span>
              </div>
            </div>
          )}

          {/* Type de demande */}
          <div>
            <label className="block font-semibold mb-2">Type de demande *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className={`p-4 rounded-xl border-2 transition-all ${
                  leaveForm.request_type === 'leave_days'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setLeaveForm({ ...leaveForm, request_type: 'leave_days' })}
              >
                <div className="text-2xl mb-2">🏖️</div>
                <div className="font-semibold">Jours de congés</div>
              </button>
              <button
                type="button"
                className={`p-4 rounded-xl border-2 transition-all ${
                  leaveForm.request_type === 'recovery_hours'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setLeaveForm({ ...leaveForm, request_type: 'recovery_hours' })}
              >
                <div className="text-2xl mb-2">⏰</div>
                <div className="font-semibold">Heures récupération</div>
              </button>
            </div>
          </div>

          {leaveForm.request_type === 'leave_days' ? (
            <>
              {/* Période ou jour unique */}
              <div>
                <label className="block font-semibold mb-2">Durée *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className={`p-3 rounded-xl border-2 transition-all ${
                      leaveForm.period_type === 'single_day'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setLeaveForm({ ...leaveForm, period_type: 'single_day' })}
                  >
                    <div className="font-semibold">Un seul jour</div>
                  </button>
                  <button
                    type="button"
                    className={`p-3 rounded-xl border-2 transition-all ${
                      leaveForm.period_type === 'period'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setLeaveForm({ ...leaveForm, period_type: 'period' })}
                  >
                    <div className="font-semibold">Période</div>
                  </button>
                </div>
              </div>

              {leaveForm.period_type === 'single_day' ? (
                <div>
                  <label className="block font-semibold mb-2">Date *</label>
                  <input
                    type="date"
                    required
                    className="input"
                    value={leaveForm.single_date}
                    onChange={(e) => setLeaveForm({ ...leaveForm, single_date: e.target.value })}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-2">Date de début *</label>
                    <input
                      type="date"
                      required
                      className="input"
                      value={leaveForm.start_date}
                      onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-2">Date de fin *</label>
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
                <div className="p-4 bg-success/10 rounded-xl border-2 border-success/20">
                  <div className="text-lg font-bold text-success">
                    {calculatedDays} jour{calculatedDays > 1 ? 's' : ''} ouvré{calculatedDays > 1 ? 's' : ''}
                  </div>
                  <div className="text-sm text-text-light mt-1">
                    (Calculé selon votre grille horaire)
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold mb-2">Type de congé *</label>
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
                <label className="block font-semibold mb-2">Nombre d'heures à récupérer *</label>
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
            <label className="block font-semibold mb-2">Motif (optionnel)</label>
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
