import { ClientPageWrapper } from '@/components/ClientPageWrapper'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClientPageWrapper>{children}</ClientPageWrapper>
}

