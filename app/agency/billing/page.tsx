import { getServerSession } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { prisma } from '@/lib/prisma'
import { BillingClient } from './BillingClient'

export default async function AgencyBillingPage({
  searchParams,
}: {
  searchParams: { clientId?: string }
}) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    redirect('/login')
  }

  const where: any = {}
  if (searchParams?.clientId) {
    where.clientId = searchParams.clientId
  }

  const invoices = await prisma.invoice.findMany({
    where,
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

  const clients = await prisma.client.findMany({
    select: {
      id: true,
      name: true,
      companyName: true,
    },
    orderBy: { companyName: 'asc' }
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
    <Layout type="agency">
      <BillingClient invoices={serializedInvoices} clients={clients} />
    </Layout>
  )
}

