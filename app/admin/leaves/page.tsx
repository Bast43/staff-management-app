'use client'

import { useEffect, useState } from 'react'
import Modal from '@/components/Modal'

type LeaveRequest = {
  id: string
  user_id: string
  user_name: string
  store_name: string
  start_date: string
  end_date: string
  type: string
  reason: string
  status: string
  calculated_days?: number
  recovery_hours_requested?: number
  admin_comment: string | null
  submitted_at: string
  reviewed_at: string | null
}

type Employee = {
  total_leave_per_year: number
  used_leave: number
}

export default function AdminLeaves() {
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [loading, setLoading] = useState(true)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [employeeInfo, setEmployeeInfo] = useState<Employee | null>(null)
  const [reviewComment, setReviewComment] = useState('')

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      // Charger TOUTES les demandes pour avoir les bons compteurs
      const res = await fetch('/api/leaves')
      if (res.ok) {
        setAllRequests(await res.json())
      }
    } catch (error) {
      console.error('Error loading requests:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrer les demandes pour l'affichage
  const filteredRequests = filter === 'all' 
    ? allRequests 
    : allRequests.filter(r => r.status === filter)

  // Calculer les compteurs depuis TOUTES les demandes
  const pendingCount = allRequests.filter(r => r.status === 'pending').length
  const approvedCount = allRequests.filter(r => r.status === 'approved').length
  const rejectedCount = allRequests.filter(r => r.status === 'rejected').length

  const openReviewModal = async (request: LeaveRequest) => {
    setSelectedRequest(request)
    setReviewComment('')

    // Charger les infos de l'employé
    try {
      const res = await fetch(`/api/employees/${request.user_id}`)
      if (res.ok) {
        setEmployeeInfo(await res.json())
      }
    } catch (error) {
      console.error('Error loading employee:', error)
    }

    setShowReviewModal(true)
  }

  const handleApprove = async () => {
    if (!selectedRequest) return

    try {
      const res = await fetch(`/api/leaves/${selectedRequest.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: reviewComment }),
      })

      if (res.ok) {
        setShowReviewModal(false)
        setSelectedRequest(null)
        setEmployeeInfo(null)
        loadRequests()
        alert('Congé approuvé !')
      } else {
        const error = await res.json()
        alert(error.error || 'Erreur lors de l\'approbation')
      }
    } catch (error) {
      alert('Erreur de connexion')
    }
  }

  const handleReject = async () => {
    if (!selectedRequest) return

    if (!reviewComment.trim()) {
      alert('Veuillez ajouter un commentaire pour expliquer le refus')
      return
    }

    try {
      const res = await fetch(`/api/leaves/${selectedRequest.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: reviewComment }),
      })

      if (res.ok) {
        setShowReviewModal(false)
        setSelectedRequest(null)
        setEmployeeInfo(null)
        loadRequests()
        alert('Congé refusé')
      } else {
        alert('Erreur lors du refus')
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

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '⏳ En attente',
      approved: '✓ Approuvé',
      rejected: '✕ Refusé',
    }
    return labels[status] || status
  }

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Demandes de congé</h1>
        <p className="text-text-light">Gérez les demandes de vos employés</p>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
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
          ✓ Approuvés ({approvedCount})
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
            filter === 'rejected'
              ? 'bg-danger text-white'
              : 'bg-card-bg border border-border hover:bg-bg-main'
          }`}
        >
          ✕ Refusés ({rejectedCount})
        </button>
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
      </div>

      {/* Tableau des demandes */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">Employé</th>
                <th className="text-left py-3 px-4 font-semibold">Magasin</th>
                <th className="text-left py-3 px-4 font-semibold">Dates</th>
                <th className="text-left py-3 px-4 font-semibold">Durée</th>
                <th className="text-left py-3 px-4 font-semibold">Type</th>
                <th className="text-left py-3 px-4 font-semibold">Statut</th>
                <th className="text-left py-3 px-4 font-semibold">Soumis le</th>
                <th className="text-left py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => {
                const days = calculateDays(request.start_date, request.end_date)
                return (
                  <tr key={request.id} className="border-b border-border hover:bg-bg-main">
                    <td className="py-3 px-4">
                      <strong>{request.user_name}</strong>
                    </td>
                    <td className="py-3 px-4 text-sm">{request.store_name}</td>
                    <td className="py-3 px-4 text-sm">
                      {new Date(request.start_date).toLocaleDateString('fr-FR')} <br />
                      {new Date(request.end_date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4">
                      <strong>{days}</strong> jour{days > 1 ? 's' : ''}
                    </td>
                    <td className="py-3 px-4 text-sm">{getLeaveTypeLabel(request.type)}</td>
                    <td className="py-3 px-4">
                      <span className={`badge badge-${request.status}`}>
                        {getStatusLabel(request.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {new Date(request.submitted_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4">
                      {request.status === 'pending' ? (
                        <button
                          onClick={() => openReviewModal(request)}
                          className="btn btn-success btn-small"
                        >
                          Examiner
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedRequest(request)
                            setReviewComment(request.admin_comment || '')
                            setShowReviewModal(true)
                          }}
                          className="btn btn-secondary btn-small"
                        >
                          Détails
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <p className="text-text-light">Aucune demande trouvée</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Review */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false)
          setSelectedRequest(null)
          setEmployeeInfo(null)
        }}
        title={selectedRequest?.status === 'pending' ? 'Examiner la demande' : 'Détails de la demande'}
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="p-4 bg-bg-main rounded-xl space-y-2">
              <p><strong>Employé:</strong> {selectedRequest.user_name}</p>
              <p><strong>Magasin:</strong> {selectedRequest.store_name}</p>
              <p><strong>Dates:</strong> {new Date(selectedRequest.start_date).toLocaleDateString('fr-FR')} - {new Date(selectedRequest.end_date).toLocaleDateString('fr-FR')}</p>
              <p>
                <strong>Durée:</strong> {calculateDays(selectedRequest.start_date, selectedRequest.end_date)} jours
                {selectedRequest.calculated_days && selectedRequest.calculated_days !== calculateDays(selectedRequest.start_date, selectedRequest.end_date) && (
                  <span className="text-primary font-bold"> ({selectedRequest.calculated_days} jours ouvrés décomptés)</span>
                )}
              </p>
              <p><strong>Type:</strong> {getLeaveTypeLabel(selectedRequest.type)}</p>
              <p><strong>Motif:</strong> {selectedRequest.reason || 'Non spécifié'}</p>
              {employeeInfo && (
                <p><strong>Congés restants:</strong> {employeeInfo.total_leave_per_year - employeeInfo.used_leave} / {employeeInfo.total_leave_per_year} jours</p>
              )}
            </div>

            {selectedRequest.status === 'pending' ? (
              <>
                <div>
                  <label className="block font-semibold mb-2">
                    Commentaire {employeeInfo && calculateDays(selectedRequest.start_date, selectedRequest.end_date) > (employeeInfo.total_leave_per_year - employeeInfo.used_leave) ? '(requis - congés insuffisants)' : '(optionnel)'}
                  </label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Ajoutez un commentaire..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    className="btn btn-success flex-1"
                  >
                    ✓ Approuver
                  </button>
                  <button
                    onClick={handleReject}
                    className="btn btn-danger flex-1"
                  >
                    ✕ Refuser
                  </button>
                </div>
              </>
            ) : (
              <>
                {selectedRequest.admin_comment && (
                  <div className="p-4 bg-bg-main rounded-xl">
                    <p className="font-semibold mb-1">Commentaire admin:</p>
                    <p className="text-text-light">{selectedRequest.admin_comment}</p>
                  </div>
                )}
                {selectedRequest.reviewed_at && (
                  <p className="text-sm text-text-light">
                    Traité le {new Date(selectedRequest.reviewed_at).toLocaleDateString('fr-FR')} à {new Date(selectedRequest.reviewed_at).toLocaleTimeString('fr-FR')}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
