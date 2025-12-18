// Export utility functions

export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return

  // Get headers from first object
  const headers = Object.keys(data[0])
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Handle values with commas, quotes, or newlines
        if (value === null || value === undefined) return ''
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }).join(',')
    ),
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportToJSON(data: any[], filename: string) {
  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.json`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function prepareBlogsForExport(posts: any[]) {
  return posts.map(post => ({
    'Title': post.title,
    'Status': post.status,
    'Published': post.published ? 'Yes' : 'No',
    'Author': post.author || 'N/A',
    'Views': post.views || 0,
    'Created': new Date(post.createdAt).toLocaleDateString(),
    'Published Date': post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'N/A',
  }))
}

export function prepareSocialPostsForExport(posts: any[]) {
  return posts.map(post => ({
    'Platform': post.platform,
    'Content Style': post.contentStyle,
    'Status': post.status,
    'Content': post.content?.substring(0, 100) || 'N/A',
    'Scheduled': post.scheduledAt ? new Date(post.scheduledAt).toLocaleDateString() : 'N/A',
    'Published': post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'N/A',
    'Created': new Date(post.createdAt).toLocaleDateString(),
  }))
}

export function prepareCampaignsForExport(campaigns: any[]) {
  return campaigns.map(campaign => ({
    'Name': campaign.name,
    'Type': campaign.type,
    'Status': campaign.status,
    'Scheduled': campaign.scheduledDate ? new Date(campaign.scheduledDate).toLocaleDateString() : 'N/A',
    'Created': new Date(campaign.createdAt).toLocaleDateString(),
  }))
}

export function prepareInvoicesForExport(invoices: any[]) {
  return invoices.map(invoice => ({
    'Invoice Number': invoice.invoiceNumber,
    'Amount': invoice.amount,
    'Tax': invoice.tax,
    'Total': invoice.total,
    'Status': invoice.status,
    'Due Date': new Date(invoice.dueDate).toLocaleDateString(),
    'Paid Date': invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString() : 'N/A',
    'Created': new Date(invoice.createdAt).toLocaleDateString(),
  }))
}

export function prepareProjectsForExport(projects: any[]) {
  return projects.map(project => ({
    'Title': project.title,
    'Status': project.status,
    'Budget': project.budget || 'N/A',
    'Start Date': project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A',
    'End Date': project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A',
    'Created': new Date(project.createdAt).toLocaleDateString(),
  }))
}

