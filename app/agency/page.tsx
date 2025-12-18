import { getServerSession } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { prisma } from '@/lib/prisma'
import { 
  Users, 
  FolderKanban, 
  Mail, 
  DollarSign,
  TrendingUp,
  Activity
} from 'lucide-react'

export default async function AgencyDashboard() {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    redirect('/login')
  }

  const stats = await Promise.all([
    prisma.client.count(),
    prisma.project.count(),
    prisma.campaign.count({ where: { status: 'ACTIVE' } }),
    prisma.invoice.aggregate({
      _sum: { total: true },
      where: { status: 'PAID' }
    })
  ])

  const [totalClients, totalProjects, activeCampaigns, revenue] = stats
  const totalRevenue = revenue._sum.total || 0

  return (
    <Layout type="agency">
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="w-full py-8">
          {/* Hero Header Section */}
          <div className="mb-10">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-2">
                Agency Dashboard
              </h1>
              <p className="text-base text-gray-600">
                Welcome back, <span className="font-medium text-gray-900">{session.user.name}</span>
              </p>
            </div>
          </div>

          {/* Key Metrics Cards - Improved Design */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
            {/* Total Clients Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all duration-200 group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="mb-1">
                <p className="text-3xl font-bold text-gray-900">{totalClients}</p>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Total Clients</h3>
              <p className="text-xs text-gray-500">All client accounts</p>
            </div>

            {/* Active Projects Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all duration-200 group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                  <FolderKanban className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="mb-1">
                <p className="text-3xl font-bold text-gray-900">{totalProjects}</p>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Active Projects</h3>
              <p className="text-xs text-gray-500">Projects in progress</p>
            </div>

            {/* Active Campaigns Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all duration-200 group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors">
                  <Mail className="h-5 w-5 text-amber-600" />
                </div>
              </div>
              <div className="mb-1">
                <p className="text-3xl font-bold text-gray-900">{activeCampaigns}</p>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Active Campaigns</h3>
              <p className="text-xs text-gray-500">Running campaigns</p>
            </div>

            {/* Total Revenue Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all duration-200 group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="mb-1">
                <p className="text-3xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Total Revenue</h3>
              <p className="text-xs text-gray-500">Paid invoices</p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
                <p className="text-sm text-gray-500 mt-1">Latest project activity</p>
              </div>
              <div className="p-6">
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <FolderKanban className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">No recent projects</h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    Your recent projects will appear here once created.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Recent Clients</h2>
                <p className="text-sm text-gray-500 mt-1">Latest client activity</p>
              </div>
              <div className="p-6">
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">No recent clients</h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    Your recent clients will appear here once added.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

