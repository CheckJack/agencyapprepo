import { getServerSession } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { InvoiceDetail } from '@/components/InvoiceDetail'

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'CLIENT_ADMIN' && session.user.role !== 'CLIENT_USER')) {
    redirect('/login')
  }

  if (!session.user.clientId) {
    redirect('/client')
  }

  const resolvedParams = 'then' in params ? await params : params

  return (
    <Layout type="client">
      <InvoiceDetail invoiceId={resolvedParams.id} />
    </Layout>
  )
}

