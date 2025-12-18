import { getServerSession } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { prisma } from '@/lib/prisma'
import { ClientBillingClient } from './ClientBillingClient'

export default async function ClientBillingPage() {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'CLIENT_ADMIN' && session.user.role !== 'CLIENT_USER')) {
    redirect('/login')
  }

  if (!session.user.clientId) {
    return (
      <Layout type="client">
        <div className="py-8">
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Setup Required</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  No client account is associated with your user. Please contact your account manager for assistance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      clientId: session.user.clientId
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          companyName: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Serialize dates for client component
  const serializedInvoices = invoices.map(invoice => ({
    ...invoice,
    createdAt: invoice.createdAt.toISOString(),
    dueDate: invoice.dueDate.toISOString(),
    paidDate: invoice.paidDate?.toISOString() || null,
    updatedAt: invoice.updatedAt.toISOString(),
  }))

  return (
    <Layout type="client">
      <ClientBillingClient invoices={serializedInvoices} />
    </Layout>
  )
}

