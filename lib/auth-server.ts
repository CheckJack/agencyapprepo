import { getServerSession as getNextAuthServerSession } from 'next-auth'
import { authOptions } from './auth'

/**
 * Get server session in App Router
 * Use this instead of getServerSession directly
 */
export async function getServerSession() {
  return await getNextAuthServerSession(authOptions)
}

