"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

export default function StoreScheduleDisplay() {
  const { storeId } = useParams()
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<any>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    if (!storeId) return
    const fetchData = async () => {
      setLoading(true)
      setError("")
      try {
        const res = await fetch(`/api/admin/stores-overview`)
        if (!res.ok) throw new Error("Erreur API")
        const stores = await res.json()
        const found = stores.find((s: any) => s.id === storeId)
        setStore(found)
        setEmployees(found?.expectedEmployees || [])
      } catch (e) {
        setError("Impossible de charger l'horaire du magasin.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [storeId])

  if (loading) return <div className="text-center py-12">Chargement...</div>
  if (error) return <div className="text-center text-danger py-12">{error}</div>
  if (!store) return <div className="text-center py-12">Magasin introuvable</div>

  return (
    <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center p-4">
      <div className="bg-card-bg rounded-3xl p-8 max-w-xl w-full shadow-2xl">
        <h1 className="text-3xl font-bold mb-2 text-center">Planning du jour</h1>
        <h2 className="text-xl font-semibold mb-6 text-center">{store.name}</h2>
        <div className="mb-6 text-center text-text-light">{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
        <div>
          {employees.length === 0 ? (
            <div className="text-center text-text-light">Aucun employé attendu aujourd'hui</div>
          ) : (
            <ul className="space-y-3">
              {employees.map(emp => (
                <li key={emp.id} className="flex items-center justify-between bg-bg-main rounded-xl px-4 py-3">
                  <span className="font-semibold text-text-main">{emp.name}</span>
                  {emp.work_hours ? (
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded font-mono text-sm">{emp.work_hours}</span>
                  ) : (
                    <span className="text-xs text-text-light">(horaire non défini)</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
