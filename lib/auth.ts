import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export type TokenPayload = {
  userId: string
  email: string
  role: 'admin' | 'employee'
  storeId?: string
}

export function createToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch {
    return null
  }
}

export async function getAuthUser(request?: NextRequest): Promise<TokenPayload | null> {
  try {
    let token: string | undefined

    if (request) {
      // Essayer de récupérer depuis les cookies de la requête
      token = request.cookies.get('auth-token')?.value
    } else {
      // Essayer de récupérer depuis le cookie store
      try {
        const cookieStore = cookies()
        token = cookieStore.get('auth-token')?.value
      } catch (e) {
        // Si cookies() n'est pas disponible, retourner null
        return null
      }
    }
    
    if (!token) return null
    
    return verifyToken(token)
  } catch {
    return null
  }
}

export function setAuthCookie(token: string) {
  const cookieStore = cookies()
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

export function clearAuthCookie() {
  const cookieStore = cookies()
  cookieStore.delete('auth-token')
}
