import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resolvedParams = 'then' in params ? await params : params
  const invoiceId = resolvedParams.id

  // Clients can only view their own invoices
  if (session.user.role === 'CLIENT_ADMIN' || session.user.role === 'CLIENT_USER') {
    if (!session.user.clientId) {
      return NextResponse.json({ error: 'No client associated' }, { status: 403 })
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            companyName: true,
            email: true,
            address: true,
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.clientId !== session.user.clientId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // For now, return a simple HTML representation that can be printed as PDF
    // In production, you'd use a library like puppeteer or pdfkit
    const html = generateInvoiceHTML(invoice)

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="invoice-${invoice.invoiceNumber}.html"`,
      },
    })
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
}

function generateInvoiceHTML(invoice: any) {
  const items = invoice.items ? JSON.parse(invoice.items) : []
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { margin-bottom: 30px; }
    .invoice-number { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    .info-section { margin-bottom: 30px; }
    .info-row { margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f5f5f5; font-weight: bold; }
    .total-row { font-weight: bold; }
    .status { padding: 5px 10px; border-radius: 4px; display: inline-block; }
    .status.PAID { background-color: #10b981; color: white; }
    .status.SENT { background-color: #3b82f6; color: white; }
    .status.OVERDUE { background-color: #ef4444; color: white; }
    .status.DRAFT { background-color: #6b7280; color: white; }
    @media print {
      body { margin: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="invoice-number">Invoice ${invoice.invoiceNumber}</div>
    <div class="status ${invoice.status}">${invoice.status}</div>
  </div>

  <div class="info-section">
    <h3>Bill To:</h3>
    <div class="info-row"><strong>${invoice.client.companyName}</strong></div>
    <div class="info-row">${invoice.client.name}</div>
    ${invoice.client.address ? `<div class="info-row">${invoice.client.address}</div>` : ''}
    <div class="info-row">${invoice.client.email}</div>
  </div>

  <div class="info-section">
    <div class="info-row"><strong>Invoice Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</div>
    <div class="info-row"><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</div>
    ${invoice.paidDate ? `<div class="info-row"><strong>Paid Date:</strong> ${new Date(invoice.paidDate).toLocaleDateString()}</div>` : ''}
  </div>

  ${invoice.description ? `<div class="info-section"><p>${invoice.description}</p></div>` : ''}

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Quantity</th>
        <th>Unit Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${items.length > 0 ? items.map((item: any) => `
        <tr>
          <td>${item.description || 'Item'}</td>
          <td>${item.quantity || 1}</td>
          <td>$${(item.unitPrice || 0).toFixed(2)}</td>
          <td>$${((item.quantity || 1) * (item.unitPrice || 0)).toFixed(2)}</td>
        </tr>
      `).join('') : `
        <tr>
          <td colspan="3">Service</td>
          <td>$${invoice.amount.toFixed(2)}</td>
        </tr>
      `}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="3"><strong>Subtotal:</strong></td>
        <td>$${invoice.amount.toFixed(2)}</td>
      </tr>
      ${invoice.tax > 0 ? `
      <tr>
        <td colspan="3"><strong>Tax:</strong></td>
        <td>$${invoice.tax.toFixed(2)}</td>
      </tr>
      ` : ''}
      <tr class="total-row">
        <td colspan="3"><strong>Total:</strong></td>
        <td>$${invoice.total.toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>

  ${invoice.paymentLink && invoice.status !== 'PAID' ? `
    <div class="info-section no-print">
      <a href="${invoice.paymentLink}" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px;">
        Pay Invoice
      </a>
    </div>
  ` : ''}

  <script>
    window.onload = function() {
      if (window.location.search.includes('print=true')) {
        window.print();
      }
    }
  </script>
</body>
</html>
  `
}

