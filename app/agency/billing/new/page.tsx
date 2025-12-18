'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Layout } from '@/components/Layout'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface LineItem {
  description: string
  quantity: number
  price: number
  total: number
}

export default function NewInvoicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  
  // Get clientId from URL params or localStorage
  useEffect(() => {
    const clientIdFromUrl = searchParams.get('clientId')
    const clientIdFromStorage = localStorage.getItem('selectedClientId')
    const clientId = clientIdFromUrl || clientIdFromStorage || null
    setSelectedClientId(clientId)
  }, [searchParams])

  const [formData, setFormData] = useState({
    clientId: '',
    dueDate: '',
    description: '',
    paymentLink: '',
    tax: 0,
  })

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, price: 0, total: 0 }
  ])

  // Fetch clients on mount and pre-select client if one is selected
  useEffect(() => {
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => {
        setClients(data)
        // Pre-select client if one is selected in the switcher
        const clientIdFromUrl = searchParams.get('clientId')
        const clientIdFromStorage = localStorage.getItem('selectedClientId')
        const clientId = clientIdFromUrl || clientIdFromStorage
        if (clientId) {
          setFormData(prev => ({ ...prev, clientId }))
        }
      })
      .catch(err => console.error('Failed to fetch clients', err))
  }, [searchParams])

  // Calculate totals when line items change - this is handled in updateLineItem

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, price: 0, total: 0 }])
  }

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index))
    }
  }

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems]
    const newValue = typeof value === 'string' ? value : value
    updated[index] = { ...updated[index], [field]: newValue }
    // Always recalculate total when quantity or price changes
    if (field === 'quantity' || field === 'price') {
      updated[index].total = updated[index].quantity * updated[index].price
    } else {
      // Recalculate total for any field change to ensure it's always correct
      updated[index].total = updated[index].quantity * updated[index].price
    }
    setLineItems(updated)
  }

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + item.total, 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const taxAmount = (subtotal * formData.tax) / 100
    return subtotal + taxAmount
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Use selected client ID if one is pre-selected, otherwise use form selection
    const finalClientId = selectedClientId || formData.clientId

    if (!finalClientId) {
      toast.error('Please select a client')
      setLoading(false)
      return
    }

    if (!formData.dueDate) {
      toast.error('Please select a due date')
      setLoading(false)
      return
    }

    if (lineItems.some(item => !item.description || item.price <= 0)) {
      toast.error('Please fill in all line items with description and price')
      setLoading(false)
      return
    }

    const subtotal = calculateSubtotal()
    const taxAmount = (subtotal * formData.tax) / 100
    const total = subtotal + taxAmount

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: finalClientId,
          dueDate: formData.dueDate,
          description: formData.description || null,
          paymentLink: formData.paymentLink || null,
          amount: subtotal,
          tax: taxAmount,
          total,
          items: JSON.stringify(lineItems),
          status: 'DRAFT',
        }),
      })

      if (response.ok) {
        toast.success('Invoice created successfully')
        router.push('/agency/billing')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create invoice')
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      toast.error('An error occurred while creating the invoice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout type="agency">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/agency/billing"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Billing
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">New Invoice</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create a new invoice for a client
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6 space-y-6">
              {!selectedClientId && (
                <div>
                  <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">
                    Client *
                  </label>
                  <select
                    id="clientId"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.companyName} - {client.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {selectedClientId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Client
                  </label>
                  <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
                    {clients.find(c => c.id === selectedClientId)?.companyName || 'Loading...'}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Client is pre-selected from the client switcher. Change it in the header to select a different client.
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                  Due Date *
                </label>
                <input
                  type="date"
                  id="dueDate"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional notes or description for this invoice..."
                />
              </div>

              <div>
                <label htmlFor="paymentLink" className="block text-sm font-medium text-gray-700">
                  Payment Link
                </label>
                <input
                  type="url"
                  id="paymentLink"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={formData.paymentLink}
                  onChange={(e) => setFormData({ ...formData, paymentLink: e.target.value })}
                  placeholder="https://payment.example.com/invoice/123"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Link that clients can use to pay this invoice
                </p>
              </div>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Line Items</h2>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </button>
              </div>

              <div className="space-y-4">
                {lineItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 items-start p-4 border border-gray-200 rounded-lg">
                    <div className="col-span-12 sm:col-span-5">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        required
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        placeholder="Item description"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Price
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        value={item.price}
                        onChange={(e) => updateLineItem(index, 'price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Total
                      </label>
                      <div className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
                        ${item.total.toFixed(2)}
                      </div>
                    </div>
                    <div className="col-span-1 flex items-end">
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLineItem(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Totals Section */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-900 font-medium">${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <label htmlFor="tax" className="text-sm text-gray-600">
                      Tax (%):
                    </label>
                    <input
                      type="number"
                      id="tax"
                      min="0"
                      step="0.01"
                      className="w-24 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.tax}
                      onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <span className="text-gray-900 font-medium">
                    ${((calculateSubtotal() * formData.tax) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-semibold">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              href="/agency/billing"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}

