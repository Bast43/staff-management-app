'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = isAdmin ? '/api/auth/admin-login' : '/api/auth/login'
      const body = isAdmin 
        ? { password: formData.password }
        : { email: formData.email, password: formData.password }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur de connexion')
        return
      }

      // Redirection selon le rôle
      if (data.user.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/employee')
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center p-4">
      <div className="bg-card-bg rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
            GP
          </div>
          <h1 className="text-3xl font-bold text-text-main">Gestion Personnel</h1>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setIsAdmin(false)}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
              !isAdmin
                ? 'bg-gradient-to-r from-primary to-primary-dark text-white'
                : 'bg-bg-main text-text-light'
            }`}
          >
            👤 Employé
          </button>
          <button
            type="button"
            onClick={() => setIsAdmin(true)}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
              isAdmin
                ? 'bg-gradient-to-r from-primary to-primary-dark text-white'
                : 'bg-bg-main text-text-light'
            }`}
          >
            ⚙️ Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isAdmin && (
            <div>
              <label className="block text-sm font-semibold mb-2">Email</label>
              <input
                type="email"
                required
                className="input"
                placeholder="votre.email@magasin.fr"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">
              {isAdmin ? 'Mot de passe administrateur' : 'Mot de passe'}
            </label>
            <input
              type="password"
              required
              className="input"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full justify-center"
          >
            {loading ? '⏳ Connexion...' : '🔓 Se connecter'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-bg-main rounded-xl text-sm space-y-1">
          <p className="font-semibold mb-2">🔑 Identifiants de test :</p>
          <p><strong>Admin:</strong> admin123</p>
          <p><strong>Marie:</strong> marie.martin@magasin.fr / password123</p>
          <p><strong>Pierre:</strong> pierre.dubois@magasin.fr / password123</p>
        </div>
      </div>
    </div>
  )
}
