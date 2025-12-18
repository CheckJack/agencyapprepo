import { getServerSession } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { ClientsList } from '@/components/ClientsList'

export default async function ClientsPage() {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    redirect('/login')
  }

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          projects: true,
          campaigns: true,
        }
      }
    }
  })

  return (
    <Layout type="agency">
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="w-full py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Clients</h1>
              <p className="mt-2 text-base text-gray-600">
                Manage all your clients and their portals
              </p>
            </div>
            <Link
              href="/agency/clients/new"
              className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder="Search clients..."
                />
              </div>
            </div>
            <div className="p-6">
              <ClientsList clients={clients} userRole={session.user.role} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

