'use client'

import { useEffect, useState } from 'react'

type Store = {
  id: string
  name: string
}

type EmployeeStats = {
  id: string
  name: string
  position: string
  total_days: number
  present_days: number
  absent_days: number
  leave_days: number
  presence_rate: number
}

export default function AdminReports() {
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStore, setSelectedStore] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [stats, setStats] = useState<EmployeeStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStores()
  }, [])

  useEffect(() => {
    if (selectedMonth) {
      loadStats()
    }
  }, [selectedStore, selectedMonth])

  const loadStores = async () => {
    try {
      const res = await fetch('/api/stores')
      if (res.ok) {
        setStores(await res.json())
      }
    } catch (error) {
      console.error('Error loading stores:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    setLoading(true)
    try {
      const [year, month] = selectedMonth.split('-')
      const url = `/api/reports/attendance?year=${year}&month=${month}${selectedStore !== 'all' ? `&store=${selectedStore}` : ''}`
      const res = await fetch(url)
      if (res.ok) {
        setStats(await res.json())
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPresenceRateColor = (rate: number) => {
    if (rate >= 95) return 'text-success'
    if (rate >= 85) return 'text-warning'
    return 'text-danger'
  }

  const totalStats = stats.reduce((acc, emp) => ({
    total_days: acc.total_days + emp.total_days,
    present_days: acc.present_days + emp.present_days,
    absent_days: acc.absent_days + emp.absent_days,
    leave_days: acc.leave_days + emp.leave_days,
  }), { total_days: 0, present_days: 0, absent_days: 0, leave_days: 0 })

  const averagePresenceRate = stats.length > 0
    ? stats.reduce((sum, emp) => sum + emp.presence_rate, 0) / stats.length
    : 0

  if (loading && stats.length === 0) {
    return <div className="text-center py-12">Chargement...</div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Rapports de présence</h1>
        <p className="text-text-light">Statistiques mensuelles par employé</p>
      </div>

      {/* Filtres */}
      <div className="card mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="block font-semibold mb-2">Magasin</label>
            <select
              className="input"
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

          <div>
            <label className="block font-semibold mb-2">Mois</label>
            <input
              type="month"
              className="input"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>

          <div className="flex-1"></div>

          <div className="self-end">
            <button
              onClick={loadStats}
              className="btn btn-primary"
            >
              🔄 Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="text-sm text-text-light mb-1">Jours travaillés totaux</div>
          <div className="text-3xl font-bold text-primary">{totalStats.total_days}</div>
        </div>
        <div className="card">
          <div className="text-sm text-text-light mb-1">Présences</div>
          <div className="text-3xl font-bold text-success">{totalStats.present_days}</div>
        </div>
        <div className="card">
          <div className="text-sm text-text-light mb-1">Absences</div>
          <div className="text-3xl font-bold text-danger">{totalStats.absent_days}</div>
        </div>
        <div className="card">
          <div className="text-sm text-text-light mb-1">Taux de présence moyen</div>
          <div className={`text-3xl font-bold ${getPresenceRateColor(averagePresenceRate)}`}>
            {averagePresenceRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Tableau détaillé */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Détail par employé</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-3 px-4 font-semibold">Employé</th>
                <th className="text-left py-3 px-4 font-semibold">Poste</th>
                <th className="text-center py-3 px-4 font-semibold">Jours travaillés</th>
                <th className="text-center py-3 px-4 font-semibold">Présences</th>
                <th className="text-center py-3 px-4 font-semibold">Absences</th>
                <th className="text-center py-3 px-4 font-semibold">Congés</th>
                <th className="text-center py-3 px-4 font-semibold">Taux de présence</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((emp) => (
                <tr key={emp.id} className="border-b border-border hover:bg-bg-main">
                  <td className="py-3 px-4">
                    <div className="font-semibold">{emp.name}</div>
                  </td>
                  <td className="py-3 px-4 text-sm">{emp.position}</td>
                  <td className="py-3 px-4 text-center">{emp.total_days}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-success font-semibold">{emp.present_days}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-danger font-semibold">{emp.absent_days}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-primary font-semibold">{emp.leave_days}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-lg font-bold ${getPresenceRateColor(emp.presence_rate)}`}>
                      {emp.presence_rate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {stats.length === 0 && (
            <div className="text-center py-12 text-text-light">
              Aucune donnée pour cette période
            </div>
          )}
        </div>
      </div>

      {/* Légende */}
      <div className="card mt-6">
        <h3 className="font-semibold mb-3">Interprétation du taux de présence</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-success"></div>
            <span>≥ 95% : Excellent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-warning"></div>
            <span>85-94% : Correct</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-danger"></div>
            <span>&lt; 85% : À surveiller</span>
          </div>
        </div>
        <p className="text-xs text-text-light mt-2">
          * Le taux de présence = (Présences / Jours travaillés) × 100. Les congés approuvés ne sont pas comptés comme absences.
        </p>
      </div>
    </div>
  )
}
