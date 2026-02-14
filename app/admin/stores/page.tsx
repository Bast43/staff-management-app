'use client'

import { useEffect, useState } from 'react'
import Modal from '@/components/Modal'
import StatCard from '@/components/StatCard'

type Store = {
  id: string
  name: string
  address: string
  totalEmployees: number
  expectedToday: number
  presentCount: number
  absentCount: number
}

export default function AdminStores() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [formData, setFormData] = useState({ name: '', address: '' })

  useEffect(() => {
    loadStores()
  }, [])

  // Recharge les stats magasins après chaque modification de présence/absence
  useEffect(() => {
    const handler = () => {
      loadStores()
    }
    window.addEventListener('attendance-updated', handler)
    return () => window.removeEventListener('attendance-updated', handler)
  }, [])

  const loadStores = async () => {
    try {
      const res = await fetch('/api/admin/stores-overview')
      if (res.ok) {
        setStores(await res.json())
      }
    } catch (error) {
      console.error('Error loading stores:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setShowAddModal(false)
        setFormData({ name: '', address: '' })
        loadStores()
        alert('Magasin ajouté !')
      } else {
        alert('Erreur lors de l\'ajout')
      }
    } catch (error) {
      alert('Erreur de connexion')
    }
  }

  const handleEditStore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStore) return

    try {
      const res = await fetch(`/api/stores/${selectedStore.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setShowEditModal(false)
        setSelectedStore(null)
        setFormData({ name: '', address: '' })
        loadStores()
        alert('Magasin modifié !')
      } else {
        alert('Erreur lors de la modification')
      }
    } catch (error) {
      alert('Erreur de connexion')
    }
  }

  const handleDeleteStore = async (storeId: string, storeName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${storeName}" ? Tous les employés seront dissociés.`)) {
      return
    }

    try {
      const res = await fetch(`/api/stores/${storeId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        loadStores()
        alert('Magasin supprimé !')
      } else {
        alert('Erreur lors de la suppression')
      }
    } catch (error) {
      alert('Erreur de connexion')
    }
  }

  const openEditModal = (store: Store) => {
    setSelectedStore(store)
    setFormData({ name: store.name, address: store.address })
    setShowEditModal(true)
  }

  const totalEmployees = stores.reduce((sum, s) => sum + s.totalEmployees, 0)
  const totalExpected = stores.reduce((sum, s) => sum + (s.expectedToday || 0), 0)
  const totalPresent = stores.reduce((sum, s) => sum + s.presentCount, 0)
  const totalAbsent = stores.reduce((sum, s) => sum + s.absentCount, 0)

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Gestion des magasins</h1>
          <p className="text-text-light">Gérez vos différents points de vente</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          ➕ Ajouter un magasin
        </button>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <StatCard
          icon="🏪"
          iconColor="blue"
          value={stores.length}
          label="Magasins totaux"
        />
        <StatCard
          icon="👥"
          iconColor="green"
          value={totalEmployees}
          label="Employés totaux"
        />
        <StatCard
          icon="📅"
          iconColor="purple"
          value={totalExpected}
          label="Attendus aujourd'hui"
        />
        <StatCard
          icon="✓"
          iconColor="green"
          value={totalPresent}
          label="Présents (marqués)"
        />
        <StatCard
          icon="✕"
          iconColor="orange"
          value={totalAbsent}
          label="Absents (marqués)"
        />
      </div>

      {/* Liste des magasins */}
      <div className="grid grid-cols-1 gap-6">
        {stores.map((store) => (
          <div key={store.id} className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-1">🏪 {store.name}</h2>
                <p className="text-text-light">📍 {store.address}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(store)}
                  className="btn btn-secondary btn-small"
                >
                  ✏️ Modifier
                </button>
                <button
                  onClick={() => handleDeleteStore(store.id, store.name)}
                  className="btn btn-danger btn-small"
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-bg-main rounded-xl">
                <div className="text-2xl font-bold text-text-main">{store.totalEmployees}</div>
                <div className="text-sm text-text-light">Total employés</div>
              </div>
              <div className="p-4 bg-bg-main rounded-xl">
                <div className="text-2xl font-bold text-primary">{store.expectedToday || 0}</div>
                <div className="text-sm text-text-light">Attendus aujourd'hui</div>
              </div>
              <div className="p-4 bg-bg-main rounded-xl">
                <div className="text-2xl font-bold text-success">{store.presentCount}</div>
                <div className="text-sm text-text-light">Présents (marqués)</div>
              </div>
              <div className="p-4 bg-bg-main rounded-xl">
                <div className="text-2xl font-bold text-danger">{store.absentCount}</div>
                <div className="text-sm text-text-light">Absents (marqués)</div>
              </div>
            </div>

            <div className="mt-4">
              <a
                href={`/admin/employees?store=${store.id}`}
                className="btn btn-secondary btn-small"
              >
                👥 Voir les employés
              </a>
            </div>
          </div>
        ))}

        {stores.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-text-light mb-4">Aucun magasin pour le moment</p>
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
              ➕ Ajouter votre premier magasin
            </button>
          </div>
        )}
      </div>

      {/* Modal Ajout */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Ajouter un magasin"
      >
        <form onSubmit={handleAddStore} className="space-y-4">
          <div>
            <label className="block font-semibold mb-2">Nom du magasin</label>
            <input
              type="text"
              required
              className="input"
              placeholder="Magasin Centre-Ville"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">Adresse complète</label>
            <input
              type="text"
              required
              className="input"
              placeholder="123 Rue Principale, Namur"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <button type="submit" className="btn btn-primary w-full">
            ✅ Ajouter le magasin
          </button>
        </form>
      </Modal>

      {/* Modal Modification */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedStore(null)
        }}
        title="Modifier le magasin"
      >
        <form onSubmit={handleEditStore} className="space-y-4">
          <div>
            <label className="block font-semibold mb-2">Nom du magasin</label>
            <input
              type="text"
              required
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">Adresse complète</label>
            <input
              type="text"
              required
              className="input"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <button type="submit" className="btn btn-primary w-full">
            💾 Enregistrer les modifications
          </button>
        </form>
      </Modal>
    </div>
  )
}
