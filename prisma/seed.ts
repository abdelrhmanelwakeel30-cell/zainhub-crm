import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data
  await prisma.$transaction([
    prisma.activity.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.tagRelation.deleteMany(),
    prisma.tag.deleteMany(),
    prisma.customFieldValue.deleteMany(),
    prisma.customField.deleteMany(),
    prisma.contentApproval.deleteMany(),
    prisma.contentItem.deleteMany(),
    prisma.socialAccount.deleteMany(),
    prisma.ticketComment.deleteMany(),
    prisma.ticket.deleteMany(),
    prisma.taskWatcher.deleteMany(),
    prisma.taskComment.deleteMany(),
    prisma.task.deleteMany(),
    prisma.timeEntry.deleteMany(),
    prisma.projectMilestone.deleteMany(),
    prisma.projectMember.deleteMany(),
    prisma.project.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.invoiceItem.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.expense.deleteMany(),
    prisma.contract.deleteMany(),
    prisma.proposalItem.deleteMany(),
    prisma.proposal.deleteMany(),
    prisma.quotationItem.deleteMany(),
    prisma.quotation.deleteMany(),
    prisma.opportunityService.deleteMany(),
    prisma.opportunity.deleteMany(),
    prisma.lead.deleteMany(),
    prisma.companyContact.deleteMany(),
    prisma.contact.deleteMany(),
    prisma.company.deleteMany(),
    prisma.campaign.deleteMany(),
    prisma.document.deleteMany(),
    prisma.savedFilter.deleteMany(),
    prisma.setting.deleteMany(),
    prisma.automationRule.deleteMany(),
    prisma.onboardingTemplate.deleteMany(),
    prisma.servicePackage.deleteMany(),
    prisma.service.deleteMany(),
    prisma.serviceCategory.deleteMany(),
    prisma.pipelineStage.deleteMany(),
    prisma.pipeline.deleteMany(),
    prisma.lostReason.deleteMany(),
    prisma.leadSource.deleteMany(),
    prisma.taxRate.deleteMany(),
    prisma.expenseCategory.deleteMany(),
    prisma.userRole.deleteMany(),
    prisma.rolePermission.deleteMany(),
    prisma.permission.deleteMany(),
    prisma.role.deleteMany(),
    prisma.user.deleteMany(),
    prisma.tenant.deleteMany(),
  ])

  // ============================================================================
  // 1. TENANT
  // ============================================================================
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Zain Hub AI Solutions',
      slug: 'zainhub',
      primaryColor: '#1E40AF',
      secondaryColor: '#3B82F6',
      defaultCurrency: 'AED',
      defaultLanguage: 'en',
      timezone: 'Asia/Dubai',
      email: 'hello@zainhub.ae',
      website: 'https://zainhub.ae',
      phone: '+971501234567',
      address: 'Dubai Internet City, Dubai, UAE',
      taxRegistrationNumber: 'TRN-100-123-456-789',
      plan: 'ENTERPRISE',
    },
  })

  // ============================================================================
  // 2. PERMISSIONS
  // ============================================================================
  const modules = [
    'dashboard', 'leads', 'companies', 'contacts', 'opportunities',
    'projects', 'tasks', 'quotations', 'proposals', 'contracts',
    'invoices', 'payments', 'expenses', 'tickets', 'social_media',
    'campaigns', 'documents', 'reports', 'users', 'roles', 'settings', 'audit_log',
  ]
  const actions = ['view', 'create', 'edit', 'delete', 'export', 'approve']

  const permissions = []
  for (const module of modules) {
    for (const action of actions) {
      const perm = await prisma.permission.create({
        data: { module, action, description: `${action} ${module}` },
      })
      permissions.push(perm)
    }
  }

  // ============================================================================
  // 3. ROLES
  // ============================================================================
  const superAdminRole = await prisma.role.create({
    data: {
      tenantId: tenant.id,
      name: 'Super Admin',
      nameAr: 'مدير النظام',
      description: 'Full system access',
      isSystem: true,
    },
  })

  const managerRole = await prisma.role.create({
    data: {
      tenantId: tenant.id,
      name: 'Manager',
      nameAr: 'مدير',
      description: 'Team and department management',
      isSystem: true,
    },
  })

  const salesRole = await prisma.role.create({
    data: {
      tenantId: tenant.id,
      name: 'Sales Rep',
      nameAr: 'مندوب مبيعات',
      description: 'Sales and lead management',
      isSystem: true,
    },
  })

  const accountManagerRole = await prisma.role.create({
    data: {
      tenantId: tenant.id,
      name: 'Account Manager',
      nameAr: 'مدير حسابات',
      description: 'Client relationship management',
      isSystem: true,
    },
  })

  const viewerRole = await prisma.role.create({
    data: {
      tenantId: tenant.id,
      name: 'Viewer',
      nameAr: 'مشاهد',
      description: 'Read-only access',
      isSystem: true,
    },
  })

  // Assign all permissions to Super Admin
  for (const perm of permissions) {
    await prisma.rolePermission.create({
      data: { roleId: superAdminRole.id, permissionId: perm.id },
    })
  }

  // Assign view/create/edit/export permissions to Manager (all modules)
  for (const perm of permissions.filter(p => ['view', 'create', 'edit', 'export'].includes(p.action))) {
    await prisma.rolePermission.create({
      data: { roleId: managerRole.id, permissionId: perm.id },
    })
  }

  // Assign CRM permissions to Sales Rep
  const salesModules = ['dashboard', 'leads', 'companies', 'contacts', 'opportunities', 'quotations', 'tasks']
  for (const perm of permissions.filter(p => salesModules.includes(p.module) && ['view', 'create', 'edit'].includes(p.action))) {
    await prisma.rolePermission.create({
      data: { roleId: salesRole.id, permissionId: perm.id },
    })
  }

  // Assign view permissions to Viewer
  for (const perm of permissions.filter(p => p.action === 'view')) {
    await prisma.rolePermission.create({
      data: { roleId: viewerRole.id, permissionId: perm.id },
    })
  }

  // ============================================================================
  // 4. USERS
  // ============================================================================
  const passwordHash = await bcrypt.hash('admin123', 12)

  const admin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'admin@zainhub.ae',
      passwordHash,
      firstName: 'Abdelrhman',
      lastName: 'Elwakeel',
      jobTitle: 'CEO & Founder',
      department: 'Management',
      status: 'ACTIVE',
      preferredLanguage: 'en',
    },
  })
  await prisma.userRole.create({ data: { userId: admin.id, roleId: superAdminRole.id } })

  const sarah = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'sarah@zainhub.ae',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Al-Rashid',
      jobTitle: 'Sales Director',
      department: 'Sales',
      status: 'ACTIVE',
      preferredLanguage: 'en',
    },
  })
  await prisma.userRole.create({ data: { userId: sarah.id, roleId: managerRole.id } })

  const omar = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'omar@zainhub.ae',
      passwordHash,
      firstName: 'Omar',
      lastName: 'Hassan',
      jobTitle: 'Senior Sales Rep',
      department: 'Sales',
      status: 'ACTIVE',
      preferredLanguage: 'ar',
    },
  })
  await prisma.userRole.create({ data: { userId: omar.id, roleId: salesRole.id } })

  const layla = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'layla@zainhub.ae',
      passwordHash,
      firstName: 'Layla',
      lastName: 'Mahmoud',
      jobTitle: 'Account Manager',
      department: 'Client Success',
      status: 'ACTIVE',
      preferredLanguage: 'en',
    },
  })
  await prisma.userRole.create({ data: { userId: layla.id, roleId: accountManagerRole.id } })

  const ahmed = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'ahmed@zainhub.ae',
      passwordHash,
      firstName: 'Ahmed',
      lastName: 'Noor',
      jobTitle: 'Junior Sales Rep',
      department: 'Sales',
      status: 'ACTIVE',
      preferredLanguage: 'ar',
    },
  })
  await prisma.userRole.create({ data: { userId: ahmed.id, roleId: salesRole.id } })

  // ============================================================================
  // 5. LEAD SOURCES
  // ============================================================================
  const sources = [
    { name: 'Website', nameAr: 'الموقع الإلكتروني', isActive: true },
    { name: 'WhatsApp', nameAr: 'واتساب', isActive: true },
    { name: 'LinkedIn', nameAr: 'لينكد إن', isActive: true },
    { name: 'Referral', nameAr: 'إحالة', isActive: true },
    { name: 'Cold Call', nameAr: 'اتصال بارد', isActive: true },
    { name: 'Instagram', nameAr: 'إنستغرام', isActive: true },
    { name: 'Google Ads', nameAr: 'إعلانات جوجل', isActive: true },
    { name: 'Event', nameAr: 'فعالية', isActive: true },
    { name: 'Partner', nameAr: 'شريك', isActive: true },
    { name: 'Direct', nameAr: 'مباشر', isActive: true },
  ]
  const leadSources: Record<string, any> = {}
  for (const s of sources) {
    leadSources[s.name] = await prisma.leadSource.create({
      data: { tenantId: tenant.id, ...s },
    })
  }

  // ============================================================================
  // 6. LOST REASONS
  // ============================================================================
  const lostReasons = [
    { name: 'Budget too high', nameAr: 'الميزانية مرتفعة', entityType: 'lead' },
    { name: 'Chose competitor', nameAr: 'اختار المنافس', entityType: 'lead' },
    { name: 'No response', nameAr: 'لا استجابة', entityType: 'lead' },
    { name: 'Timeline mismatch', nameAr: 'عدم توافق الجدول الزمني', entityType: 'lead' },
    { name: 'Scope too small', nameAr: 'نطاق العمل صغير جداً', entityType: 'lead' },
    { name: 'Internal change', nameAr: 'تغيير داخلي', entityType: 'lead' },
    { name: 'Budget too high', nameAr: 'الميزانية مرتفعة', entityType: 'opportunity' },
    { name: 'Chose competitor', nameAr: 'اختار المنافس', entityType: 'opportunity' },
    { name: 'No response', nameAr: 'لا استجابة', entityType: 'opportunity' },
    { name: 'Timeline mismatch', nameAr: 'عدم توافق الجدول الزمني', entityType: 'opportunity' },
    { name: 'Scope too small', nameAr: 'نطاق العمل صغير جداً', entityType: 'opportunity' },
    { name: 'Internal change', nameAr: 'تغيير داخلي', entityType: 'opportunity' },
  ]
  for (const lr of lostReasons) {
    await prisma.lostReason.create({ data: { tenantId: tenant.id, ...lr } })
  }

  // ============================================================================
  // 7. SERVICE CATEGORIES & SERVICES
  // ============================================================================
  const categories = [
    {
      name: 'AI Solutions', nameAr: 'حلول الذكاء الاصطناعي',
      services: [
        { name: 'AI Chatbot', nameAr: 'روبوت محادثة ذكي', pricingType: 'PROJECT_BASED' as const, basePrice: 15000 },
        { name: 'AI Agent Workflow', nameAr: 'سير عمل الوكيل الذكي', pricingType: 'PROJECT_BASED' as const, basePrice: 25000 },
        { name: 'Custom AI Solution', nameAr: 'حل ذكاء اصطناعي مخصص', pricingType: 'CUSTOM' as const, basePrice: 50000 },
        { name: 'RAG Knowledge Bot', nameAr: 'روبوت المعرفة RAG', pricingType: 'PROJECT_BASED' as const, basePrice: 20000 },
      ],
    },
    {
      name: 'Website Design', nameAr: 'تصميم المواقع',
      services: [
        { name: 'Corporate Website', nameAr: 'موقع مؤسسي', pricingType: 'FIXED' as const, basePrice: 12000 },
        { name: 'E-Commerce Store', nameAr: 'متجر إلكتروني', pricingType: 'FIXED' as const, basePrice: 20000 },
        { name: 'Landing Page', nameAr: 'صفحة هبوط', pricingType: 'FIXED' as const, basePrice: 3000 },
      ],
    },
    {
      name: 'Social Media', nameAr: 'التواصل الاجتماعي',
      services: [
        { name: 'Social Media Management', nameAr: 'إدارة التواصل الاجتماعي', pricingType: 'MONTHLY' as const, basePrice: 5000 },
        { name: 'Content Production', nameAr: 'إنتاج المحتوى', pricingType: 'MONTHLY' as const, basePrice: 8000 },
        { name: 'Influencer Marketing', nameAr: 'تسويق المؤثرين', pricingType: 'PROJECT_BASED' as const, basePrice: 15000 },
      ],
    },
    {
      name: 'Automation & Integration', nameAr: 'الأتمتة والتكامل',
      services: [
        { name: 'CRM Automation', nameAr: 'أتمتة CRM', pricingType: 'PROJECT_BASED' as const, basePrice: 10000 },
        { name: 'WhatsApp Business API', nameAr: 'واتساب بزنس API', pricingType: 'MONTHLY' as const, basePrice: 3000 },
        { name: 'Zapier/n8n Workflows', nameAr: 'سير عمل آلي', pricingType: 'HOURLY' as const, basePrice: 500 },
      ],
    },
    {
      name: 'Branding & Creative', nameAr: 'العلامة التجارية والإبداع',
      services: [
        { name: 'Brand Identity', nameAr: 'هوية العلامة التجارية', pricingType: 'FIXED' as const, basePrice: 8000 },
        { name: 'Logo Design', nameAr: 'تصميم الشعار', pricingType: 'FIXED' as const, basePrice: 3000 },
        { name: 'Marketing Collateral', nameAr: 'مواد تسويقية', pricingType: 'PROJECT_BASED' as const, basePrice: 5000 },
      ],
    },
    {
      name: 'SEO & Marketing', nameAr: 'تحسين محركات البحث والتسويق',
      services: [
        { name: 'SEO Optimization', nameAr: 'تحسين محركات البحث', pricingType: 'MONTHLY' as const, basePrice: 4000 },
        { name: 'Google Ads Management', nameAr: 'إدارة إعلانات جوجل', pricingType: 'MONTHLY' as const, basePrice: 3000 },
        { name: 'Email Marketing', nameAr: 'التسويق عبر البريد', pricingType: 'MONTHLY' as const, basePrice: 2000 },
      ],
    },
  ]

  const serviceMap: Record<string, any> = {}
  for (const cat of categories) {
    const category = await prisma.serviceCategory.create({
      data: {
        tenantId: tenant.id,
        name: cat.name,
        nameAr: cat.nameAr,
        isActive: true,
      },
    })
    for (const svc of cat.services) {
      serviceMap[svc.name] = await prisma.service.create({
        data: {
          tenantId: tenant.id,
          categoryId: category.id,
          name: svc.name,
          nameAr: svc.nameAr,
          pricingType: svc.pricingType,
          basePrice: svc.basePrice,
          currency: 'AED',
          isActive: true,
        },
      })
    }
  }

  // ============================================================================
  // 8. PIPELINES
  // ============================================================================
  const leadPipeline = await prisma.pipeline.create({
    data: {
      tenantId: tenant.id,
      name: 'Default Lead Pipeline',
      nameAr: 'مسار العملاء المحتملين',
      entityType: 'LEAD',
      isDefault: true,
    },
  })

  const leadStages = [
    { name: 'New', nameAr: 'جديد', order: 1, color: '#6366F1', probability: 10 },
    { name: 'Contacted', nameAr: 'تم التواصل', order: 2, color: '#8B5CF6', probability: 20 },
    { name: 'Qualified', nameAr: 'مؤهل', order: 3, color: '#3B82F6', probability: 40 },
    { name: 'Meeting Scheduled', nameAr: 'اجتماع مجدول', order: 4, color: '#06B6D4', probability: 60 },
    { name: 'Proposal Sent', nameAr: 'تم إرسال العرض', order: 5, color: '#10B981', probability: 75 },
    { name: 'Won', nameAr: 'مكسوب', order: 6, color: '#22C55E', probability: 100, isWon: true, isClosed: true },
    { name: 'Lost', nameAr: 'خسارة', order: 7, color: '#EF4444', probability: 0, isLost: true, isClosed: true },
  ]

  const leadStageMap: Record<string, any> = {}
  for (const stage of leadStages) {
    leadStageMap[stage.name] = await prisma.pipelineStage.create({
      data: { pipelineId: leadPipeline.id, ...stage },
    })
  }

  const oppPipeline = await prisma.pipeline.create({
    data: {
      tenantId: tenant.id,
      name: 'Sales Pipeline',
      nameAr: 'مسار المبيعات',
      entityType: 'OPPORTUNITY',
      isDefault: true,
    },
  })

  const oppStages = [
    { name: 'Discovery', nameAr: 'اكتشاف', order: 1, color: '#6366F1', probability: 10 },
    { name: 'Proposal', nameAr: 'عرض سعر', order: 2, color: '#8B5CF6', probability: 30 },
    { name: 'Negotiation', nameAr: 'تفاوض', order: 3, color: '#3B82F6', probability: 60 },
    { name: 'Contract', nameAr: 'عقد', order: 4, color: '#06B6D4', probability: 80 },
    { name: 'Closed Won', nameAr: 'مغلقة - مكسوبة', order: 5, color: '#22C55E', probability: 100, isWon: true, isClosed: true },
    { name: 'Closed Lost', nameAr: 'مغلقة - خسارة', order: 6, color: '#EF4444', probability: 0, isLost: true, isClosed: true },
  ]

  const oppStageMap: Record<string, any> = {}
  for (const stage of oppStages) {
    oppStageMap[stage.name] = await prisma.pipelineStage.create({
      data: { pipelineId: oppPipeline.id, ...stage },
    })
  }

  // ============================================================================
  // 9. COMPANIES
  // ============================================================================
  const companiesData = [
    { companyNumber: 'COM-0001', legalName: 'Al Futtaim Group', displayName: 'Al Futtaim', industry: 'Retail & Real Estate', country: 'UAE', city: 'Dubai', lifecycleStage: 'CUSTOMER' as const, healthScore: 85, employeeCount: 15000, annualRevenue: 5000000, accountOwnerId: sarah.id },
    { companyNumber: 'COM-0002', legalName: 'Dubai Holding LLC', displayName: 'Dubai Holding', industry: 'Conglomerate', country: 'UAE', city: 'Dubai', lifecycleStage: 'CUSTOMER' as const, healthScore: 92, employeeCount: 20000, annualRevenue: 10000000, accountOwnerId: sarah.id },
    { companyNumber: 'COM-0003', legalName: 'Noon Payments DMCC', displayName: 'Noon', industry: 'E-Commerce', country: 'UAE', city: 'Dubai', lifecycleStage: 'PROSPECT' as const, healthScore: 60, employeeCount: 5000, annualRevenue: 2000000, accountOwnerId: layla.id },
    { companyNumber: 'COM-0004', legalName: 'Careem Networks FZ-LLC', displayName: 'Careem', industry: 'Technology', country: 'UAE', city: 'Dubai', lifecycleStage: 'LEAD' as const, healthScore: 40, employeeCount: 3000, annualRevenue: null, accountOwnerId: omar.id },
    { companyNumber: 'COM-0005', legalName: 'Majid Al Futtaim Holding', displayName: 'MAF', industry: 'Retail & Entertainment', country: 'UAE', city: 'Dubai', lifecycleStage: 'CUSTOMER' as const, healthScore: 78, employeeCount: 40000, annualRevenue: 8000000, accountOwnerId: layla.id },
    { companyNumber: 'COM-0006', legalName: 'DAMAC Properties PJSC', displayName: 'DAMAC', industry: 'Real Estate', country: 'UAE', city: 'Dubai', lifecycleStage: 'PROSPECT' as const, healthScore: 55, employeeCount: 8000, annualRevenue: null, accountOwnerId: ahmed.id },
    { companyNumber: 'COM-0007', legalName: 'Arabian Adventures LLC', displayName: 'Arabian Adventures', industry: 'Tourism', country: 'UAE', city: 'Dubai', lifecycleStage: 'CUSTOMER' as const, healthScore: 70, employeeCount: 500, annualRevenue: 1500000, accountOwnerId: omar.id },
    { companyNumber: 'COM-0008', legalName: 'STC Group', displayName: 'STC', industry: 'Telecommunications', country: 'KSA', city: 'Riyadh', lifecycleStage: 'LEAD' as const, healthScore: 30, employeeCount: 22000, annualRevenue: null, accountOwnerId: sarah.id },
    { companyNumber: 'COM-0009', legalName: 'Kitopi DMCC', displayName: 'Kitopi', industry: 'FoodTech', country: 'UAE', city: 'Dubai', lifecycleStage: 'PROSPECT' as const, healthScore: 50, employeeCount: 2000, annualRevenue: null, accountOwnerId: ahmed.id },
    { companyNumber: 'COM-0010', legalName: 'Property Finder FZ-LLC', displayName: 'Property Finder', industry: 'PropTech', country: 'UAE', city: 'Dubai', lifecycleStage: 'CUSTOMER' as const, healthScore: 88, employeeCount: 600, annualRevenue: 3000000, accountOwnerId: layla.id },
  ]

  const companyRecords: Record<string, any> = {}
  for (const c of companiesData) {
    companyRecords[c.displayName] = await prisma.company.create({
      data: {
        tenantId: tenant.id,
        companyNumber: c.companyNumber,
        legalName: c.legalName,
        displayName: c.displayName,
        industry: c.industry,
        country: c.country,
        city: c.city,
        lifecycleStage: c.lifecycleStage,
        healthScore: c.healthScore,
        employeeCount: c.employeeCount,
        annualRevenue: c.annualRevenue,
        accountOwnerId: c.accountOwnerId,
      },
    })
  }

  // ============================================================================
  // 10. CONTACTS
  // ============================================================================
  const contactsData = [
    { contactNumber: 'CON-0001', firstName: 'Mohammed', lastName: 'Al-Rashidi', email: 'mohammed@alfuttaim.ae', phone: '+97150111222', jobTitle: 'Head of Digital', decisionRole: 'DECISION_MAKER' as const, companyKey: 'Al Futtaim' },
    { contactNumber: 'CON-0002', firstName: 'Fatima', lastName: 'Al-Zaabi', email: 'fatima@dubaiholding.ae', phone: '+97150222333', jobTitle: 'VP Marketing', decisionRole: 'DECISION_MAKER' as const, companyKey: 'Dubai Holding' },
    { contactNumber: 'CON-0003', firstName: 'Ali', lastName: 'Kazmi', email: 'ali@noon.com', phone: '+97150333444', jobTitle: 'CTO', decisionRole: 'INFLUENCER' as const, companyKey: 'Noon' },
    { contactNumber: 'CON-0004', firstName: 'Hind', lastName: 'Al-Mansoori', email: 'hind@careem.com', phone: '+97150444555', jobTitle: 'Product Director', decisionRole: 'INFLUENCER' as const, companyKey: 'Careem' },
    { contactNumber: 'CON-0005', firstName: 'Khalid', lastName: 'Bin Saeed', email: 'khalid@maf.ae', phone: '+97150555666', jobTitle: 'CMO', decisionRole: 'DECISION_MAKER' as const, companyKey: 'MAF' },
    { contactNumber: 'CON-0006', firstName: 'Noura', lastName: 'Al-Hashmi', email: 'noura@damac.ae', phone: '+97150666777', jobTitle: 'Digital Marketing Manager', decisionRole: 'USER' as const, companyKey: 'DAMAC' },
    { contactNumber: 'CON-0007', firstName: 'Rashid', lastName: 'Al-Maktoum', email: 'rashid@arabian.ae', phone: '+97150777888', jobTitle: 'General Manager', decisionRole: 'DECISION_MAKER' as const, companyKey: 'Arabian Adventures' },
    { contactNumber: 'CON-0008', firstName: 'Sara', lastName: 'Al-Otaibi', email: 'sara@stc.sa', phone: '+966501112233', jobTitle: 'Innovation Manager', decisionRole: 'CHAMPION' as const, companyKey: 'STC' },
    { contactNumber: 'CON-0009', firstName: 'Hassan', lastName: 'Mirza', email: 'hassan@kitopi.com', phone: '+97150888999', jobTitle: 'Head of Technology', decisionRole: 'INFLUENCER' as const, companyKey: 'Kitopi' },
    { contactNumber: 'CON-0010', firstName: 'Aisha', lastName: 'Al-Blooshi', email: 'aisha@propertyfinder.ae', phone: '+97150999000', jobTitle: 'Marketing Director', decisionRole: 'DECISION_MAKER' as const, companyKey: 'Property Finder' },
    { contactNumber: 'CON-0011', firstName: 'Yusuf', lastName: 'Khan', email: 'yusuf@alfuttaim.ae', phone: '+97155111222', jobTitle: 'IT Manager', decisionRole: 'USER' as const, companyKey: 'Al Futtaim' },
    { contactNumber: 'CON-0012', firstName: 'Mariam', lastName: 'Al-Suwaidi', email: 'mariam@dubaiholding.ae', phone: '+97155222333', jobTitle: 'Brand Manager', decisionRole: 'INFLUENCER' as const, companyKey: 'Dubai Holding' },
  ]

  const primaryContacts = ['CON-0001', 'CON-0002', 'CON-0003', 'CON-0004', 'CON-0005', 'CON-0006', 'CON-0007', 'CON-0008', 'CON-0009', 'CON-0010']

  const contactRecords: Record<string, any> = {}
  for (const c of contactsData) {
    const { companyKey, ...contactFields } = c
    contactRecords[c.contactNumber] = await prisma.contact.create({
      data: {
        tenantId: tenant.id,
        contactNumber: contactFields.contactNumber,
        firstName: contactFields.firstName,
        lastName: contactFields.lastName,
        email: contactFields.email,
        phone: contactFields.phone,
        jobTitle: contactFields.jobTitle,
        decisionRole: contactFields.decisionRole,
      },
    })
    // Link to company
    await prisma.companyContact.create({
      data: {
        companyId: companyRecords[companyKey].id,
        contactId: contactRecords[c.contactNumber].id,
        role: contactFields.jobTitle,
        isPrimary: primaryContacts.includes(c.contactNumber),
      },
    })
  }

  // ============================================================================
  // 11. LEADS
  // ============================================================================
  const now = new Date()
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000)
  const hoursAgo = (n: number) => new Date(now.getTime() - n * 3600000)

  const leadsData = [
    { leadNumber: 'LD-0001', fullName: 'Tariq Al-Muhairi', companyName: 'Emirates NBD', email: 'tariq@enbd.ae', phone: '+97150001001', sourceKey: 'Website', stageName: 'New', assignedToId: omar.id, urgency: 'HIGH' as const, score: 75, interestedServiceName: 'AI Chatbot', budgetRange: '15,000-25,000 AED', createdAt: daysAgo(1), nextFollowUpAt: hoursAgo(-2) },
    { leadNumber: 'LD-0002', fullName: 'Nadia Bakri', companyName: 'Chalhoub Group', email: 'nadia@chalhoub.com', phone: '+97150001002', sourceKey: 'LinkedIn', stageName: 'Contacted', assignedToId: sarah.id, urgency: 'MEDIUM' as const, score: 60, interestedServiceName: 'E-Commerce Store', budgetRange: '20,000-40,000 AED', createdAt: daysAgo(3), lastContactedAt: daysAgo(1), nextFollowUpAt: daysAgo(-1) },
    { leadNumber: 'LD-0003', fullName: 'Salman Al-Dosari', companyName: 'ACME Corp KSA', email: 'salman@acme.sa', phone: '+966501112244', sourceKey: 'Referral', stageName: 'Qualified', assignedToId: omar.id, urgency: 'HIGH' as const, score: 85, interestedServiceName: 'Custom AI Solution', budgetRange: '50,000-100,000 AED', country: 'KSA', city: 'Riyadh', createdAt: daysAgo(7), lastContactedAt: daysAgo(2) },
    { leadNumber: 'LD-0004', fullName: 'Reem Al-Falasi', companyName: 'Etisalat', email: 'reem@etisalat.ae', phone: '+97150001004', sourceKey: 'WhatsApp', stageName: 'Meeting Scheduled', assignedToId: sarah.id, urgency: 'URGENT' as const, score: 90, interestedServiceName: 'AI Agent Workflow', budgetRange: '25,000-50,000 AED', createdAt: daysAgo(5), lastContactedAt: daysAgo(0), nextFollowUpAt: daysAgo(-3) },
    { leadNumber: 'LD-0005', fullName: 'Hamad Al-Shamsi', companyName: 'Abu Dhabi Ports', email: 'hamad@adports.ae', phone: '+97150001005', sourceKey: 'Event', stageName: 'Proposal Sent', assignedToId: ahmed.id, urgency: 'HIGH' as const, score: 80, interestedServiceName: 'Corporate Website', budgetRange: '10,000-20,000 AED', createdAt: daysAgo(12), lastContactedAt: daysAgo(3) },
    { leadNumber: 'LD-0006', fullName: 'Diana Haddad', companyName: null, email: 'diana.h@gmail.com', phone: '+97150001006', sourceKey: 'Instagram', stageName: 'New', assignedToId: null, urgency: 'LOW' as const, score: 20, interestedServiceName: 'Landing Page', budgetRange: '2,000-5,000 AED', createdAt: daysAgo(0) },
    { leadNumber: 'LD-0007', fullName: 'Faisal Al-Qahtani', companyName: 'Tamara Fintech', email: 'faisal@tamara.co', phone: '+966502223344', sourceKey: 'Google Ads', stageName: 'Contacted', assignedToId: omar.id, urgency: 'MEDIUM' as const, score: 55, interestedServiceName: 'CRM Automation', budgetRange: '10,000-20,000 AED', country: 'KSA', city: 'Riyadh', createdAt: daysAgo(2), lastContactedAt: daysAgo(1) },
    { leadNumber: 'LD-0008', fullName: 'Lina Sarkis', companyName: 'Bayt.com', email: 'lina@bayt.com', phone: '+97150001008', sourceKey: 'LinkedIn', stageName: 'Qualified', assignedToId: sarah.id, urgency: 'MEDIUM' as const, score: 65, interestedServiceName: 'SEO Optimization', budgetRange: '4,000-8,000 AED/mo', createdAt: daysAgo(10), lastContactedAt: daysAgo(4) },
    { leadNumber: 'LD-0009', fullName: 'Karim Sayed', companyName: 'Delivery Hero MENA', email: 'karim@dh.com', phone: '+97150001009', sourceKey: 'Referral', stageName: 'New', assignedToId: ahmed.id, urgency: 'HIGH' as const, score: 70, interestedServiceName: 'WhatsApp Business API', budgetRange: '3,000-5,000 AED/mo', createdAt: hoursAgo(6) },
    { leadNumber: 'LD-0010', fullName: 'Mona Al-Harbi', companyName: 'Tabby', email: 'mona@tabby.ai', phone: '+97150001010', sourceKey: 'Website', stageName: 'Won', assignedToId: sarah.id, urgency: 'HIGH' as const, score: 95, interestedServiceName: 'AI Chatbot', budgetRange: '15,000-25,000 AED', createdAt: daysAgo(21), convertedAt: daysAgo(7), lastContactedAt: daysAgo(7) },
    { leadNumber: 'LD-0011', fullName: 'Jassim Al-Thani', companyName: 'Qatar Tourism', email: 'jassim@qt.qa', phone: '+97444001001', sourceKey: 'Cold Call', stageName: 'Lost', assignedToId: omar.id, urgency: 'MEDIUM' as const, score: 40, interestedServiceName: 'Social Media Management', budgetRange: '5,000-10,000 AED/mo', country: 'Qatar', city: 'Doha', createdAt: daysAgo(30), lostAt: daysAgo(10) },
    { leadNumber: 'LD-0012', fullName: 'Amal Al-Sulaiti', companyName: 'Fetchr', email: 'amal@fetchr.us', phone: '+97150001012', sourceKey: 'WhatsApp', stageName: 'Contacted', assignedToId: null, urgency: 'LOW' as const, score: 30, interestedServiceName: 'Logo Design', budgetRange: '3,000-5,000 AED', createdAt: daysAgo(4), lastContactedAt: daysAgo(3) },
    { leadNumber: 'LD-0013', fullName: 'Sultan Al-Kendi', companyName: 'Masdar', email: 'sultan@masdar.ae', phone: '+97150001013', sourceKey: 'Event', stageName: 'New', assignedToId: ahmed.id, urgency: 'MEDIUM' as const, score: 50, interestedServiceName: 'Corporate Website', budgetRange: '12,000-18,000 AED', createdAt: daysAgo(0) },
    { leadNumber: 'LD-0014', fullName: 'Yousef Al-Balushi', companyName: 'Omantel', email: 'yousef@omantel.om', phone: '+96899001001', sourceKey: 'Partner', stageName: 'Qualified', assignedToId: omar.id, urgency: 'HIGH' as const, score: 78, interestedServiceName: 'AI Agent Workflow', budgetRange: '25,000-40,000 AED', country: 'Oman', city: 'Muscat', createdAt: daysAgo(8) },
    { leadNumber: 'LD-0015', fullName: 'Zara Sheikh', companyName: 'Souq Planet', email: 'zara@souqplanet.ae', phone: '+97150001015', sourceKey: 'Direct', stageName: 'Meeting Scheduled', assignedToId: sarah.id, urgency: 'MEDIUM' as const, score: 65, interestedServiceName: 'Social Media Management', budgetRange: '5,000-8,000 AED/mo', createdAt: daysAgo(6), lastContactedAt: daysAgo(1) },
  ]

  for (const lead of leadsData) {
    const { sourceKey, stageName, interestedServiceName, ...leadData } = lead
    await prisma.lead.create({
      data: {
        tenantId: tenant.id,
        leadNumber: leadData.leadNumber,
        fullName: leadData.fullName,
        companyName: leadData.companyName,
        email: leadData.email,
        phone: leadData.phone,
        urgency: leadData.urgency,
        score: leadData.score,
        budgetRange: leadData.budgetRange,
        country: leadData.country || 'UAE',
        city: leadData.city || 'Dubai',
        assignedToId: leadData.assignedToId,
        createdById: leadData.assignedToId || admin.id,
        createdAt: leadData.createdAt,
        nextFollowUpAt: leadData.nextFollowUpAt || null,
        lastContactedAt: leadData.lastContactedAt || null,
        convertedAt: leadData.convertedAt || null,
        lostAt: leadData.lostAt || null,
        pipelineId: leadPipeline.id,
        stageId: leadStageMap[stageName].id,
        sourceId: leadSources[sourceKey].id,
        interestedServiceId: serviceMap[interestedServiceName]?.id || null,
      },
    })
  }

  // ============================================================================
  // 12. OPPORTUNITIES
  // ============================================================================
  const oppsData = [
    { oppNumber: 'OPP-0001', title: 'Al Futtaim AI Chatbot', value: 25000, companyKey: 'Al Futtaim', contactKey: 'CON-0001', stageName: 'Negotiation', ownerId: sarah.id, expectedCloseDate: daysAgo(-15), probability: 70, serviceName: 'AI Chatbot', createdAt: daysAgo(20) },
    { oppNumber: 'OPP-0002', title: 'Dubai Holding Website Redesign', value: 45000, companyKey: 'Dubai Holding', contactKey: 'CON-0002', stageName: 'Contract', ownerId: sarah.id, expectedCloseDate: daysAgo(-5), probability: 85, serviceName: 'Corporate Website', createdAt: daysAgo(30) },
    { oppNumber: 'OPP-0003', title: 'Noon CRM Automation', value: 18000, companyKey: 'Noon', contactKey: 'CON-0003', stageName: 'Discovery', ownerId: omar.id, expectedCloseDate: daysAgo(-30), probability: 20, serviceName: 'CRM Automation', createdAt: daysAgo(10) },
    { oppNumber: 'OPP-0004', title: 'MAF Social Media Management', value: 96000, companyKey: 'MAF', contactKey: 'CON-0005', stageName: 'Proposal', ownerId: layla.id, expectedCloseDate: daysAgo(-20), probability: 40, serviceName: 'Social Media Management', createdAt: daysAgo(15) },
    { oppNumber: 'OPP-0005', title: 'Property Finder RAG Bot', value: 35000, companyKey: 'Property Finder', contactKey: 'CON-0010', stageName: 'Negotiation', ownerId: sarah.id, expectedCloseDate: daysAgo(-10), probability: 65, serviceName: 'RAG Knowledge Bot', createdAt: daysAgo(25) },
    { oppNumber: 'OPP-0006', title: 'Arabian Adventures Brand Refresh', value: 12000, companyKey: 'Arabian Adventures', contactKey: 'CON-0007', stageName: 'Closed Won', ownerId: omar.id, expectedCloseDate: daysAgo(5), probability: 100, serviceName: 'Brand Identity', createdAt: daysAgo(45), wonAt: daysAgo(5) },
    { oppNumber: 'OPP-0007', title: 'STC Custom AI Platform', value: 120000, companyKey: 'STC', contactKey: 'CON-0008', stageName: 'Discovery', ownerId: sarah.id, expectedCloseDate: daysAgo(-60), probability: 15, serviceName: 'Custom AI Solution', createdAt: daysAgo(5) },
    { oppNumber: 'OPP-0008', title: 'DAMAC SEO & Ads', value: 84000, companyKey: 'DAMAC', contactKey: 'CON-0006', stageName: 'Proposal', ownerId: ahmed.id, expectedCloseDate: daysAgo(-25), probability: 35, serviceName: 'SEO Optimization', createdAt: daysAgo(18) },
    { oppNumber: 'OPP-0009', title: 'Careem WhatsApp Integration', value: 36000, companyKey: 'Careem', contactKey: 'CON-0004', stageName: 'Closed Lost', ownerId: omar.id, expectedCloseDate: daysAgo(2), probability: 0, serviceName: 'WhatsApp Business API', createdAt: daysAgo(40), lostAt: daysAgo(2) },
    { oppNumber: 'OPP-0010', title: 'Kitopi Landing Pages', value: 9000, companyKey: 'Kitopi', contactKey: 'CON-0009', stageName: 'Contract', ownerId: ahmed.id, expectedCloseDate: daysAgo(-3), probability: 90, serviceName: 'Landing Page', createdAt: daysAgo(12) },
  ]

  for (const opp of oppsData) {
    const { companyKey, contactKey, stageName, serviceName, ...oppData } = opp
    const created = await prisma.opportunity.create({
      data: {
        tenantId: tenant.id,
        opportunityNumber: oppData.oppNumber,
        title: oppData.title,
        expectedValue: oppData.value,
        currency: 'AED',
        weightedValue: Math.round(oppData.value * oppData.probability / 100),
        companyId: companyRecords[companyKey].id,
        primaryContactId: contactRecords[contactKey].id,
        pipelineId: oppPipeline.id,
        stageId: oppStageMap[stageName].id,
        ownerId: oppData.ownerId,
        createdById: oppData.ownerId,
        expectedCloseDate: oppData.expectedCloseDate,
        probability: oppData.probability,
        createdAt: oppData.createdAt,
        wonAt: oppData.wonAt || null,
        lostAt: oppData.lostAt || null,
      },
    })
    // Link service
    if (serviceMap[serviceName]) {
      await prisma.opportunityService.create({
        data: {
          opportunityId: created.id,
          serviceId: serviceMap[serviceName].id,
          quantity: 1,
          unitPrice: oppData.value,
          totalPrice: oppData.value,
        },
      })
    }
  }

  // ============================================================================
  // 13. EXPENSE CATEGORIES & TAX RATES
  // ============================================================================
  const expCats = ['Office Supplies', 'Software & Tools', 'Marketing', 'Travel', 'Salaries', 'Professional Services', 'Hosting & Cloud', 'Miscellaneous']
  for (const cat of expCats) {
    await prisma.expenseCategory.create({
      data: { tenantId: tenant.id, name: cat, isActive: true },
    })
  }

  await prisma.taxRate.create({
    data: { tenantId: tenant.id, name: 'UAE VAT', rate: 5, isDefault: true, isInclusive: false },
  })

  // ============================================================================
  // 14. TAGS
  // ============================================================================
  const tagEntries = [
    { name: 'VIP', entityType: 'company' },
    { name: 'Hot Lead', entityType: 'lead' },
    { name: 'Enterprise', entityType: 'company' },
    { name: 'Startup', entityType: 'company' },
    { name: 'Government', entityType: 'company' },
    { name: 'Recurring', entityType: 'opportunity' },
    { name: 'Urgent', entityType: 'lead' },
    { name: 'Follow-up', entityType: 'lead' },
    { name: 'At Risk', entityType: 'project' },
    { name: 'Upsell', entityType: 'opportunity' },
  ]
  for (const tag of tagEntries) {
    await prisma.tag.create({
      data: {
        tenantId: tenant.id,
        name: tag.name,
        entityType: tag.entityType,
        color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
      },
    })
  }

  console.log('✅ Seed complete!')
  console.log(`   Tenant: ${tenant.name}`)
  console.log(`   Users: 5 (admin@zainhub.ae / admin123)`)
  console.log(`   Companies: ${companiesData.length}`)
  console.log(`   Contacts: ${contactsData.length}`)
  console.log(`   Leads: ${leadsData.length}`)
  console.log(`   Opportunities: ${oppsData.length}`)
  console.log(`   Services: ${Object.keys(serviceMap).length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
