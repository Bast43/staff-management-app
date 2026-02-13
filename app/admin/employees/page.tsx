'use client'

import { useEffect, useState } from 'react'
import Modal from '@/components/Modal'
import { useSearchParams } from 'next/navigation'

type Employee = {
  id: string
  name: string
  email: string
  personal_email: string | null
  phone: string | null
  position: string
  store_id: string
  store_name: string
  total_leave_per_year: number
  used_leave: number
  recovery_hours: number
  hire_date: string
}

type Store = {
  id: string
  name: string
}

export default function AdminEmployees() {
  const searchParams = useSearchParams()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStore, setSelectedStore] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    personal_email: '',
    phone: '',
    password: '',
    position: '',
    store_id: '',
    total_leave_per_year: 25,
    hire_date: '',
  })
  const [adjustForm, setAdjustForm] = useState({
    type: 'leave_days',
    amount: 0,
    reason: '',
  })

  useEffect(() => {
    loadData()
    const storeParam = searchParams.get('store')
    if (storeParam) setSelectedStore(storeParam)
  }, [searchParams])

  const loadData = async () => {
    try {
      const [empRes, storesRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/stores'),
      ])

      if (empRes.ok) setEmployees(await empRes.json())
      if (storesRes.ok) setStores(await storesRes.json())
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setShowAddModal(false)
        resetForm()
        loadData()
        alert('Employé ajouté !')
      } else {
        const error = await res.json()
        alert(error.error || 'Erreur lors de l\'ajout')
      }
    } catch (error) {
      alert('Erreur de connexion')
    }
  }

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmployee) return

    try {
      const res = await fetch(`/api/employees/${selectedEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setShowEditModal(false)
        setSelectedEmployee(null)
        resetForm()
        loadData()
        alert('Employé modifié !')
      } else {
        alert('Erreur lors de la modification')
      }
    } catch (error) {
      alert('Erreur de connexion')
    }
  }

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmployee) return

    try {
      const res = await fetch(`/api/employees/${selectedEmployee.id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adjustForm),
      })

      if (res.ok) {
        setShowAdjustModal(false)
        setSelectedEmployee(null)
        setAdjustForm({ type: 'leave_days', amount: 0, reason: '' })
        loadData()
        alert('Ajustement effectué !')
      } else {
        const error = await res.json()
        alert(error.error || 'Erreur lors de l\'ajustement')
      }
    } catch (error) {
      alert('Erreur de connexion')
    }
  }

  const handleDeleteEmployee = async (empId: string, empName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${empName}" ?`)) {
      return
    }

    try {
      const res = await fetch(`/api/employees/${empId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        loadData()
        alert('Employé supprimé !')
      } else {
        alert('Erreur lors de la suppression')
      }
    } catch (error) {
      alert('Erreur de connexion')
    }
  }

  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee)
    setFormData({
      name: employee.name,
      email: employee.email,
      personal_email: employee.personal_email || '',
      phone: employee.phone || '',
      password: '',
      position: employee.position,
      store_id: employee.store_id,
      total_leave_per_year: employee.total_leave_per_year,
      hire_date: employee.hire_date,
    })
    setShowEditModal(true)
  }

  const openAdjustModal = (employee: Employee) => {
    setSelectedEmployee(employee)
    setShowAdjustModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      personal_email: '',
      phone: '',
      password: '',
      position: '',
      store_id: '',
      total_leave_per_year: 25,
      hire_date: '',
    })
  }

  const filteredEmployees = selectedStore === 'all'
    ? employees
    : employees.filter(e => e.store_id === selectedStore)

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Gestion des employés</h1>
          <p className="text-text-light">{filteredEmployees.length} employé(s)</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          ➕ Ajouter un employé
        </button>
      </div>

      {/* Filtres par magasin */}
      {stores.length > 1 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedStore('all')}
            className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
              selectedStore === 'all'
                ? 'bg-primary text-white'
                : 'bg-card-bg border border-border hover:bg-bg-main'
            }`}
          >
            🌐 Tous les magasins
          </button>
          {stores.map((store) => (
            <button
              key={store.id}
              onClick={() => setSelectedStore(store.id)}
              className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                selectedStore === store.id
                  ? 'bg-primary text-white'
                  : 'bg-card-bg border border-border hover:bg-bg-main'
              }`}
            >
              🏪 {store.name}
            </button>
          ))}
        </div>
      )}

      {/* Tableau des employés */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">Nom</th>
                <th className="text-left py-3 px-4 font-semibold">Contact</th>
                <th className="text-left py-3 px-4 font-semibold">Poste</th>
                {selectedStore === 'all' && <th className="text-left py-3 px-4 font-semibold">Magasin</th>}
                <th className="text-left py-3 px-4 font-semibold">Congés</th>
                <th className="text-left py-3 px-4 font-semibold">Récup</th>
                <th className="text-left py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => {
                const remaining = emp.total_leave_per_year - emp.used_leave
                return (
                  <tr key={emp.id} className="border-b border-border hover:bg-bg-main">
                    <td className="py-3 px-4">
                      <div className="font-semibold">{emp.name}</div>
                      <div className="text-xs text-text-light">{emp.email}</div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {emp.phone && <div>📱 {emp.phone}</div>}
                      {emp.personal_email && <div className="text-xs text-text-light">✉️ {emp.personal_email}</div>}
                      {!emp.phone && !emp.personal_email && <span className="text-text-light">-</span>}
                    </td>
                    <td className="py-3 px-4">{emp.position}</td>
                    {selectedStore === 'all' && (
                      <td className="py-3 px-4 text-sm">{emp.store_name || 'Non assigné'}</td>
                    )}
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <strong className={remaining < 5 ? 'text-danger' : 'text-success'}>
                          {remaining}
                        </strong> / {emp.total_leave_per_year}
                      </div>
                      <div className="text-xs text-text-light">{emp.used_leave} utilisés</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm font-semibold">{emp.recovery_hours}h</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => window.location.href = `/admin/employees/${emp.id}/schedule`}
                          className="btn btn-secondary btn-small"
                          title="Grille horaire"
                        >
                          📅
                        </button>
                        <button
                          onClick={() => openAdjustModal(emp)}
                          className="btn btn-primary btn-small"
                          title="Ajuster congés/récup"
                        >
                          ➕
                        </button>
                        <button
                          onClick={() => openEditModal(emp)}
                          className="btn btn-secondary btn-small"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                          className="btn btn-danger btn-small"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-12">
              <p className="text-text-light mb-4">Aucun employé trouvé</p>
              <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
                ➕ Ajouter un employé
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Ajout */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Ajouter un employé"
        maxWidth="lg"
      >
        <form onSubmit={handleAddEmployee} className="space-y-4">
          <div>
            <label className="block font-semibold mb-2">Nom complet *</label>
            <input
              type="text"
              required
              className="input"
              placeholder="Jean Dupont"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-2">Email professionnel *</label>
              <input
                type="email"
                required
                className="input"
                placeholder="jean.dupont@magasin.fr"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">Email personnel</label>
              <input
                type="email"
                className="input"
                placeholder="jean.dupont@gmail.com"
                value={formData.personal_email}
                onChange={(e) => setFormData({ ...formData, personal_email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-2">Téléphone</label>
              <input
                type="tel"
                className="input"
                placeholder="+32 123 45 67 89"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">Poste *</label>
              <input
                type="text"
                required
                className="input"
                placeholder="Vendeur"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-2">Mot de passe *</label>
              <input
                type="password"
                required
                className="input"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">Magasin *</label>
              <select
                required
                className="input"
                value={formData.store_id}
                onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
              >
                <option value="">-- Sélectionner --</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-2">Congés annuels</label>
              <input
                type="number"
                required
                min="0"
                className="input"
                value={formData.total_leave_per_year}
                onChange={(e) => setFormData({ ...formData, total_leave_per_year: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">Date d'embauche</label>
              <input
                type="date"
                className="input"
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full">
            ✅ Ajouter l'employé
          </button>
        </form>
      </Modal>

      {/* Modal Modification */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedEmployee(null)
        }}
        title="Modifier l'employé"
        maxWidth="lg"
      >
        <form onSubmit={handleEditEmployee} className="space-y-4">
          <div>
            <label className="block font-semibold mb-2">Nom complet *</label>
            <input
              type="text"
              required
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-2">Email professionnel *</label>
              <input
                type="email"
                required
                className="input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">Email personnel</label>
              <input
                type="email"
                className="input"
                placeholder="email.personnel@gmail.com"
                value={formData.personal_email}
                onChange={(e) => setFormData({ ...formData, personal_email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-2">Téléphone</label>
              <input
                type="tel"
                className="input"
                placeholder="+32 123 45 67 89"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">Poste *</label>
              <input
                type="text"
                required
                className="input"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-2">Nouveau mot de passe (laisser vide pour ne pas changer)</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-2">Magasin *</label>
              <select
                required
                className="input"
                value={formData.store_id}
                onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
              >
                <option value="">-- Sélectionner --</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-2">Congés annuels</label>
              <input
                type="number"
                required
                min="0"
                className="input"
                value={formData.total_leave_per_year}
                onChange={(e) => setFormData({ ...formData, total_leave_per_year: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-2">Date d'embauche</label>
            <input
              type="date"
              className="input"
              value={formData.hire_date}
              onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
            />
          </div>

          <button type="submit" className="btn btn-primary w-full">
            💾 Enregistrer les modifications
          </button>
        </form>
      </Modal>

      {/* Modal Ajustement */}
      <Modal
        isOpen={showAdjustModal}
        onClose={() => {
          setShowAdjustModal(false)
          setSelectedEmployee(null)
        }}
        title={`Ajuster congés/récup - ${selectedEmployee?.name}`}
      >
        <form onSubmit={handleAdjustment} className="space-y-4">
          {selectedEmployee && (
            <div className="p-4 bg-bg-main rounded-xl text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Congés restants :</strong>
                  <div className="text-lg font-bold text-primary">
                    {selectedEmployee.total_leave_per_year - selectedEmployee.used_leave} / {selectedEmployee.total_leave_per_year} jours
                  </div>
                </div>
                <div>
                  <strong>Heures récup :</strong>
                  <div className="text-lg font-bold text-success">
                    {selectedEmployee.recovery_hours}h
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold mb-2">Type d'ajustement *</label>
            <select
              className="input"
              value={adjustForm.type}
              onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
            >
              <option value="leave_days">Jours de congés</option>
              <option value="recovery_hours">Heures de récupération</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Montant * (positif = ajouter, négatif = retirer)
            </label>
            <input
              type="number"
              step="0.5"
              required
              className="input"
              placeholder="Ex: 2.5 ou -1"
              value={adjustForm.amount || ''}
              onChange={(e) => setAdjustForm({ ...adjustForm, amount: parseFloat(e.target.value) })}
            />
            <p className="text-xs text-text-light mt-1">
              {adjustForm.type === 'leave_days' ? 'Jours de congés' : 'Heures'} à {adjustForm.amount >= 0 ? 'ajouter' : 'retirer'}
            </p>
          </div>

          <div>
            <label className="block font-semibold mb-2">Raison *</label>
            <textarea
              className="input"
              rows={3}
              required
              placeholder="Ex: Prime exceptionnelle, Rattrapage heures supplémentaires, Correction erreur..."
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={!adjustForm.amount || !adjustForm.reason.trim()}
            className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ Appliquer l'ajustement
          </button>
        </form>
      </Modal>
    </div>
  )
}
