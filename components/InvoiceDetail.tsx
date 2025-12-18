'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Download, ExternalLink, Calendar, DollarSign, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/Breadcrumbs'

interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  tax: number
  total: number
  status: string
  dueDate: string
  paidDate: string | null
  description: string | null
  items: string | null
  paymentLink: string | null
  createdAt: string
  client: {
    id: string
    name: string
    companyName: string
    email: string
    address: string | null
  }
}

interface InvoiceDetailProps {
  invoiceId: string
}

export function InvoiceDetail({ invoiceId }: InvoiceDetailProps) {
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInvoice()
  }, [invoiceId])

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`)
      if (response.ok) {
        const data = await response.json()
        setInvoice(data)
      } else {
        router.push('/client/billing')
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
      router.push('/client/billing')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = () => {
    window.open(`/api/invoices/${invoiceId}/pdf?print=true`, '_blank')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'SENT':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'OVERDUE':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading invoice...</div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Invoice not found</div>
      </div>
    )
  }

  const items = invoice.items ? JSON.parse(invoice.items) : []

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: 'Billing', href: '/client/billing' },
          { label: `Invoice ${invoice.invoiceNumber}` },
        ]}
      />

      {/* Invoice Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">
              Invoice {invoice.invoiceNumber}
            </h1>
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(invoice.status)}`}>
              {invoice.status}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </button>
            {invoice.paymentLink && invoice.status !== 'PAID' && (
              <a
                href={invoice.paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Pay Invoice
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">Bill To:</h3>
            <div className="text-sm text-gray-900 dark:text-slate-100">
              <p className="font-medium">{invoice.client.companyName}</p>
              <p>{invoice.client.name}</p>
              {invoice.client.address && <p>{invoice.client.address}</p>}
              <p>{invoice.client.email}</p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">Invoice Details:</h3>
            <div className="space-y-2 text-sm text-gray-900 dark:text-slate-100">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                <span><strong>Invoice Date:</strong> {formatDate(invoice.createdAt)}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                <span><strong>Due Date:</strong> {formatDate(invoice.dueDate)}</span>
              </div>
              {invoice.paidDate && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  <span><strong>Paid Date:</strong> {formatDate(invoice.paidDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Items */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-8 mb-6">
        {invoice.description && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Description:</h3>
            <p className="text-sm text-gray-900 dark:text-slate-100">{invoice.description}</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {items.length > 0 ? (
                items.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-100">
                      {item.description || 'Item'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                      {item.quantity || 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-100">
                      {formatCurrency(item.unitPrice || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-100">
                      {formatCurrency((item.quantity || 1) * (item.unitPrice || 0))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                    Service
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-100">
                    {formatCurrency(invoice.amount)}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-slate-100">
                  Subtotal:
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-100">
                  {formatCurrency(invoice.amount)}
                </td>
              </tr>
              {invoice.tax > 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-slate-100">
                    Tax:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-100">
                    {formatCurrency(invoice.tax)}
                  </td>
                </tr>
              )}
              <tr>
                <td colSpan={3} className="px-6 py-4 text-right text-sm font-bold text-gray-900 dark:text-slate-100">
                  Total:
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-slate-100">
                  {formatCurrency(invoice.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}

