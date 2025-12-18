import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create agency admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@uptnable.com' },
    update: {},
    create: {
      email: 'admin@uptnable.com',
      password: hashedPassword,
      name: 'Agency Admin',
      role: 'AGENCY_ADMIN',
    },
  })

  console.log('Created admin user:', admin.email)

  // Create a sample client
  const client = await prisma.client.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      name: 'John Doe',
      companyName: 'Example Corp',
      email: 'client@example.com',
      phone: '+1-555-0123',
      website: 'https://example.com',
      status: 'active',
      portalEnabled: true,
    },
  })

  console.log('Created sample client:', client.companyName)

  // Create client admin user
  const clientPassword = await bcrypt.hash('client123', 10)
  const clientUser = await prisma.user.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      email: 'client@example.com',
      password: clientPassword,
      name: 'John Doe',
      role: 'CLIENT_ADMIN',
      clientId: client.id,
    },
  })

  console.log('Created client user:', clientUser.email)

  // Create sample project
  const project = await prisma.project.create({
    data: {
      title: 'Website Redesign',
      description: 'Complete redesign of company website',
      status: 'IN_PROGRESS',
      startDate: new Date(),
      budget: 50000,
      clientId: client.id,
    },
  })

  console.log('Created sample project:', project.title)

  // Create sample campaign
  const campaign = await prisma.campaign.create({
    data: {
      name: 'Summer Email Campaign',
      description: 'Promotional email campaign for summer products',
      type: 'EMAIL',
      status: 'ACTIVE',
      startDate: new Date(),
      clientId: client.id,
    },
  })

  console.log('Created sample campaign:', campaign.name)

  // Create sample invoice
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-001',
      clientId: client.id,
      amount: 5000,
      tax: 500,
      total: 5500,
      status: 'SENT',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      description: 'Monthly retainer - July 2024',
    },
  })

  console.log('Created sample invoice:', invoice.invoiceNumber)

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

