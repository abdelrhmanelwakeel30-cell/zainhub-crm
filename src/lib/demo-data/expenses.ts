const now = Date.now()
const daysAgo = (n: number) => new Date(now - n * 86400000).toISOString()

export const expenseCategories = [
  { id: 'ec-1', name: 'Software & Tools' },
  { id: 'ec-2', name: 'Office & Supplies' },
  { id: 'ec-3', name: 'Marketing & Ads' },
  { id: 'ec-4', name: 'Travel & Transport' },
  { id: 'ec-5', name: 'Freelancers & Contractors' },
  { id: 'ec-6', name: 'Hosting & Infrastructure' },
  { id: 'ec-7', name: 'Training & Development' },
]

export const expenses = [
  { id: 'exp-1', expenseNumber: 'EXP-0001', vendorName: 'Vercel', category: { id: 'ec-6', name: 'Hosting & Infrastructure' }, amount: 1200, taxAmount: 0, totalAmount: 1200, currency: 'AED', expenseDate: daysAgo(5), paymentMethod: 'CREDIT_CARD', description: 'Pro plan - March', project: { id: 'prj-1', name: 'Al Futtaim E-Commerce Platform' }, status: 'APPROVED', createdBy: { id: '3', name: 'Omar Hassan' }, createdAt: daysAgo(5) },
  { id: 'exp-2', expenseNumber: 'EXP-0002', vendorName: 'OpenAI', category: { id: 'ec-1', name: 'Software & Tools' }, amount: 3500, taxAmount: 0, totalAmount: 3500, currency: 'AED', expenseDate: daysAgo(3), paymentMethod: 'CREDIT_CARD', description: 'GPT-4 API usage - March', project: { id: 'prj-2', name: 'Dubai Holding AI Chatbot' }, status: 'APPROVED', createdBy: { id: '4', name: 'Layla Mahmoud' }, createdAt: daysAgo(3) },
  { id: 'exp-3', expenseNumber: 'EXP-0003', vendorName: 'Figma', category: { id: 'ec-1', name: 'Software & Tools' }, amount: 550, taxAmount: 0, totalAmount: 550, currency: 'AED', expenseDate: daysAgo(15), paymentMethod: 'CREDIT_CARD', description: 'Team plan - monthly', project: null, status: 'PAID', createdBy: { id: '5', name: 'Ahmed Noor' }, createdAt: daysAgo(15) },
  { id: 'exp-4', expenseNumber: 'EXP-0004', vendorName: 'Meta Ads', category: { id: 'ec-3', name: 'Marketing & Ads' }, amount: 8000, taxAmount: 0, totalAmount: 8000, currency: 'AED', expenseDate: daysAgo(7), paymentMethod: 'CREDIT_CARD', description: 'DAMAC Instagram campaign spend', project: { id: 'prj-6', name: 'DAMAC Social Media Management' }, status: 'APPROVED', createdBy: { id: '4', name: 'Layla Mahmoud' }, createdAt: daysAgo(7) },
  { id: 'exp-5', expenseNumber: 'EXP-0005', vendorName: 'Ali Express Studio', category: { id: 'ec-5', name: 'Freelancers & Contractors' }, amount: 4500, taxAmount: 225, totalAmount: 4725, currency: 'AED', expenseDate: daysAgo(10), paymentMethod: 'BANK_TRANSFER', description: 'Freelance video editing for DAMAC content', project: { id: 'prj-6', name: 'DAMAC Social Media Management' }, status: 'PAID', createdBy: { id: '4', name: 'Layla Mahmoud' }, createdAt: daysAgo(10) },
  { id: 'exp-6', expenseNumber: 'EXP-0006', vendorName: 'Ahrefs', category: { id: 'ec-1', name: 'Software & Tools' }, amount: 1800, taxAmount: 0, totalAmount: 1800, currency: 'AED', expenseDate: daysAgo(12), paymentMethod: 'CREDIT_CARD', description: 'SEO tool subscription', project: { id: 'prj-4', name: 'Noon SEO Optimization' }, status: 'APPROVED', createdBy: { id: '5', name: 'Ahmed Noor' }, createdAt: daysAgo(12) },
  { id: 'exp-7', expenseNumber: 'EXP-0007', vendorName: 'Emirates Airlines', category: { id: 'ec-4', name: 'Travel & Transport' }, amount: 2800, taxAmount: 0, totalAmount: 2800, currency: 'AED', expenseDate: daysAgo(20), paymentMethod: 'CREDIT_CARD', description: 'Dubai-Riyadh round trip - STC meeting', project: { id: 'prj-8', name: 'STC CRM Integration' }, status: 'APPROVED', createdBy: { id: '2', name: 'Sarah Al-Rashid' }, createdAt: daysAgo(20) },
  { id: 'exp-8', expenseNumber: 'EXP-0008', vendorName: 'WeWork', category: { id: 'ec-2', name: 'Office & Supplies' }, amount: 6500, taxAmount: 325, totalAmount: 6825, currency: 'AED', expenseDate: daysAgo(1), paymentMethod: 'BANK_TRANSFER', description: 'Co-working space - April', project: null, status: 'PENDING', createdBy: { id: '1', name: 'Abdelrhman Elwakeel' }, createdAt: daysAgo(1) },
  { id: 'exp-9', expenseNumber: 'EXP-0009', vendorName: 'Coursera', category: { id: 'ec-7', name: 'Training & Development' }, amount: 1500, taxAmount: 0, totalAmount: 1500, currency: 'AED', expenseDate: daysAgo(25), paymentMethod: 'CREDIT_CARD', description: 'AI/ML certification for team', project: null, status: 'PAID', createdBy: { id: '1', name: 'Abdelrhman Elwakeel' }, createdAt: daysAgo(25) },
  { id: 'exp-10', expenseNumber: 'EXP-0010', vendorName: 'Google Cloud', category: { id: 'ec-6', name: 'Hosting & Infrastructure' }, amount: 2200, taxAmount: 0, totalAmount: 2200, currency: 'AED', expenseDate: daysAgo(8), paymentMethod: 'CREDIT_CARD', description: 'GCP usage - AI workloads', project: { id: 'prj-2', name: 'Dubai Holding AI Chatbot' }, status: 'APPROVED', createdBy: { id: '3', name: 'Omar Hassan' }, createdAt: daysAgo(8) },
]
