const now = Date.now()
const daysAgo = (n: number) => new Date(now - n * 86400000).toISOString()
const hoursAgo = (n: number) => new Date(now - n * 3600000).toISOString()

export const leadSources = [
  { id: 'src-1', name: 'Website' },
  { id: 'src-2', name: 'WhatsApp' },
  { id: 'src-3', name: 'LinkedIn' },
  { id: 'src-4', name: 'Referral' },
  { id: 'src-5', name: 'Cold Call' },
  { id: 'src-6', name: 'Instagram' },
  { id: 'src-7', name: 'Google Ads' },
  { id: 'src-8', name: 'Event' },
  { id: 'src-9', name: 'Partner' },
  { id: 'src-10', name: 'Direct' },
]

export const leadStages = [
  { id: 'ls-1', name: 'New', color: '#6366F1', order: 1 },
  { id: 'ls-2', name: 'Contacted', color: '#8B5CF6', order: 2 },
  { id: 'ls-3', name: 'Qualified', color: '#3B82F6', order: 3 },
  { id: 'ls-4', name: 'Meeting Scheduled', color: '#06B6D4', order: 4 },
  { id: 'ls-5', name: 'Proposal Sent', color: '#10B981', order: 5 },
  { id: 'ls-6', name: 'Won', color: '#22C55E', order: 6 },
  { id: 'ls-7', name: 'Lost', color: '#EF4444', order: 7 },
  { id: 'ls-8', name: 'Nurture', color: '#F59E0B', order: 8 },
  { id: 'ls-9', name: 'Disqualified', color: '#6B7280', order: 9 },
]

export const lostReasons = [
  { id: 'lr-1', name: 'Budget constraints' },
  { id: 'lr-2', name: 'Went with competitor' },
  { id: 'lr-3', name: 'No response' },
  { id: 'lr-4', name: 'Timing not right' },
  { id: 'lr-5', name: 'Requirements changed' },
  { id: 'lr-6', name: 'Internal decision' },
  { id: 'lr-7', name: 'Bad fit / Not qualified' },
  { id: 'lr-8', name: 'Other' },
]

export const leads = [
  { id: 'ld-1', leadNumber: 'LD-0001', fullName: 'Tariq Al-Muhairi', companyName: 'Emirates NBD', email: 'tariq@enbd.ae', phone: '+97150001001', source: 'Website', stage: 'New', stageId: 'ls-1', assignedTo: { id: '3', name: 'Omar Hassan' }, urgency: 'HIGH', score: 75, interestedService: 'AI Chatbot', budgetRange: '15,000-25,000 AED', country: 'UAE', city: 'Dubai', createdAt: daysAgo(1), nextFollowUpAt: hoursAgo(-2) },
  { id: 'ld-2', leadNumber: 'LD-0002', fullName: 'Nadia Bakri', companyName: 'Chalhoub Group', email: 'nadia@chalhoub.com', phone: '+97150001002', source: 'LinkedIn', stage: 'Contacted', stageId: 'ls-2', assignedTo: { id: '2', name: 'Sarah Al-Rashid' }, urgency: 'MEDIUM', score: 60, interestedService: 'E-Commerce Store', budgetRange: '20,000-40,000 AED', country: 'UAE', city: 'Dubai', createdAt: daysAgo(3), lastContactedAt: daysAgo(1), nextFollowUpAt: daysAgo(-1) },
  { id: 'ld-3', leadNumber: 'LD-0003', fullName: 'Salman Al-Dosari', companyName: 'ACME Corp KSA', email: 'salman@acme.sa', phone: '+966501112244', source: 'Referral', stage: 'Qualified', stageId: 'ls-3', assignedTo: { id: '3', name: 'Omar Hassan' }, urgency: 'HIGH', score: 85, interestedService: 'Custom AI Solution', budgetRange: '50,000-100,000 AED', country: 'KSA', city: 'Riyadh', createdAt: daysAgo(7), lastContactedAt: daysAgo(2) },
  { id: 'ld-4', leadNumber: 'LD-0004', fullName: 'Reem Al-Falasi', companyName: 'Etisalat', email: 'reem@etisalat.ae', phone: '+97150001004', source: 'WhatsApp', stage: 'Meeting Scheduled', stageId: 'ls-4', assignedTo: { id: '2', name: 'Sarah Al-Rashid' }, urgency: 'URGENT', score: 90, interestedService: 'AI Agent Workflow', budgetRange: '25,000-50,000 AED', country: 'UAE', city: 'Dubai', createdAt: daysAgo(5), lastContactedAt: daysAgo(0), nextFollowUpAt: daysAgo(-3) },
  { id: 'ld-5', leadNumber: 'LD-0005', fullName: 'Hamad Al-Shamsi', companyName: 'Abu Dhabi Ports', email: 'hamad@adports.ae', phone: '+97150001005', source: 'Event', stage: 'Proposal Sent', stageId: 'ls-5', assignedTo: { id: '5', name: 'Ahmed Noor' }, urgency: 'HIGH', score: 80, interestedService: 'Corporate Website', budgetRange: '10,000-20,000 AED', country: 'UAE', city: 'Abu Dhabi', createdAt: daysAgo(12), lastContactedAt: daysAgo(3) },
  { id: 'ld-6', leadNumber: 'LD-0006', fullName: 'Diana Haddad', companyName: null, email: 'diana.h@gmail.com', phone: '+97150001006', source: 'Instagram', stage: 'New', stageId: 'ls-1', assignedTo: null, urgency: 'LOW', score: 20, interestedService: 'Landing Page', budgetRange: '2,000-5,000 AED', country: 'UAE', city: 'Dubai', createdAt: daysAgo(0) },
  { id: 'ld-7', leadNumber: 'LD-0007', fullName: 'Faisal Al-Qahtani', companyName: 'Tamara Fintech', email: 'faisal@tamara.co', phone: '+966502223344', source: 'Google Ads', stage: 'Contacted', stageId: 'ls-2', assignedTo: { id: '3', name: 'Omar Hassan' }, urgency: 'MEDIUM', score: 55, interestedService: 'CRM Automation', budgetRange: '10,000-20,000 AED', country: 'KSA', city: 'Riyadh', createdAt: daysAgo(2), lastContactedAt: daysAgo(1) },
  { id: 'ld-8', leadNumber: 'LD-0008', fullName: 'Lina Sarkis', companyName: 'Bayt.com', email: 'lina@bayt.com', phone: '+97150001008', source: 'LinkedIn', stage: 'Qualified', stageId: 'ls-3', assignedTo: { id: '2', name: 'Sarah Al-Rashid' }, urgency: 'MEDIUM', score: 65, interestedService: 'SEO Optimization', budgetRange: '4,000-8,000 AED/mo', country: 'UAE', city: 'Dubai', createdAt: daysAgo(10), lastContactedAt: daysAgo(4) },
  { id: 'ld-9', leadNumber: 'LD-0009', fullName: 'Karim Sayed', companyName: 'Delivery Hero MENA', email: 'karim@dh.com', phone: '+97150001009', source: 'Referral', stage: 'New', stageId: 'ls-1', assignedTo: { id: '5', name: 'Ahmed Noor' }, urgency: 'HIGH', score: 70, interestedService: 'WhatsApp Business API', budgetRange: '3,000-5,000 AED/mo', country: 'UAE', city: 'Dubai', createdAt: hoursAgo(6) },
  { id: 'ld-10', leadNumber: 'LD-0010', fullName: 'Mona Al-Harbi', companyName: 'Tabby', email: 'mona@tabby.ai', phone: '+97150001010', source: 'Website', stage: 'Won', stageId: 'ls-6', assignedTo: { id: '2', name: 'Sarah Al-Rashid' }, urgency: 'HIGH', score: 95, interestedService: 'AI Chatbot', budgetRange: '15,000-25,000 AED', country: 'UAE', city: 'Dubai', createdAt: daysAgo(21), convertedAt: daysAgo(7), lastContactedAt: daysAgo(7) },
  { id: 'ld-11', leadNumber: 'LD-0011', fullName: 'Jassim Al-Thani', companyName: 'Qatar Tourism', email: 'jassim@qt.qa', phone: '+97444001001', source: 'Cold Call', stage: 'Lost', stageId: 'ls-7', assignedTo: { id: '3', name: 'Omar Hassan' }, urgency: 'MEDIUM', score: 40, interestedService: 'Social Media Management', budgetRange: '5,000-10,000 AED/mo', country: 'Qatar', city: 'Doha', createdAt: daysAgo(30), lostAt: daysAgo(10), lostReason: 'Budget constraints' },
  { id: 'ld-12', leadNumber: 'LD-0012', fullName: 'Amal Al-Sulaiti', companyName: 'Fetchr', email: 'amal@fetchr.us', phone: '+97150001012', source: 'WhatsApp', stage: 'Contacted', stageId: 'ls-2', assignedTo: null, urgency: 'LOW', score: 30, interestedService: 'Logo Design', budgetRange: '3,000-5,000 AED', country: 'UAE', city: 'Dubai', createdAt: daysAgo(4), lastContactedAt: daysAgo(3) },
  { id: 'ld-13', leadNumber: 'LD-0013', fullName: 'Sultan Al-Kendi', companyName: 'Masdar', email: 'sultan@masdar.ae', phone: '+97150001013', source: 'Event', stage: 'New', stageId: 'ls-1', assignedTo: { id: '5', name: 'Ahmed Noor' }, urgency: 'MEDIUM', score: 50, interestedService: 'Corporate Website', budgetRange: '12,000-18,000 AED', country: 'UAE', city: 'Abu Dhabi', createdAt: daysAgo(0) },
  { id: 'ld-14', leadNumber: 'LD-0014', fullName: 'Yousef Al-Balushi', companyName: 'Omantel', email: 'yousef@omantel.om', phone: '+96899001001', source: 'Partner', stage: 'Qualified', stageId: 'ls-3', assignedTo: { id: '3', name: 'Omar Hassan' }, urgency: 'HIGH', score: 78, interestedService: 'AI Agent Workflow', budgetRange: '25,000-40,000 AED', country: 'Oman', city: 'Muscat', createdAt: daysAgo(8) },
  { id: 'ld-15', leadNumber: 'LD-0015', fullName: 'Zara Sheikh', companyName: 'Souq Planet', email: 'zara@souqplanet.ae', phone: '+97150001015', source: 'Direct', stage: 'Meeting Scheduled', stageId: 'ls-4', assignedTo: { id: '2', name: 'Sarah Al-Rashid' }, urgency: 'MEDIUM', score: 65, interestedService: 'Social Media Management', budgetRange: '5,000-8,000 AED/mo', country: 'UAE', city: 'Dubai', createdAt: daysAgo(6), lastContactedAt: daysAgo(1) },
]
