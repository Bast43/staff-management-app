'use client'

import { useEffect, useState } from 'react'
import Modal from '@/components/Modal'

type LeaveRequest = {
  id: string
  start_date: string
  end_date: string
  type: string
  reason: string
  status: string
  admin_comment: string | null
  submitted_at: string
  reviewed_at: string | null
}

type EmployeeInfo = {
  name: string
  total_leave_per_year: number
  used_leave: number
  recovery_hours: number
}

export default function EmployeeLeave() {
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [employee, setEmployee] = useState<EmployeeInfo | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [loading, setLoading] = useState(true)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    type: 'vacation',
    reason: '',
  })

  useEffect(() => {
    loadData()
  }, [filter])

  const loadData = async () => {
    try {
      const [empRes, requestsRes] = await Promise.all([
        fetch('/api/employees/me'),
        fetch(`/api/leaves${filter !== 'all' ? `?status=${filter}` : ''}`),
      ])

      if (empRes.ok) setEmployee(await empRes.json())
      if (requestsRes.ok) setRequests(await requestsRes.json())
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setShowRequestModal(false)
        setFormData({ start_date: '', end_date: '', type: 'vacation', reason: '' })
        loadData()
        alert('Demande envoyée !')
      } else {
        const error = await res.json()
        alert(error.error || 'Erreur lors de l\'envoi')
      }
    } catch (error) {
      alert('Erreur de connexion')
    }
  }

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  const getLeaveTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      vacation: 'Congés payés',
      sick: 'Maladie',
      personal: 'Personnel',
      other: 'Autre',
    }
    return labels[type] || type
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'badge-pending',
      approved: 'badge-approved',
      rejected: 'badge-rejected',
    }
    return badges[status] || 'badge-pending'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '⏳ En attente',
      approved: '✓ Approuvé',
      rejected: '✕ Refusé',
    }
    return labels[status] || status
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length
  const approvedCount = requests.filter(r => r.status === 'approved').length
  const remaining = employee ? employee.total_leave_per_year - employee.used_leave : 0
  const usagePercent = employee ? (employee.used_leave / employee.total_leave_per_year) * 100 : 0

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Mes congés</h1>
          <p className="text-text-light">Gérez vos demandes de congés</p>
        </div>
        <button onClick={() => setShowRequestModal(true)} className="btn btn-primary">
          ➕ Nouvelle demande
        </button>
      </div>

      {/* Stats congés */}
      {employee && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="text-sm text-text-light mb-1">Disponibles</div>
            <div className="text-3xl font-bold text-success">{remaining}</div>
            <div className="text-xs text-text-light">jours</div>
          </div>
          <div className="card">
            <div className="text-sm text-text-light mb-1">Utilisés</div>
            <div className="text-3xl font-bold text-primary">{employee.used_leave}</div>
            <div className="text-xs text-text-light">/ {employee.total_leave_per_year} jours</div>
          </div>
          <div className="card">
            <div className="text-sm text-text-light mb-1">En attente</div>
            <div className="text-3xl font-bold text-warning">{pendingCount}</div>
            <div className="text-xs text-text-light">demande{pendingCount > 1 ? 's' : ''}</div>
          </div>
          <div className="card">
            <div className="text-sm text-text-light mb-1">Heures récup</div>
            <div className="text-3xl font-bold text-info">{employee.recovery_hours}</div>
            <div className="text-xs text-text-light">heures</div>
          </div>
        </div>
      )}

      {/* Barre de progression */}
      {employee && (
        <div className="card mb-8">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-semibold">Utilisation des congés</span>
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

      {/* Filtres */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
            filter === 'all'
              ? 'bg-primary text-white'
              : 'bg-card-bg border border-border hover:bg-bg-main'
          }`}
        >
          Toutes
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
            filter === 'pending'
              ? 'bg-warning text-text-main'
              : 'bg-card-bg border border-border hover:bg-bg-main'
          }`}
        >
          ⏳ En attente ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
            filter === 'approved'
              ? 'bg-success text-white'
              : 'bg-card-bg border border-border hover:bg-bg-main'
          }`}
        >
          ✓ Approuvées ({approvedCount})
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
            filter === 'rejected'
              ? 'bg-danger text-white'
              : 'bg-card-bg border border-border hover:bg-bg-main'
          }`}
        >
          ✕ Refusées
        </button>
      </div>

      {/* Liste des demandes */}
      <div className="card">
        <div className="space-y-4">
          {requests.map((request) => {
            const days = calculateDays(request.start_date, request.end_date)
            return (
              <div key={request.id} className="p-4 bg-bg-main rounded-xl">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`badge ${getStatusBadge(request.status)}`}>
                        {getStatusLabel(request.status)}
                      </span>
                      <span className="text-sm text-text-light">
                        {getLeaveTypeLabel(request.type)}
                      </span>
                    </div>
                    <div className="font-semibold text-lg">
                      {new Date(request.start_date).toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'long' 
                      })}
                      {' → '}
                      {new Date(request.end_date).toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </div>
                    <div className="text-sm text-text-light">
                      {days} jour{days > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {request.reason && (
                  <div className="mb-3">
                    <div className="text-sm font-semibold mb-1">Motif :</div>
                    <div className="text-sm text-text-light">{request.reason}</div>
                  </div>
                )}

                {request.admin_comment && (
                  <div className="p-3 bg-card-bg rounded-lg border-l-4 border-primary">
                    <div className="text-sm font-semibold mb-1">Commentaire admin :</div>
                    <div className="text-sm">{request.admin_comment}</div>
                  </div>
                )}

                <div className="text-xs text-text-light mt-3">
                  Demandé le {new Date(request.submitted_at).toLocaleDateString('fr-FR')}
                  {request.reviewed_at && ` • Traité le ${new Date(request.reviewed_at).toLocaleDateString('fr-FR')}`}
                </div>
              </div>
            )
          })}

          {requests.length === 0 && (
            <div className="text-center py-12 text-text-light">
              <p className="mb-4">Aucune demande pour le moment</p>
              <button onClick={() => setShowRequestModal(true)} className="btn btn-primary">
                ➕ Faire une demande
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal nouvelle demande */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="Nouvelle demande de congé"
      >
        <form onSubmit={handleSubmitRequest} className="space-y-4">
          {employee && (
            <div className="p-4 bg-bg-main rounded-xl text-sm">
              <strong>Congés disponibles :</strong>{' '}
              <span className="text-lg font-bold text-success">
                {remaining} / {employee.total_leave_per_year} jours
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-2">Date de début *</label>
              <input
                type="date"
                required
                className="input"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">Date de fin *</label>
              <input
                type="date"
                required
                className="input"
                value={formData.end_date}
                min={formData.start_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          {formData.start_date && formData.end_date && (
            <div className="p-3 bg-primary/10 rounded-lg text-sm">
              <strong>Durée :</strong> {calculateDays(formData.start_date, formData.end_date)} jour(s)
            </div>
          )}

          <div>
            <label className="block font-semibold mb-2">Type de congé *</label>
            <select
              className="input"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="vacation">Congés payés</option>
              <option value="sick">Maladie</option>
              <option value="personal">Personnel</option>
              <option value="other">Autre</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-2">Motif (optionnel)</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Précisez le motif de votre demande..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
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
