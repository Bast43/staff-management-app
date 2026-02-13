type StatCardProps = {
  icon: string
  iconColor: 'blue' | 'green' | 'orange' | 'yellow'
  value: string | number
  label: string
  onClick?: () => void
}

export default function StatCard({ icon, iconColor, value, label, onClick }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-primary/10 text-primary',
    green: 'bg-success/10 text-success',
    orange: 'bg-accent/10 text-accent',
    yellow: 'bg-warning/10 text-warning',
  }

  return (
    <div 
      className={`stat-card ${onClick ? 'cursor-pointer hover:shadow-lg' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colorClasses[iconColor]}`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-text-main mb-1">{value}</div>
      <div className="text-sm text-text-light font-medium">{label}</div>
    </div>
  )
}
