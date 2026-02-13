import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type User = {
  id: string
  name: string
  email: string
  password: string
  role: 'admin' | 'employee'
  position: string
  store_id: string | null
  total_leave_per_year: number
  used_leave: number
  hire_date: string
  created_at: string
}

export type Store = {
  id: string
  name: string
  address: string
  created_at: string
}

export type Attendance = {
  id: string
  user_id: string
  store_id: string
  date: string
  status: 'present' | 'absent'
  justification: string | null
  justified_by: string | null
  created_at: string
  updated_at: string
}

export type LeaveRequest = {
  id: string
  user_id: string
  user_name: string
  store_id: string
  start_date: string
  end_date: string
  type: 'vacation' | 'sick' | 'personal' | 'other'
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  admin_comment: string | null
  reviewed_by: string | null
  submitted_at: string
  reviewed_at: string | null
}
