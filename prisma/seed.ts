import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import bcrypt from 'bcryptjs'

const url = process.env.DATABASE_URL!
const prisma = (url.includes('neon.tech') || url.includes('neon.database'))
  ? new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }) })
  : new PrismaClient({ datasources: { db: { url } } })

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data (sequential — pooler doesn't support batch transactions)
  await prisma.numberSequence.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.tagRelation.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.customFieldValue.deleteMany()
  await prisma.customField.deleteMany()
  await prisma.contentApproval.deleteMany()
  await prisma.contentItem.deleteMany()
  await prisma.socialAccount.deleteMany()
  await prisma.ticketComment.deleteMany()
  await prisma.ticket.deleteMany()
  await prisma.taskWatcher.deleteMany()
  await prisma.taskComment.deleteMany()
  await prisma.task.deleteMany()
  await prisma.timeEntry.deleteMany()
  await prisma.projectMilestone.deleteMany()
  await prisma.projectMember.deleteMany()
  await prisma.project.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.invoiceItem.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.contract.deleteMany()
  await prisma.proposalItem.deleteMany()
  await prisma.proposal.deleteMany()
  await prisma.quotationItem.deleteMany()
  await prisma.quotation.deleteMany()
  await prisma.opportunityService.deleteMany()
  await prisma.opportunity.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.companyContact.deleteMany()
  await prisma.contact.deleteMany()
  await prisma.company.deleteMany()
  await prisma.campaign.deleteMany()
  await prisma.document.deleteMany()
  await prisma.savedFilter.deleteMany()
  await prisma.setting.deleteMany()
  await prisma.automationRule.deleteMany()
  await prisma.onboardingTemplate.deleteMany()
  await prisma.servicePackage.deleteMany()
  await prisma.service.deleteMany()
  await prisma.serviceCategory.deleteMany()
  await prisma.pipelineStage.deleteMany()
  await prisma.pipeline.deleteMany()
  await prisma.lostReason.deleteMany()
  await prisma.leadSource.deleteMany()
  await prisma.taxRate.deleteMany()
  await prisma.expenseCategory.deleteMany()
  await prisma.userRole.deleteMany()
  await prisma.rolePermission.deleteMany()
  await prisma.permission.deleteMany()
  await prisma.role.deleteMany()
  await prisma.user.deleteMany()
  await prisma.tenant.deleteMany()

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
    // New modules (Priority 1-4)
    'change_requests', 'approvals', 'deliverables', 'preview_links', 'comms',
    'client_services', 'subscriptions', 'bundles', 'forms', 'account_health', 'onboarding',
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

  // Pre-create campaigns needed for lead linking (full campaign data created in section 17)
  const campaignMap: Record<string, any> = {}
  const earlyLeadCampaigns = [
    { name: 'AI Solutions Launch', type: 'CONTENT_MARKETING' as const, status: 'ACTIVE' as const, platform: 'LinkedIn, Website', budget: 8000, actualSpend: 3200, startDate: daysAgo(10), endDate: daysAgo(-20), ownerId: sarah.id, leadsGenerated: 12, opportunitiesCreated: 3 },
    { name: 'Google Ads — Website Services', type: 'ADS' as const, status: 'ACTIVE' as const, platform: 'Google Ads', budget: 5000, actualSpend: 2100, startDate: daysAgo(15), endDate: daysAgo(-15), ownerId: ahmed.id, leadsGenerated: 18, opportunitiesCreated: 2 },
  ]
  for (const c of earlyLeadCampaigns) {
    campaignMap[c.name] = await prisma.campaign.create({
      data: {
        tenantId: tenant.id, name: c.name, type: c.type, status: c.status,
        platform: c.platform || null, budget: c.budget, actualSpend: c.actualSpend || 0,
        currency: 'AED', startDate: c.startDate || null, endDate: c.endDate || null,
        ownerId: c.ownerId, leadsGenerated: c.leadsGenerated || 0,
        opportunitiesCreated: c.opportunitiesCreated || 0, revenueGenerated: 0,
      },
    })
  }

  const leadsData = [
    { leadNumber: 'LD-0001', fullName: 'Tariq Al-Muhairi', companyName: 'Emirates NBD', email: 'tariq@enbd.ae', phone: '+97150001001', sourceKey: 'Website', stageName: 'New', assignedToId: omar.id, urgency: 'HIGH' as const, score: 75, interestedServiceName: 'AI Chatbot', budgetRange: '15,000-25,000 AED', createdAt: daysAgo(1), nextFollowUpAt: hoursAgo(-2), campaignName: 'AI Solutions Launch' },
    { leadNumber: 'LD-0002', fullName: 'Nadia Bakri', companyName: 'Chalhoub Group', email: 'nadia@chalhoub.com', phone: '+97150001002', sourceKey: 'LinkedIn', stageName: 'Contacted', assignedToId: sarah.id, urgency: 'MEDIUM' as const, score: 60, interestedServiceName: 'E-Commerce Store', budgetRange: '20,000-40,000 AED', createdAt: daysAgo(3), lastContactedAt: daysAgo(1), nextFollowUpAt: daysAgo(-1), campaignName: 'AI Solutions Launch' },
    { leadNumber: 'LD-0003', fullName: 'Salman Al-Dosari', companyName: 'ACME Corp KSA', email: 'salman@acme.sa', phone: '+966501112244', sourceKey: 'Referral', stageName: 'Qualified', assignedToId: omar.id, urgency: 'HIGH' as const, score: 85, interestedServiceName: 'Custom AI Solution', budgetRange: '50,000-100,000 AED', country: 'KSA', city: 'Riyadh', createdAt: daysAgo(7), lastContactedAt: daysAgo(2), campaignName: 'Google Ads — Website Services' },
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

  const leadRecords: Record<string, any> = {}
  for (const lead of leadsData) {
    const { sourceKey, stageName, interestedServiceName, campaignName, ...leadData } = lead as any
    leadRecords[leadData.leadNumber] = await prisma.lead.create({
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
        campaignId: campaignName ? campaignMap[campaignName]?.id || null : null,
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

  const oppRecords: Record<string, any> = {}
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
    oppRecords[oppData.oppNumber] = created
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
  const expCatNames = ['Office Supplies', 'Software & Tools', 'Marketing', 'Travel', 'Salaries', 'Professional Services', 'Hosting & Cloud', 'Miscellaneous']
  const expCatMap: Record<string, any> = {}
  for (const cat of expCatNames) {
    expCatMap[cat] = await prisma.expenseCategory.create({
      data: { tenantId: tenant.id, name: cat, isActive: true },
    })
  }

  const uaeVat = await prisma.taxRate.create({
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

  // ============================================================================
  // 15. ADDITIONAL SERVICE CATEGORIES (Complete 17 ZainHub categories)
  // ============================================================================
  const moreCategories = [
    {
      name: 'Strategy & Consulting', nameAr: 'الاستراتيجية والاستشارات',
      services: [
        { name: 'Digital Strategy', nameAr: 'استراتيجية رقمية', pricingType: 'PROJECT_BASED' as const, basePrice: 20000 },
        { name: 'Technology Consulting', nameAr: 'استشارات تقنية', pricingType: 'HOURLY' as const, basePrice: 800 },
        { name: 'AI Readiness Assessment', nameAr: 'تقييم جاهزية الذكاء الاصطناعي', pricingType: 'FIXED' as const, basePrice: 10000 },
      ],
    },
    {
      name: 'E-Commerce', nameAr: 'التجارة الإلكترونية',
      services: [
        { name: 'Shopify Store', nameAr: 'متجر شوبيفاي', pricingType: 'FIXED' as const, basePrice: 15000 },
        { name: 'WooCommerce Store', nameAr: 'متجر ووكومرس', pricingType: 'FIXED' as const, basePrice: 12000 },
        { name: 'Marketplace Integration', nameAr: 'تكامل الأسواق', pricingType: 'PROJECT_BASED' as const, basePrice: 8000 },
      ],
    },
    {
      name: 'Mobile Apps', nameAr: 'تطبيقات الجوال',
      services: [
        { name: 'iOS App', nameAr: 'تطبيق iOS', pricingType: 'PROJECT_BASED' as const, basePrice: 40000 },
        { name: 'Android App', nameAr: 'تطبيق أندرويد', pricingType: 'PROJECT_BASED' as const, basePrice: 35000 },
        { name: 'Cross-Platform App', nameAr: 'تطبيق متعدد المنصات', pricingType: 'PROJECT_BASED' as const, basePrice: 50000 },
      ],
    },
    {
      name: 'Systems & Dashboards', nameAr: 'الأنظمة ولوحات المعلومات',
      services: [
        { name: 'Custom Dashboard', nameAr: 'لوحة معلومات مخصصة', pricingType: 'PROJECT_BASED' as const, basePrice: 25000 },
        { name: 'ERP Integration', nameAr: 'تكامل ERP', pricingType: 'PROJECT_BASED' as const, basePrice: 30000 },
        { name: 'Client Portal', nameAr: 'بوابة العملاء', pricingType: 'FIXED' as const, basePrice: 20000 },
      ],
    },
    {
      name: 'WhatsApp Business', nameAr: 'واتساب للأعمال',
      services: [
        { name: 'WhatsApp Chatbot', nameAr: 'روبوت واتساب', pricingType: 'PROJECT_BASED' as const, basePrice: 12000 },
        { name: 'WhatsApp Catalog', nameAr: 'كتالوج واتساب', pricingType: 'FIXED' as const, basePrice: 5000 },
        { name: 'WhatsApp Broadcast System', nameAr: 'نظام بث واتساب', pricingType: 'MONTHLY' as const, basePrice: 2000 },
      ],
    },
    {
      name: 'UI/UX Design', nameAr: 'تصميم واجهة وتجربة المستخدم',
      services: [
        { name: 'UX Audit', nameAr: 'تدقيق تجربة المستخدم', pricingType: 'FIXED' as const, basePrice: 8000 },
        { name: 'UI Design System', nameAr: 'نظام تصميم واجهة', pricingType: 'PROJECT_BASED' as const, basePrice: 15000 },
        { name: 'Prototyping & Wireframes', nameAr: 'النماذج الأولية', pricingType: 'FIXED' as const, basePrice: 6000 },
      ],
    },
    {
      name: 'Content & Writing', nameAr: 'المحتوى والكتابة',
      services: [
        { name: 'Copywriting', nameAr: 'كتابة المحتوى', pricingType: 'PROJECT_BASED' as const, basePrice: 4000 },
        { name: 'Blog Content', nameAr: 'محتوى المدونة', pricingType: 'MONTHLY' as const, basePrice: 3000 },
        { name: 'Video Production', nameAr: 'إنتاج الفيديو', pricingType: 'PROJECT_BASED' as const, basePrice: 10000 },
      ],
    },
    {
      name: 'Analytics & Reporting', nameAr: 'التحليلات والتقارير',
      services: [
        { name: 'GA4 Setup & Audit', nameAr: 'إعداد وتدقيق GA4', pricingType: 'FIXED' as const, basePrice: 5000 },
        { name: 'Custom Reporting Dashboard', nameAr: 'لوحة تقارير مخصصة', pricingType: 'PROJECT_BASED' as const, basePrice: 12000 },
        { name: 'Data Analytics Consulting', nameAr: 'استشارات تحليل البيانات', pricingType: 'HOURLY' as const, basePrice: 600 },
      ],
    },
    {
      name: 'Cloud & Digital Ops', nameAr: 'العمليات السحابية والرقمية',
      services: [
        { name: 'Cloud Migration', nameAr: 'نقل إلى السحابة', pricingType: 'PROJECT_BASED' as const, basePrice: 20000 },
        { name: 'DevOps Setup', nameAr: 'إعداد DevOps', pricingType: 'PROJECT_BASED' as const, basePrice: 15000 },
        { name: 'Infrastructure Monitoring', nameAr: 'مراقبة البنية التحتية', pricingType: 'MONTHLY' as const, basePrice: 3000 },
      ],
    },
    {
      name: 'B2B Sales Enablement', nameAr: 'تمكين مبيعات B2B',
      services: [
        { name: 'Sales Deck Design', nameAr: 'تصميم عرض المبيعات', pricingType: 'FIXED' as const, basePrice: 5000 },
        { name: 'CRM Implementation', nameAr: 'تطبيق CRM', pricingType: 'PROJECT_BASED' as const, basePrice: 25000 },
        { name: 'Sales Process Optimization', nameAr: 'تحسين عملية المبيعات', pricingType: 'PROJECT_BASED' as const, basePrice: 15000 },
      ],
    },
    {
      name: 'Sector-Specific Packages', nameAr: 'حزم القطاعات المتخصصة',
      services: [
        { name: 'Real Estate Digital Package', nameAr: 'حزمة العقارات الرقمية', pricingType: 'FIXED' as const, basePrice: 30000 },
        { name: 'Healthcare Digital Package', nameAr: 'حزمة الرعاية الصحية', pricingType: 'FIXED' as const, basePrice: 35000 },
        { name: 'F&B Digital Package', nameAr: 'حزمة الأغذية والمشروبات', pricingType: 'FIXED' as const, basePrice: 25000 },
      ],
    },
  ]

  for (const cat of moreCategories) {
    const category = await prisma.serviceCategory.create({
      data: { tenantId: tenant.id, name: cat.name, nameAr: cat.nameAr, isActive: true },
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
  // 16. PROJECTS
  // ============================================================================
  const projectsData = [
    { projectNumber: 'PRJ-0001', name: 'Al Futtaim AI Chatbot', clientKey: 'Al Futtaim', oppKey: 'OPP-0001', ownerId: sarah.id, status: 'IN_PROGRESS' as const, healthStatus: 'ON_TRACK' as const, progressPercent: 65, budgetValue: 25000, startDate: daysAgo(30), targetEndDate: daysAgo(-15) },
    { projectNumber: 'PRJ-0002', name: 'Dubai Holding Website Redesign', clientKey: 'Dubai Holding', oppKey: 'OPP-0002', ownerId: sarah.id, status: 'PLANNING' as const, healthStatus: 'ON_TRACK' as const, progressPercent: 15, budgetValue: 45000, startDate: daysAgo(10), targetEndDate: daysAgo(-45) },
    { projectNumber: 'PRJ-0003', name: 'MAF Social Media Management', clientKey: 'MAF', oppKey: 'OPP-0004', ownerId: layla.id, status: 'IN_PROGRESS' as const, healthStatus: 'AT_RISK' as const, progressPercent: 40, budgetValue: 96000, startDate: daysAgo(20), targetEndDate: daysAgo(-30) },
    { projectNumber: 'PRJ-0004', name: 'Arabian Adventures Brand Refresh', clientKey: 'Arabian Adventures', oppKey: 'OPP-0006', ownerId: omar.id, status: 'DELIVERED' as const, healthStatus: 'ON_TRACK' as const, progressPercent: 100, budgetValue: 12000, startDate: daysAgo(60), targetEndDate: daysAgo(5), actualEndDate: daysAgo(3) },
    { projectNumber: 'PRJ-0005', name: 'Property Finder RAG Knowledge Bot', clientKey: 'Property Finder', oppKey: 'OPP-0005', ownerId: sarah.id, status: 'DISCOVERY' as const, healthStatus: 'ON_TRACK' as const, progressPercent: 10, budgetValue: 35000, startDate: daysAgo(5), targetEndDate: daysAgo(-40) },
    { projectNumber: 'PRJ-0006', name: 'Kitopi Landing Pages', clientKey: 'Kitopi', oppKey: 'OPP-0010', ownerId: ahmed.id, status: 'IN_PROGRESS' as const, healthStatus: 'DELAYED' as const, progressPercent: 55, budgetValue: 9000, startDate: daysAgo(25), targetEndDate: daysAgo(-5) },
  ]

  const projectRecords: Record<string, any> = {}
  for (const p of projectsData) {
    const { clientKey, oppKey, ...data } = p as any
    projectRecords[p.projectNumber] = await prisma.project.create({
      data: {
        tenantId: tenant.id,
        projectNumber: data.projectNumber,
        name: data.name,
        clientId: companyRecords[clientKey].id,
        ownerId: data.ownerId,
        status: data.status,
        healthStatus: data.healthStatus,
        progressPercent: data.progressPercent,
        budgetValue: data.budgetValue,
        currency: 'AED',
        startDate: data.startDate,
        targetEndDate: data.targetEndDate,
        actualEndDate: data.actualEndDate || null,
        opportunityId: oppKey ? oppRecords[oppKey]?.id || null : null,
      },
    })
    // Add project members
    await prisma.projectMember.create({
      data: { projectId: projectRecords[p.projectNumber].id, userId: data.ownerId, role: 'Project Lead' },
    })
    await prisma.projectMember.create({
      data: { projectId: projectRecords[p.projectNumber].id, userId: admin.id, role: 'Sponsor' },
    })
  }

  // Add milestones to first 3 projects
  const milestoneData = [
    { projectKey: 'PRJ-0001', milestones: [
      { name: 'Discovery & Requirements', order: 1, status: 'COMPLETED', completedAt: daysAgo(20) },
      { name: 'Bot Design & Flow', order: 2, status: 'COMPLETED', completedAt: daysAgo(10) },
      { name: 'Development', order: 3, status: 'IN_PROGRESS', dueDate: daysAgo(-5) },
      { name: 'Testing & QA', order: 4, status: 'PENDING', dueDate: daysAgo(-10) },
      { name: 'Launch & Training', order: 5, status: 'PENDING', dueDate: daysAgo(-15) },
    ]},
    { projectKey: 'PRJ-0002', milestones: [
      { name: 'Sitemap & Wireframes', order: 1, status: 'COMPLETED', completedAt: daysAgo(3) },
      { name: 'UI Design', order: 2, status: 'IN_PROGRESS', dueDate: daysAgo(-10) },
      { name: 'Frontend Development', order: 3, status: 'PENDING', dueDate: daysAgo(-25) },
      { name: 'Backend & CMS', order: 4, status: 'PENDING', dueDate: daysAgo(-35) },
      { name: 'UAT & Launch', order: 5, status: 'PENDING', dueDate: daysAgo(-45) },
    ]},
    { projectKey: 'PRJ-0003', milestones: [
      { name: 'Strategy & Calendar', order: 1, status: 'COMPLETED', completedAt: daysAgo(15) },
      { name: 'Content Month 1', order: 2, status: 'IN_PROGRESS', dueDate: daysAgo(-5) },
      { name: 'Content Month 2', order: 3, status: 'PENDING', dueDate: daysAgo(-20) },
    ]},
  ]
  for (const pm of milestoneData) {
    for (const m of pm.milestones) {
      await prisma.projectMilestone.create({
        data: {
          projectId: projectRecords[pm.projectKey].id,
          name: m.name,
          order: m.order,
          status: m.status,
          dueDate: m.dueDate || null,
          completedAt: m.completedAt || null,
        },
      })
    }
  }

  // ============================================================================
  // 17. CAMPAIGNS
  // ============================================================================
  const campaignsData = [
    { name: 'Ramadan Digital Campaign 2026', type: 'SOCIAL' as const, status: 'COMPLETED' as const, platform: 'Instagram, LinkedIn', budget: 15000, actualSpend: 13500, startDate: daysAgo(45), endDate: daysAgo(15), ownerId: layla.id, leadsGenerated: 28, opportunitiesCreated: 5, revenueGenerated: 75000 },
    { name: 'AI Solutions Launch', type: 'CONTENT_MARKETING' as const, status: 'ACTIVE' as const, platform: 'LinkedIn, Website', budget: 8000, actualSpend: 3200, startDate: daysAgo(10), endDate: daysAgo(-20), ownerId: sarah.id, leadsGenerated: 12, opportunitiesCreated: 3 },
    { name: 'Google Ads — Website Services', type: 'ADS' as const, status: 'ACTIVE' as const, platform: 'Google Ads', budget: 5000, actualSpend: 2100, startDate: daysAgo(15), endDate: daysAgo(-15), ownerId: ahmed.id, leadsGenerated: 18, opportunitiesCreated: 2 },
    { name: 'GITEX 2026 Event Booth', type: 'EVENT' as const, status: 'DRAFT' as const, platform: 'GITEX Global', budget: 50000, startDate: daysAgo(-120), endDate: daysAgo(-117), ownerId: admin.id },
    { name: 'Referral Program Q2', type: 'REFERRAL' as const, status: 'ACTIVE' as const, budget: 3000, actualSpend: 800, startDate: daysAgo(30), endDate: daysAgo(-60), ownerId: omar.id, leadsGenerated: 6, opportunitiesCreated: 2, revenueGenerated: 40000 },
    { name: 'WhatsApp Outreach — KSA', type: 'EMAIL' as const, status: 'PAUSED' as const, platform: 'WhatsApp', budget: 2000, actualSpend: 600, startDate: daysAgo(20), ownerId: omar.id, leadsGenerated: 4 },
  ]

  for (const c of campaignsData) {
    if (campaignMap[c.name]) continue // already created in early section
    campaignMap[c.name] = await prisma.campaign.create({
      data: {
        tenantId: tenant.id,
        name: c.name,
        type: c.type,
        status: c.status,
        platform: c.platform || null,
        budget: c.budget,
        actualSpend: c.actualSpend || 0,
        currency: 'AED',
        startDate: c.startDate || null,
        endDate: c.endDate || null,
        ownerId: c.ownerId,
        leadsGenerated: c.leadsGenerated || 0,
        opportunitiesCreated: c.opportunitiesCreated || 0,
        revenueGenerated: c.revenueGenerated || 0,
      },
    })
  }

  // ============================================================================
  // 18. QUOTATIONS
  // ============================================================================
  const quotationsData = [
    { quotationNumber: 'QUO-0001', title: 'AI Chatbot for Al Futtaim', companyKey: 'Al Futtaim', contactKey: 'CON-0001', ownerId: sarah.id, status: 'ACCEPTED' as const, subtotal: 25000, taxAmount: 1250, totalAmount: 26250, validUntil: daysAgo(-30), acceptedAt: daysAgo(15), createdAt: daysAgo(25) },
    { quotationNumber: 'QUO-0002', title: 'Website Redesign — Dubai Holding', companyKey: 'Dubai Holding', contactKey: 'CON-0002', ownerId: sarah.id, status: 'SENT' as const, subtotal: 45000, taxAmount: 2250, totalAmount: 47250, validUntil: daysAgo(-15), createdAt: daysAgo(12) },
    { quotationNumber: 'QUO-0003', title: 'CRM Automation for Noon', companyKey: 'Noon', contactKey: 'CON-0003', ownerId: omar.id, status: 'DRAFT' as const, subtotal: 18000, taxAmount: 900, totalAmount: 18900, createdAt: daysAgo(5) },
    { quotationNumber: 'QUO-0004', title: 'Social Media Package — MAF', companyKey: 'MAF', contactKey: 'CON-0005', ownerId: layla.id, status: 'SENT' as const, subtotal: 96000, taxAmount: 4800, totalAmount: 100800, validUntil: daysAgo(-10), createdAt: daysAgo(18) },
    { quotationNumber: 'QUO-0005', title: 'RAG Bot — Property Finder', companyKey: 'Property Finder', contactKey: 'CON-0010', ownerId: sarah.id, status: 'ACCEPTED' as const, subtotal: 35000, taxAmount: 1750, totalAmount: 36750, validUntil: daysAgo(-20), acceptedAt: daysAgo(5), createdAt: daysAgo(30) },
    { quotationNumber: 'QUO-0006', title: 'Landing Pages — Kitopi', companyKey: 'Kitopi', contactKey: 'CON-0009', ownerId: ahmed.id, status: 'EXPIRED' as const, subtotal: 9000, taxAmount: 450, totalAmount: 9450, validUntil: daysAgo(3), createdAt: daysAgo(20) },
  ]

  const quotationRecords: Record<string, any> = {}
  for (const q of quotationsData) {
    const { companyKey, contactKey, ...data } = q
    quotationRecords[q.quotationNumber] = await prisma.quotation.create({
      data: {
        tenantId: tenant.id,
        quotationNumber: data.quotationNumber,
        title: data.title,
        companyId: companyRecords[companyKey].id,
        contactId: contactRecords[contactKey].id,
        ownerId: data.ownerId,
        createdById: data.ownerId,
        status: data.status,
        subtotal: data.subtotal,
        taxAmount: data.taxAmount,
        totalAmount: data.totalAmount,
        taxRateId: uaeVat.id,
        validUntil: data.validUntil || null,
        acceptedAt: data.acceptedAt || null,
        createdAt: data.createdAt,
        issueDate: data.createdAt,
      },
    })
    // Add line items (multi-line for realism)
    const quotationLineItems: Record<string, Array<{ description: string; quantity: number; unitPrice: number }>> = {
      'QUO-0001': [
        { description: 'AI Chatbot Design & Development', quantity: 1, unitPrice: 15000 },
        { description: 'WhatsApp Integration', quantity: 1, unitPrice: 5000 },
        { description: 'Admin Dashboard', quantity: 1, unitPrice: 3000 },
        { description: 'Training & Handover', quantity: 2, unitPrice: 1000 },
      ],
      'QUO-0002': [
        { description: 'UX Research & Wireframes', quantity: 1, unitPrice: 8000 },
        { description: 'UI Design (15 pages)', quantity: 15, unitPrice: 1000 },
        { description: 'Next.js Development', quantity: 1, unitPrice: 20000 },
        { description: 'CMS Integration', quantity: 1, unitPrice: 7000 },
        { description: 'Launch & QA', quantity: 1, unitPrice: 5000 },
      ],
      'QUO-0003': [
        { description: 'CRM Automation Setup', quantity: 1, unitPrice: 10000 },
        { description: 'n8n Workflow Development', quantity: 4, unitPrice: 2000 },
      ],
      'QUO-0004': [
        { description: 'Social Media Management — Monthly Retainer', quantity: 12, unitPrice: 8000 },
      ],
      'QUO-0005': [
        { description: 'RAG Architecture & Development', quantity: 1, unitPrice: 20000 },
        { description: 'Document Processing Pipeline', quantity: 1, unitPrice: 8000 },
        { description: 'API & Dashboard', quantity: 1, unitPrice: 7000 },
      ],
      'QUO-0006': [
        { description: 'Landing Page Design (3 pages)', quantity: 3, unitPrice: 3000 },
      ],
    }
    const qItems = quotationLineItems[q.quotationNumber] ?? [{ description: data.title, quantity: 1, unitPrice: data.subtotal }]
    for (let idx = 0; idx < qItems.length; idx++) {
      const li = qItems[idx]
      await prisma.quotationItem.create({
        data: {
          quotationId: quotationRecords[q.quotationNumber].id,
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          totalPrice: li.quantity * li.unitPrice,
          order: idx + 1,
          taxRate: 5,
        },
      })
    }
  }

  // ============================================================================
  // 19. PROPOSALS
  // ============================================================================
  const proposalsData = [
    { proposalNumber: 'PRP-0001', title: 'AI-Powered Customer Service — Al Futtaim', companyKey: 'Al Futtaim', contactKey: 'CON-0001', ownerId: sarah.id, status: 'ACCEPTED' as const, subtotal: 25000, taxAmount: 1250, totalAmount: 26250, executiveSummary: 'Comprehensive AI chatbot solution to handle 80% of customer queries', scopeOfWork: 'Design, develop, test and deploy AI chatbot on website and WhatsApp', deliverables: 'AI Chatbot, Admin Dashboard, Training Documentation', timeline: '6 weeks from kickoff', createdAt: daysAgo(28), acceptedAt: daysAgo(18) },
    { proposalNumber: 'PRP-0002', title: 'Digital Transformation — Dubai Holding', companyKey: 'Dubai Holding', contactKey: 'CON-0002', ownerId: sarah.id, status: 'SENT' as const, subtotal: 45000, taxAmount: 2250, totalAmount: 47250, executiveSummary: 'Complete website redesign with modern tech stack', scopeOfWork: 'UX research, UI design, Next.js development, CMS integration', deliverables: 'New website, CMS, Analytics setup', timeline: '8 weeks', createdAt: daysAgo(14) },
    { proposalNumber: 'PRP-0003', title: 'Social Media Strategy — MAF', companyKey: 'MAF', contactKey: 'CON-0005', ownerId: layla.id, status: 'DRAFT' as const, subtotal: 96000, taxAmount: 4800, totalAmount: 100800, executiveSummary: '12-month social media management across all platforms', scopeOfWork: 'Content strategy, creation, scheduling, community management, reporting', createdAt: daysAgo(10) },
    { proposalNumber: 'PRP-0004', title: 'STC Enterprise AI Platform', companyKey: 'STC', contactKey: 'CON-0008', ownerId: sarah.id, status: 'SENT' as const, subtotal: 120000, taxAmount: 6000, totalAmount: 126000, executiveSummary: 'Enterprise-grade custom AI platform for internal operations', scopeOfWork: 'Requirements analysis, architecture design, development, deployment, training', deliverables: 'AI Platform, API documentation, training materials', timeline: '16 weeks', createdAt: daysAgo(7) },
  ]

  for (const p of proposalsData) {
    const { companyKey, contactKey, ...data } = p
    const proposal = await prisma.proposal.create({
      data: {
        tenantId: tenant.id,
        proposalNumber: data.proposalNumber,
        title: data.title,
        companyId: companyRecords[companyKey].id,
        contactId: contactRecords[contactKey].id,
        ownerId: data.ownerId,
        createdById: data.ownerId,
        status: data.status,
        subtotal: data.subtotal,
        taxAmount: data.taxAmount,
        totalAmount: data.totalAmount,
        executiveSummary: data.executiveSummary || null,
        scopeOfWork: data.scopeOfWork || null,
        deliverables: data.deliverables || null,
        timeline: data.timeline || null,
        createdAt: data.createdAt,
        issueDate: data.createdAt,
        acceptedAt: data.acceptedAt || null,
      },
    })
    const proposalLineItems: Record<string, Array<{ description: string; quantity: number; unitPrice: number }>> = {
      'PRP-0001': [
        { description: 'AI Chatbot Design & Development', quantity: 1, unitPrice: 15000 },
        { description: 'WhatsApp Channel Integration', quantity: 1, unitPrice: 5000 },
        { description: 'Admin Dashboard & Analytics', quantity: 1, unitPrice: 3000 },
        { description: 'Training (2 sessions)', quantity: 2, unitPrice: 1000 },
      ],
      'PRP-0002': [
        { description: 'Discovery & UX Research', quantity: 1, unitPrice: 8000 },
        { description: 'UI Design (20 screens)', quantity: 20, unitPrice: 800 },
        { description: 'Next.js + CMS Development', quantity: 1, unitPrice: 25000 },
        { description: 'QA, Launch & Hypercare', quantity: 1, unitPrice: 3000 },
      ],
      'PRP-0003': [
        { description: 'Social Media Strategy Document', quantity: 1, unitPrice: 8000 },
        { description: 'Monthly Management Retainer × 12', quantity: 12, unitPrice: 7333.33 },
      ],
      'PRP-0004': [
        { description: 'Enterprise AI Platform — Architecture', quantity: 1, unitPrice: 30000 },
        { description: 'Core Development (16 weeks × AED 5K)', quantity: 16, unitPrice: 5000 },
        { description: 'Deployment & Infrastructure', quantity: 1, unitPrice: 10000 },
      ],
    }
    const pItems = proposalLineItems[data.proposalNumber] ?? [{ description: data.title, quantity: 1, unitPrice: data.subtotal }]
    for (let idx = 0; idx < pItems.length; idx++) {
      const li = pItems[idx]
      await prisma.proposalItem.create({
        data: { proposalId: proposal.id, description: li.description, quantity: li.quantity, unitPrice: li.unitPrice, totalPrice: li.quantity * li.unitPrice, order: idx + 1 },
      })
    }
  }

  // ============================================================================
  // 20. CONTRACTS
  // ============================================================================
  const contractsData = [
    { contractNumber: 'CTR-0001', title: 'Al Futtaim AI Chatbot Service Agreement', type: 'SERVICE' as const, clientKey: 'Al Futtaim', contactKey: 'CON-0001', status: 'ACTIVE' as const, startDate: daysAgo(15), endDate: daysAgo(-75), value: 26250, createdById: sarah.id },
    { contractNumber: 'CTR-0002', title: 'Arabian Adventures Branding Contract', type: 'SERVICE' as const, clientKey: 'Arabian Adventures', contactKey: 'CON-0007', status: 'ACTIVE' as const, startDate: daysAgo(55), endDate: daysAgo(5), value: 12000, signedAt: daysAgo(55), createdById: omar.id },
    { contractNumber: 'CTR-0003', title: 'Property Finder NDA', type: 'NDA' as const, clientKey: 'Property Finder', status: 'ACTIVE' as const, startDate: daysAgo(35), endDate: daysAgo(-330), value: 0, signedAt: daysAgo(34), createdById: sarah.id },
    { contractNumber: 'CTR-0004', title: 'MAF Social Media Retainer', type: 'RETAINER' as const, clientKey: 'MAF', contactKey: 'CON-0005', status: 'DRAFT' as const, startDate: daysAgo(-5), endDate: daysAgo(-365), value: 96000, autoRenew: true, createdById: layla.id },
    { contractNumber: 'CTR-0005', title: 'Dubai Holding Website Maintenance', type: 'MAINTENANCE' as const, clientKey: 'Dubai Holding', status: 'SENT' as const, startDate: daysAgo(-50), endDate: daysAgo(-415), value: 24000, autoRenew: true, createdById: sarah.id },
  ]

  const contractRecords: Record<string, any> = {}
  for (const c of contractsData) {
    const { clientKey, contactKey, ...data } = c as any
    contractRecords[data.contractNumber] = await prisma.contract.create({
      data: {
        tenantId: tenant.id,
        contractNumber: data.contractNumber,
        title: data.title,
        type: data.type,
        clientId: companyRecords[clientKey].id,
        contactId: contactKey ? contactRecords[contactKey]?.id || null : null,
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate || null,
        value: data.value,
        autoRenew: data.autoRenew || false,
        signedAt: data.signedAt || null,
        currency: 'AED',
        createdById: data.createdById,
      },
    })
  }

  // ============================================================================
  // 21. INVOICES
  // ============================================================================
  const invoicesData = [
    { invoiceNumber: 'INV-0001', clientKey: 'Al Futtaim',       projectKey: 'PRJ-0001', contractKey: 'CTR-0001', status: 'PAID'          as const, subtotal: 13125, taxAmount: 656.25, totalAmount: 13781.25, amountPaid: 13781.25, dueDate: daysAgo(-10), issueDate: daysAgo(10), createdById: sarah.id },
    { invoiceNumber: 'INV-0002', clientKey: 'Arabian Adventures',projectKey: 'PRJ-0004', contractKey: 'CTR-0002', status: 'PAID'          as const, subtotal: 12000, taxAmount: 600,    totalAmount: 12600,    amountPaid: 12600,    dueDate: daysAgo(15),  issueDate: daysAgo(45), createdById: omar.id },
    { invoiceNumber: 'INV-0003', clientKey: 'Property Finder',   projectKey: 'PRJ-0005', contractKey: 'CTR-0003', status: 'PARTIALLY_PAID'as const, subtotal: 17500, taxAmount: 875,    totalAmount: 18375,    amountPaid: 9187.5,   dueDate: daysAgo(-20), issueDate: daysAgo(3),  createdById: sarah.id },
    { invoiceNumber: 'INV-0004', clientKey: 'MAF',               projectKey: 'PRJ-0003', status: 'PAID'          as const, subtotal: 8000,  taxAmount: 400,    totalAmount: 8400,     amountPaid: 8400,     dueDate: daysAgo(-30), issueDate: daysAgo(0),  createdById: layla.id },
    { invoiceNumber: 'INV-0005', clientKey: 'Kitopi',            projectKey: 'PRJ-0006', status: 'PARTIALLY_PAID'as const, subtotal: 4500,  taxAmount: 225,    totalAmount: 4725,     amountPaid: 2362.5,   dueDate: daysAgo(5),   issueDate: daysAgo(35), createdById: ahmed.id },
    { invoiceNumber: 'INV-0006', clientKey: 'Dubai Holding',     projectKey: 'PRJ-0002', status: 'PAID'          as const, subtotal: 22500, taxAmount: 1125,   totalAmount: 23625,    amountPaid: 23625,    dueDate: daysAgo(-15), issueDate: daysAgo(5),  createdById: sarah.id },
  ]

  const invoiceRecords: Record<string, any> = {}
  for (const inv of invoicesData) {
    const { clientKey, projectKey, contractKey, ...data } = inv as any
    invoiceRecords[inv.invoiceNumber] = await prisma.invoice.create({
      data: {
        tenantId: tenant.id,
        invoiceNumber: data.invoiceNumber,
        clientId: companyRecords[clientKey].id,
        projectId: projectKey ? projectRecords[projectKey]?.id || null : null,
        contractId: contractKey ? contractRecords[contractKey]?.id || null : null,
        status: data.status,
        subtotal: data.subtotal,
        taxAmount: data.taxAmount,
        totalAmount: data.totalAmount,
        amountPaid: data.amountPaid,
        balanceDue: data.totalAmount - data.amountPaid,
        dueDate: data.dueDate,
        issueDate: data.issueDate,
        taxRateId: uaeVat.id,
        currency: 'AED',
        createdById: data.createdById,
      },
    })
    await prisma.invoiceItem.create({
      data: {
        invoiceId: invoiceRecords[inv.invoiceNumber].id,
        description: `Services for ${clientKey}`,
        quantity: 1,
        unitPrice: data.subtotal,
        totalPrice: data.subtotal,
        order: 1,
        taxRate: 5,
      },
    })
  }

  // ============================================================================
  // 22. PAYMENTS
  // ============================================================================
  const paymentsData = [
    { paymentNumber: 'PAY-0001', invoiceKey: 'INV-0001', clientKey: 'Al Futtaim',       amount: 10000,  paymentDate: daysAgo(5),  paymentMethod: 'BANK_TRANSFER' as const, reference: 'TRF-2026-0401', notes: 'First instalment — 50% upfront' },
    { paymentNumber: 'PAY-0002', invoiceKey: 'INV-0002', clientKey: 'Arabian Adventures',amount: 6300,   paymentDate: daysAgo(30), paymentMethod: 'BANK_TRANSFER' as const, reference: 'TRF-2026-0312', notes: 'First payment — 50%' },
    { paymentNumber: 'PAY-0003', invoiceKey: 'INV-0002', clientKey: 'Arabian Adventures',amount: 6300,   paymentDate: daysAgo(15), paymentMethod: 'BANK_TRANSFER' as const, reference: 'TRF-2026-0327', notes: 'Final payment — project delivered' },
    { paymentNumber: 'PAY-0004', invoiceKey: 'INV-0003', clientKey: 'Property Finder',   amount: 9187.5, paymentDate: daysAgo(1),  paymentMethod: 'CHECK' as const,         reference: 'CHQ-2026-0411', notes: '50% deposit on account' },
    { paymentNumber: 'PAY-0005', invoiceKey: 'INV-0006', clientKey: 'Dubai Holding',     amount: 23625,  paymentDate: daysAgo(0),  paymentMethod: 'BANK_TRANSFER' as const, reference: 'TRF-2026-0412', notes: 'Full payment received' },
    { paymentNumber: 'PAY-0006', invoiceKey: 'INV-0001', clientKey: 'Al Futtaim',       amount: 3781.25,paymentDate: daysAgo(0),  paymentMethod: 'BANK_TRANSFER' as const, reference: 'TRF-2026-0412B', notes: 'Balance payment — project sign-off' },
    { paymentNumber: 'PAY-0007', invoiceKey: 'INV-0005', clientKey: 'Kitopi',           amount: 2362.5, paymentDate: daysAgo(0),  paymentMethod: 'CREDIT_CARD' as const,   reference: 'CC-2026-0412', notes: 'Partial recovery on overdue invoice' },
    { paymentNumber: 'PAY-0008', invoiceKey: 'INV-0004', clientKey: 'MAF',              amount: 8400,   paymentDate: daysAgo(0),  paymentMethod: 'BANK_TRANSFER' as const, reference: 'TRF-2026-0412C', notes: 'Full payment for social strategy sprint' },
  ]

  for (const p of paymentsData) {
    const { invoiceKey, clientKey, ...data } = p
    await prisma.payment.create({
      data: {
        tenantId: tenant.id,
        paymentNumber: data.paymentNumber,
        invoiceId: invoiceRecords[invoiceKey].id,
        clientId: companyRecords[clientKey].id,
        amount: data.amount,
        currency: 'AED',
        paymentDate: data.paymentDate,
        paymentMethod: data.paymentMethod,
        reference: data.reference,
        notes: data.notes || null,
        createdById: admin.id,
      },
    })
  }

  // ============================================================================
  // 23. EXPENSES
  // ============================================================================
  const expensesData = [
    { expenseNumber: 'EXP-0001', vendorName: 'Vercel',          catKey: 'Hosting & Cloud',       amount: 1200,  expenseDate: daysAgo(5),  status: 'APPROVED' as const, description: 'Annual Vercel Pro plan',                        approvedById: admin.id },
    { expenseNumber: 'EXP-0002', vendorName: 'Figma',           catKey: 'Software & Tools',      amount: 600,   expenseDate: daysAgo(10), status: 'APPROVED' as const, description: 'Figma Organization plan - monthly',               approvedById: admin.id },
    { expenseNumber: 'EXP-0003', vendorName: 'Meta Ads',        catKey: 'Marketing',             amount: 3500,  expenseDate: daysAgo(3),  status: 'PAID'     as const, description: 'Instagram ads for Ramadan campaign',              paymentMethod: 'CREDIT_CARD' as const, approvedById: admin.id },
    { expenseNumber: 'EXP-0004', vendorName: 'Emirates Airlines',catKey: 'Travel',               amount: 2800,  expenseDate: daysAgo(15), status: 'PENDING'  as const, description: 'Flight to Riyadh for STC meeting' },
    { expenseNumber: 'EXP-0005', vendorName: 'OpenAI',          catKey: 'Software & Tools',      amount: 450,   expenseDate: daysAgo(1),  status: 'APPROVED' as const, description: 'GPT-4o API usage - March 2026',                  approvedById: admin.id },
    { expenseNumber: 'EXP-0006', vendorName: 'Anthropic',       catKey: 'Software & Tools',      amount: 320,   expenseDate: daysAgo(1),  status: 'APPROVED' as const, description: 'Claude API usage - March 2026',                  approvedById: admin.id },
    { expenseNumber: 'EXP-0007', vendorName: 'WeWork',          catKey: 'Professional Services', amount: 4500,  expenseDate: daysAgo(0),  status: 'PENDING'  as const, description: 'Office space rent - April 2026' },
    { expenseNumber: 'EXP-0008', vendorName: 'Amazon AWS',      catKey: 'Hosting & Cloud',       amount: 890,   expenseDate: daysAgo(7),  status: 'APPROVED' as const, description: 'AWS infra - client projects March',              approvedById: admin.id },
    { expenseNumber: 'EXP-0009', vendorName: 'Google Ads',      catKey: 'Marketing',             amount: 5200,  expenseDate: daysAgo(2),  status: 'APPROVED' as const, description: 'Google Ads - Q1 brand awareness campaign',       approvedById: admin.id, paymentMethod: 'CREDIT_CARD' as const },
    { expenseNumber: 'EXP-0010', vendorName: 'Notion',          catKey: 'Software & Tools',      amount: 240,   expenseDate: daysAgo(12), status: 'APPROVED' as const, description: 'Notion Team plan - annual',                      approvedById: admin.id },
    { expenseNumber: 'EXP-0011', vendorName: 'Etisalat',        catKey: 'Professional Services', amount: 1800,  expenseDate: daysAgo(0),  status: 'PAID'     as const, description: 'Business internet & phone - April',               paymentMethod: 'BANK_TRANSFER' as const, approvedById: admin.id },
    { expenseNumber: 'EXP-0012', vendorName: 'Freelancer — UI', catKey: 'Professional Services', amount: 3000,  expenseDate: daysAgo(8),  status: 'APPROVED' as const, description: 'Freelance UI design — Kitopi landing pages',     approvedById: admin.id, projectKey: 'PRJ-0006' },
    { expenseNumber: 'EXP-0013', vendorName: 'Adobe Creative',  catKey: 'Software & Tools',      amount: 780,   expenseDate: daysAgo(30), status: 'APPROVED' as const, description: 'Adobe CC annual licence',                        approvedById: admin.id },
    { expenseNumber: 'EXP-0014', vendorName: 'Slack',           catKey: 'Software & Tools',      amount: 360,   expenseDate: daysAgo(30), status: 'APPROVED' as const, description: 'Slack Pro - annual renewal',                     approvedById: admin.id },
    { expenseNumber: 'EXP-0015', vendorName: 'Careem',          catKey: 'Travel',                amount: 420,   expenseDate: daysAgo(4),  status: 'PENDING'  as const, description: 'Client visits - week of April 7' },
    { expenseNumber: 'EXP-0016', vendorName: 'LinkedIn Ads',    catKey: 'Marketing',             amount: 2800,  expenseDate: daysAgo(6),  status: 'APPROVED' as const, description: 'LinkedIn B2B campaign - April sprint',           approvedById: admin.id, paymentMethod: 'CREDIT_CARD' as const },
  ]

  for (const e of expensesData) {
    const { catKey, projectKey, ...data } = e as any
    const taxAmt = Math.round(data.amount * 0.05 * 100) / 100
    await prisma.expense.create({
      data: {
        tenantId: tenant.id,
        expenseNumber: data.expenseNumber,
        vendorName: data.vendorName,
        categoryId: expCatMap[catKey].id,
        amount: data.amount,
        taxAmount: taxAmt,
        totalAmount: data.amount + taxAmt,
        currency: 'AED',
        expenseDate: data.expenseDate,
        paymentMethod: data.paymentMethod || 'BANK_TRANSFER',
        status: data.status,
        description: data.description || null,
        approvedById: data.approvedById || null,
        approvedAt: data.approvedById ? data.expenseDate : null,
        createdById: admin.id,
        linkedProjectId: projectKey ? projectRecords[projectKey]?.id || null : null,
      },
    })
  }

  // ============================================================================
  // 24. TICKETS
  // ============================================================================
  const ticketsData = [
    { ticketNumber: 'TKT-0001', subject: 'Chatbot not responding after hours', clientKey: 'Al Futtaim', type: 'BUG' as const, priority: 'HIGH' as const, status: 'IN_PROGRESS' as const, assignedToId: omar.id, createdById: admin.id, slaDueAt: daysAgo(-1) },
    { ticketNumber: 'TKT-0002', subject: 'Request multilingual support for website', clientKey: 'Dubai Holding', type: 'FEATURE_REQUEST' as const, priority: 'MEDIUM' as const, status: 'NEW' as const, assignedToId: null, createdById: layla.id },
    { ticketNumber: 'TKT-0003', subject: 'Invoice PDF not generating correctly', clientKey: 'MAF', type: 'BUG' as const, priority: 'URGENT' as const, status: 'OPEN' as const, assignedToId: ahmed.id, createdById: layla.id, slaDueAt: daysAgo(-0.5) },
    { ticketNumber: 'TKT-0004', subject: 'How to update brand colors?', clientKey: 'Arabian Adventures', type: 'QUESTION' as const, priority: 'LOW' as const, status: 'RESOLVED' as const, assignedToId: omar.id, createdById: omar.id, resolvedAt: daysAgo(2), resolutionSummary: 'Guided client through brand settings panel' },
    { ticketNumber: 'TKT-0005', subject: 'Social media scheduler timezone issue', clientKey: 'MAF', type: 'BUG' as const, priority: 'MEDIUM' as const, status: 'WAITING_CLIENT' as const, assignedToId: layla.id, createdById: layla.id },
    { ticketNumber: 'TKT-0006', subject: 'Add WhatsApp channel to chatbot', clientKey: 'Property Finder', type: 'CHANGE_REQUEST' as const, priority: 'HIGH' as const, status: 'NEW' as const, assignedToId: sarah.id, createdById: sarah.id, slaDueAt: daysAgo(-3) },
  ]

  for (const t of ticketsData) {
    const { clientKey, ...data } = t
    const ticket = await prisma.ticket.create({
      data: {
        tenantId: tenant.id,
        ticketNumber: data.ticketNumber,
        subject: data.subject,
        clientId: companyRecords[clientKey].id,
        type: data.type,
        priority: data.priority,
        status: data.status,
        assignedToId: data.assignedToId,
        createdById: data.createdById,
        slaDueAt: data.slaDueAt || null,
        resolvedAt: data.resolvedAt || null,
        resolutionSummary: data.resolutionSummary || null,
      },
    })
    // Add a comment to resolved tickets
    if (data.resolutionSummary) {
      await prisma.ticketComment.create({
        data: { ticketId: ticket.id, authorId: data.assignedToId || admin.id, content: data.resolutionSummary, isInternal: false },
      })
    }
  }

  // ============================================================================
  // 25. TASKS
  // ============================================================================
  const tasksData = [
    { taskNumber: 'TSK-0001', title: 'Prepare discovery document for STC',                 assignedToId: sarah.id,  priority: 'HIGH'   as const, status: 'IN_PROGRESS' as const, dueDate: daysAgo(-2),  projectKey: 'PRJ-0005', createdById: admin.id,  description: 'Cover AI chatbot scope, integration points, timeline, and resource plan.' },
    { taskNumber: 'TSK-0002', title: 'Design chatbot conversation flows',                   assignedToId: omar.id,   priority: 'HIGH'   as const, status: 'COMPLETED'   as const, dueDate: daysAgo(5),   projectKey: 'PRJ-0001', createdById: sarah.id, completedAt: daysAgo(6) },
    { taskNumber: 'TSK-0003', title: 'Review MAF content calendar',                         assignedToId: layla.id,  priority: 'MEDIUM' as const, status: 'TODO'        as const, dueDate: daysAgo(-3),  projectKey: 'PRJ-0003', createdById: layla.id,  description: 'Approve 30-day calendar: Ramadan + Eid posts, brand tone check.' },
    { taskNumber: 'TSK-0004', title: 'Update Al Futtaim chatbot training data',             assignedToId: omar.id,   priority: 'MEDIUM' as const, status: 'IN_PROGRESS' as const, dueDate: daysAgo(-5),  projectKey: 'PRJ-0001', createdById: sarah.id },
    { taskNumber: 'TSK-0005', title: 'Send Kitopi landing page mockups',                    assignedToId: ahmed.id,  priority: 'HIGH'   as const, status: 'TODO'        as const, dueDate: daysAgo(-1),  projectKey: 'PRJ-0006', createdById: ahmed.id },
    { taskNumber: 'TSK-0006', title: 'Follow up with Noon on CRM requirements',            assignedToId: omar.id,   priority: 'MEDIUM' as const, status: 'TODO'        as const, dueDate: daysAgo(-4),  relatedType: 'opportunity', createdById: omar.id },
    { taskNumber: 'TSK-0007', title: 'Prepare GITEX booth design brief',                   assignedToId: admin.id,  priority: 'LOW'    as const, status: 'TODO'        as const, dueDate: daysAgo(-90), createdById: admin.id },
    { taskNumber: 'TSK-0008', title: 'QA test Arabian Adventures brand assets',            assignedToId: ahmed.id,  priority: 'MEDIUM' as const, status: 'COMPLETED'   as const, dueDate: daysAgo(8),   projectKey: 'PRJ-0004', createdById: omar.id,  completedAt: daysAgo(7) },
    { taskNumber: 'TSK-0009', title: 'Write Property Finder RAG integration spec',        assignedToId: sarah.id,  priority: 'HIGH'   as const, status: 'IN_REVIEW'   as const, dueDate: daysAgo(-1),  projectKey: 'PRJ-0005', createdById: sarah.id },
    { taskNumber: 'TSK-0010', title: 'Monthly expense report — March 2026',               assignedToId: admin.id,  priority: 'LOW'    as const, status: 'COMPLETED'   as const, dueDate: daysAgo(2),   createdById: admin.id,  completedAt: daysAgo(1) },
    { taskNumber: 'TSK-0011', title: 'Set up staging environment for Dubai Holding',      assignedToId: omar.id,   priority: 'HIGH'   as const, status: 'IN_PROGRESS' as const, dueDate: daysAgo(-3),  projectKey: 'PRJ-0002', createdById: sarah.id,  description: 'Vercel staging with CI/CD, Neon preview branch, env vars.' },
    { taskNumber: 'TSK-0012', title: 'Onboard MAF social media channels',                 assignedToId: layla.id,  priority: 'HIGH'   as const, status: 'TODO'        as const, dueDate: daysAgo(-5),  projectKey: 'PRJ-0003', createdById: layla.id,  description: 'Connect Instagram, TikTok, LinkedIn, Twitter accounts via Meta API.' },
    { taskNumber: 'TSK-0013', title: 'Create invoice for INV-0006 (Dubai Holding)',       assignedToId: admin.id,  priority: 'MEDIUM' as const, status: 'COMPLETED'   as const, dueDate: daysAgo(5),   createdById: admin.id,  completedAt: daysAgo(5) },
    { taskNumber: 'TSK-0014', title: 'Competitor analysis — AI chatbot market UAE',       assignedToId: sarah.id,  priority: 'LOW'    as const, status: 'TODO'        as const, dueDate: daysAgo(-14), createdById: sarah.id,  description: 'Research 5 competitors: pricing, features, positioning in MENA.' },
    { taskNumber: 'TSK-0015', title: 'Review STC proposal with legal',                    assignedToId: admin.id,  priority: 'HIGH'   as const, status: 'IN_REVIEW'   as const, dueDate: daysAgo(-1),  createdById: sarah.id,  description: 'Verify IP ownership, SLA clauses, payment terms before sending.' },
    { taskNumber: 'TSK-0016', title: 'Fix TKT-0003 — Invoice PDF generation bug',        assignedToId: ahmed.id,  priority: 'URGENT' as const, status: 'IN_PROGRESS' as const, dueDate: daysAgo(0),   createdById: layla.id },
    { taskNumber: 'TSK-0017', title: 'Create onboarding checklist for new clients',      assignedToId: layla.id,  priority: 'MEDIUM' as const, status: 'TODO'        as const, dueDate: daysAgo(-20), createdById: admin.id },
    { taskNumber: 'TSK-0018', title: 'Deploy Property Finder RAG bot to production',     assignedToId: omar.id,   priority: 'HIGH'   as const, status: 'TODO'        as const, dueDate: daysAgo(-7),  projectKey: 'PRJ-0005', createdById: sarah.id },
    { taskNumber: 'TSK-0019', title: 'Record demo video — AI chatbot for marketing',     assignedToId: ahmed.id,  priority: 'LOW'    as const, status: 'TODO'        as const, dueDate: daysAgo(-30), createdById: admin.id,  description: '3-min loom walkthrough for zainhub.ae hero section.' },
    { taskNumber: 'TSK-0020', title: 'Renew SSL certificates — client servers',          assignedToId: omar.id,   priority: 'HIGH'   as const, status: 'COMPLETED'   as const, dueDate: daysAgo(3),   createdById: admin.id,  completedAt: daysAgo(4) },
  ]

  for (const t of tasksData) {
    const { projectKey, ...data } = t
    await prisma.task.create({
      data: {
        tenantId: tenant.id,
        taskNumber: data.taskNumber,
        title: data.title,
        description: (data as any).description || null,
        assignedToId: data.assignedToId,
        priority: data.priority,
        status: data.status,
        dueDate: data.dueDate || null,
        completedAt: data.completedAt || null,
        projectId: projectKey ? projectRecords[projectKey].id : null,
        relatedType: data.relatedType || null,
        createdById: data.createdById,
      },
    })
  }

  // ============================================================================
  // 26. DOCUMENTS
  // ============================================================================
  const documentsData = [
    { name: 'Al Futtaim Chatbot Requirements.pdf',       fileUrl: '/documents/alfuttaim-requirements.pdf',    fileType: 'application/pdf',          fileSize: 245000,  category: 'BRIEF'    as const, linkedEntityType: 'project',  uploadedById: sarah.id },
    { name: 'Dubai Holding Brand Guidelines.pdf',        fileUrl: '/documents/dh-brand-guidelines.pdf',       fileType: 'application/pdf',          fileSize: 1200000, category: 'BRAND'    as const, linkedEntityType: 'company',  uploadedById: sarah.id },
    { name: 'MAF Social Strategy Deck.pdf',              fileUrl: '/documents/maf-social-strategy.pdf',       fileType: 'application/pdf',          fileSize: 890000,  category: 'PROPOSAL' as const, linkedEntityType: 'proposal', uploadedById: layla.id },
    { name: 'Property Finder NDA — Signed.pdf',         fileUrl: '/documents/pf-nda-signed.pdf',             fileType: 'application/pdf',          fileSize: 156000,  category: 'CONTRACT' as const, linkedEntityType: 'contract', uploadedById: sarah.id },
    { name: 'Q1 2026 Financial Report.xlsx',             fileUrl: '/documents/q1-2026-financials.xlsx',       fileType: 'application/vnd.ms-excel', fileSize: 340000,  category: 'REPORT'   as const,                               uploadedById: admin.id },
    { name: 'Arabian Adventures Logo — Final.ai',        fileUrl: '/documents/aa-logo-final.ai',              fileType: 'application/illustrator',  fileSize: 2800000, category: 'ASSET'    as const, linkedEntityType: 'project',  uploadedById: omar.id },
    { name: 'ZainHub Service Catalogue 2026.pdf',        fileUrl: '/documents/zainhub-services-2026.pdf',     fileType: 'application/pdf',          fileSize: 620000,  category: 'BRIEF'    as const,                               uploadedById: admin.id },
    { name: 'STC Enterprise AI Proposal.pdf',            fileUrl: '/documents/stc-ai-proposal-v2.pdf',        fileType: 'application/pdf',          fileSize: 1450000, category: 'PROPOSAL' as const, linkedEntityType: 'proposal', uploadedById: sarah.id },
    { name: 'Kitopi Landing Page Wireframes.fig',        fileUrl: '/documents/kitopi-wireframes.fig',         fileType: 'application/figma',        fileSize: 3200000, category: 'ASSET'    as const, linkedEntityType: 'project',  uploadedById: ahmed.id },
    { name: 'Al Futtaim Contract — Signed.pdf',         fileUrl: '/documents/alfuttaim-contract-signed.pdf', fileType: 'application/pdf',          fileSize: 185000,  category: 'CONTRACT' as const, linkedEntityType: 'contract', uploadedById: sarah.id },
    { name: 'MAF Retainer Contract.docx',                fileUrl: '/documents/maf-retainer-contract.docx',    fileType: 'application/msword',       fileSize: 94000,   category: 'CONTRACT' as const, linkedEntityType: 'contract', uploadedById: layla.id },
    { name: 'Team Meeting Notes — Apr 2026.docx',       fileUrl: '/documents/team-notes-apr2026.docx',       fileType: 'application/msword',       fileSize: 48000,   category: 'REPORT'   as const,                               uploadedById: admin.id },
    { name: 'Dubai Holding Mockups v3.pdf',              fileUrl: '/documents/dh-mockups-v3.pdf',             fileType: 'application/pdf',          fileSize: 5600000, category: 'ASSET'    as const, linkedEntityType: 'project',  uploadedById: omar.id },
    { name: 'Invoice Template — ZainHub.docx',          fileUrl: '/documents/invoice-template.docx',         fileType: 'application/msword',       fileSize: 65000,   category: 'OTHER'    as const,                               uploadedById: admin.id },
  ]

  for (const d of documentsData) {
    await prisma.document.create({
      data: {
        tenantId: tenant.id,
        name: d.name,
        fileUrl: d.fileUrl,
        fileType: d.fileType,
        fileSize: d.fileSize,
        category: d.category,
        linkedEntityType: d.linkedEntityType || null,
        uploadedById: d.uploadedById,
      },
    })
  }

  // ============================================================================
  // 27. ACTIVITIES (Recent timeline entries)
  // ============================================================================
  // Re-query tasks and tickets to build ID maps for activities
  const taskMap: Record<string, any> = {}
  for (const tk of await prisma.task.findMany({ where: { tenantId: tenant.id }, select: { id: true, taskNumber: true } })) {
    taskMap[tk.taskNumber] = tk
  }
  const ticketMap: Record<string, any> = {}
  for (const tk of await prisma.ticket.findMany({ where: { tenantId: tenant.id }, select: { id: true, ticketNumber: true } })) {
    ticketMap[tk.ticketNumber] = tk
  }

  const activitiesData = [
    { type: 'NOTE'              as const, entityType: 'lead',        entityKey: 'LD-0001', entityMap: leadRecords,    title: 'Initial discovery call with Tariq',                  description: 'Discussed AI chatbot needs. Budget approved by board. Follow up Thursday.',                        performedById: omar.id,  performedAt: daysAgo(1) },
    { type: 'CALL'              as const, entityType: 'lead',        entityKey: 'LD-0004', entityMap: leadRecords,    title: 'Follow-up call — Reem (Etisalat)',                   description: 'Confirmed meeting for next week. Very interested in AI Agent Workflow.',                             performedById: sarah.id, performedAt: daysAgo(0) },
    { type: 'EMAIL'             as const, entityType: 'opportunity', entityKey: 'OPP-0001', entityMap: oppRecords,   title: 'Sent Al Futtaim chatbot demo link',                  description: 'Personalized Loom demo showing FAQ bot on e-commerce site.',                                          performedById: sarah.id, performedAt: daysAgo(2) },
    { type: 'MEETING'           as const, entityType: 'opportunity', entityKey: 'OPP-0002', entityMap: oppRecords,   title: 'Dubai Holding website kickoff meeting',              description: '2-hour session. Stakeholders aligned on scope and timeline. Sarah presenting wireframes next Monday.', performedById: sarah.id, performedAt: daysAgo(8) },
    { type: 'STATUS_CHANGE'     as const, entityType: 'project',     entityKey: 'PRJ-0004', entityMap: projectRecords, title: 'PRJ-0004 moved to Delivered',                      description: 'Client signed off brand assets. Archiving project.',                                                  performedById: omar.id,  performedAt: daysAgo(3) },
    { type: 'TASK_COMPLETED'    as const, entityType: 'task',        entityKey: 'TSK-0002', entityMap: taskMap,      title: 'Chatbot conversation flows completed',               description: '23 intent flows mapped across FAQ, booking, complaints.',                                             performedById: omar.id,  performedAt: daysAgo(6) },
    { type: 'DOCUMENT_UPLOADED' as const, entityType: 'project',     entityKey: 'PRJ-0001', entityMap: projectRecords, title: 'Uploaded Al Futtaim Requirements.pdf',             description: 'Final requirements approved by client. Shared on project portal.',                                    performedById: sarah.id, performedAt: daysAgo(25) },
    { type: 'STAGE_CHANGE'      as const, entityType: 'lead',        entityKey: 'LD-0004', entityMap: leadRecords,    title: 'Lead LD-0004 moved to Meeting Scheduled',            description: 'Call scheduled for Monday 14 Apr at 11AM.',                                                          performedById: sarah.id, performedAt: daysAgo(1) },
    { type: 'ASSIGNMENT'        as const, entityType: 'ticket',      entityKey: 'TKT-0003', entityMap: ticketMap,    title: 'TKT-0003 assigned to Ahmed',                         description: 'Escalated to senior dev — urgent PDF generation failure.',                                            performedById: layla.id, performedAt: daysAgo(0) },
    { type: 'COMMENT'           as const, entityType: 'ticket',      entityKey: 'TKT-0001', entityMap: ticketMap,    title: 'Added comment on TKT-0001',                          description: 'Investigating the after-hours shutdown. Likely a cron job conflict with the webhook heartbeat.',       performedById: omar.id,  performedAt: daysAgo(0) },
    { type: 'NOTE'              as const, entityType: 'company',     entityKey: 'STC',       entityMap: companyRecords, title: 'STC account note',                                 description: 'VP Innovation very interested. Need to schedule exec demo with CTO. Mention on-prem deployment.',       performedById: sarah.id, performedAt: daysAgo(4) },
    { type: 'CONVERSION'        as const, entityType: 'lead',        entityKey: 'LD-0010', entityMap: leadRecords,    title: 'Lead LD-0010 (Tabby) converted to opportunity',      description: 'Budget confirmed AED 55K. Moving to Sales Pipeline: Discovery stage.',                                 performedById: sarah.id, performedAt: daysAgo(7) },
    { type: 'EMAIL'             as const, entityType: 'lead',        entityKey: 'LD-0014', entityMap: leadRecords,    title: 'Sent proposal to Yousef (Omantel)',                  description: 'PRP-0004-draft sent for review. Following up Thursday.',                                              performedById: omar.id,  performedAt: daysAgo(3) },
    { type: 'CALL'              as const, entityType: 'lead',        entityKey: 'LD-0013', entityMap: leadRecords,    title: 'Discovery call with Sultan (Masdar)',                 description: 'Needs corporate website with AR/EN. Budget range 12-18K. Govt tender process — needs local partner.',    performedById: ahmed.id, performedAt: daysAgo(0) },
    { type: 'SYSTEM'            as const, entityType: 'invoice',     entityKey: 'INV-0005', entityMap: invoiceRecords, title: 'Invoice INV-0005 marked as overdue',               description: 'Auto-flagged by system — past due 5 days.',                                                           performedAt: daysAgo(0) },
    { type: 'SYSTEM'            as const, entityType: 'invoice',     entityKey: 'INV-0006', entityMap: invoiceRecords, title: 'Payment PAY-0005 received — AED 23,625 (Dubai Holding)', description: 'Full payment received. Invoice INV-0006 now closed.',                                        performedById: admin.id, performedAt: daysAgo(0) },
    { type: 'SYSTEM'            as const, entityType: 'invoice',     entityKey: 'INV-0002', entityMap: invoiceRecords, title: 'Payment PAY-0002 received — AED 6,300 (Arabian Adventures)', description: '50% upfront payment received for branding project.',                                    performedById: admin.id, performedAt: daysAgo(30) },
    { type: 'NOTE'              as const, entityType: 'lead',        entityKey: 'LD-0006', entityMap: leadRecords,    title: 'LinkedIn DM from Noura Al-Dosari (ENOC)',            description: 'Interested in AI automation for fuel station ops. Forwarded to Sarah.',                               performedById: layla.id, performedAt: daysAgo(2) },
    { type: 'EMAIL'             as const, entityType: 'opportunity', entityKey: 'OPP-0001', entityMap: oppRecords,   title: 'Sent Al Futtaim contract for signature',             description: 'CTR-0001 sent via DocuSign. Awaiting signature from Khalid Al-Rashidi.',                              performedById: sarah.id, performedAt: daysAgo(17) },
    { type: 'MEETING'           as const, entityType: 'company',     entityKey: 'MAF',       entityMap: companyRecords, title: 'MAF quarterly review meeting',                     description: 'Reviewed Q1 social metrics. MAF happy with engagement rates. Upsell: add TikTok channel.',              performedById: layla.id, performedAt: daysAgo(5) },
    { type: 'TASK_COMPLETED'    as const, entityType: 'task',        entityKey: 'TSK-0020', entityMap: taskMap,      title: 'SSL certificates renewed for 5 client domains',       description: 'All certificates valid until Apr 2027.',                                                             performedById: omar.id,  performedAt: daysAgo(4) },
    { type: 'STAGE_CHANGE'      as const, entityType: 'opportunity', entityKey: 'OPP-0003', entityMap: oppRecords,   title: 'OPP-0003 moved from Proposal to Negotiation',        description: 'STC reviewing contract clauses with internal legal team.',                                             performedById: sarah.id, performedAt: daysAgo(3) },
    { type: 'DOCUMENT_UPLOADED' as const, entityType: 'project',     entityKey: 'PRJ-0002', entityMap: projectRecords, title: 'Uploaded Dubai Holding Mockups v3.pdf',            description: 'Third revision. Client requested navbar redesign and hero section update.',                             performedById: omar.id,  performedAt: daysAgo(1) },
    { type: 'NOTE'              as const, entityType: 'opportunity', entityKey: 'OPP-0003', entityMap: oppRecords,   title: 'Noon procurement sent RFP',                          description: 'RFP for CRM automation. Response needed by Apr 20. Budget ceiling AED 60K.',                            performedById: omar.id,  performedAt: daysAgo(2) },
    { type: 'SYSTEM'            as const, entityType: 'contract',    entityKey: 'CTR-0002', entityMap: contractRecords, title: 'CTR-0002 (Arabian Adventures) expiring in 5 days', description: 'Auto-alert triggered. Renewal discussion needed.',                                                   performedAt: daysAgo(0) },
  ]

  for (const a of activitiesData) {
    const entityId = a.entityMap[a.entityKey]?.id || tenant.id
    await prisma.activity.create({
      data: {
        tenantId: tenant.id,
        type: a.type,
        entityType: a.entityType,
        entityId,
        title: a.title,
        description: a.description || null,
        performedById: a.performedById || null,
        performedAt: a.performedAt,
      },
    })
  }

  // ============================================================================
  // 27b. TICKET COMMENTS (for all tickets)
  // ============================================================================
  const ticketComments = [
    // TKT-0001 — Chatbot not responding after hours
    { ticketNumber: 'TKT-0001', authorId: omar.id,  content: 'Reproducing the issue now. Looks like the cron job that refreshes the auth token is conflicting with the WebSocket heartbeat. Will push a fix by EOD.', isInternal: false },
    { ticketNumber: 'TKT-0001', authorId: sarah.id, content: 'INTERNAL: Al Futtaim wants this resolved before Eid. Escalate if not fixed by tomorrow morning.', isInternal: true },
    // TKT-0002 — Multilingual support request
    { ticketNumber: 'TKT-0002', authorId: layla.id, content: 'Logged this as a feature request. Will include in Q3 roadmap. Dubai Holding needs AR + EN + Hindi support.', isInternal: true },
    // TKT-0003 — Invoice PDF generation
    { ticketNumber: 'TKT-0003', authorId: ahmed.id, content: 'Root cause found: the Decimal fields were serializing as strings causing the PDF renderer to crash. Fix deployed to staging — testing now.', isInternal: false },
    { ticketNumber: 'TKT-0003', authorId: layla.id, content: 'MAF needs this resolved for their end-of-month billing. Please confirm production deploy.', isInternal: false },
    // TKT-0004 — Already resolved
    { ticketNumber: 'TKT-0004', authorId: omar.id,  content: 'Resolution: Walked client through Settings → Branding → Colors. Updated primary and secondary brand colors. Client confirmed it looks correct.', isInternal: false },
    // TKT-0005 — Timezone issue
    { ticketNumber: 'TKT-0005', authorId: layla.id, content: 'Issue is that the scheduler was using UTC timestamps but the display UI was showing Gulf Standard Time without conversion. Fix is straightforward.', isInternal: true },
    { ticketNumber: 'TKT-0005', authorId: layla.id, content: 'Waiting on client to confirm which timezone they want as their account default (GST vs AST). Sent email 3 days ago — following up.', isInternal: false },
    // TKT-0006 — WhatsApp channel
    { ticketNumber: 'TKT-0006', authorId: sarah.id, content: 'Added to PRJ-0005 scope. WhatsApp Business API integration requires Meta Business verification. Sending documentation to Property Finder team.', isInternal: false },
  ]

  // ticketMap already built in activities section above
  for (const tc of ticketComments) {
    if (!ticketMap[tc.ticketNumber]) continue
    await prisma.ticketComment.create({
      data: {
        ticketId: ticketMap[tc.ticketNumber].id,
        authorId: tc.authorId,
        content: tc.content,
        isInternal: tc.isInternal,
      },
    })
  }

  // ============================================================================
  // 28. NOTIFICATIONS
  // ============================================================================
  const notificationsData = [
    { userId: sarah.id, type: 'task_assigned',      title: 'New task assigned: Prepare discovery document for STC',        entityType: 'task',     actionUrl: '/tasks' },
    { userId: omar.id,  type: 'ticket_assigned',    title: 'Ticket TKT-0001 assigned to you',                               entityType: 'ticket',   actionUrl: '/tickets' },
    { userId: ahmed.id, type: 'ticket_assigned',    title: 'Urgent: TKT-0003 — Invoice PDF not generating',                entityType: 'ticket',   actionUrl: '/tickets' },
    { userId: admin.id, type: 'invoice_overdue',    title: 'Invoice INV-0005 (Kitopi) is overdue',                          entityType: 'invoice',  actionUrl: '/invoices' },
    { userId: sarah.id, type: 'lead_new',           title: 'New hot lead: Sultan Al-Kendi (Masdar)',                        entityType: 'lead',     actionUrl: '/leads' },
    { userId: layla.id, type: 'project_at_risk',    title: 'Project PRJ-0003 marked as At Risk',                           entityType: 'project',  actionUrl: '/projects' },
    { userId: admin.id, type: 'expense_pending',    title: '3 expenses pending approval — total AED 9,020',                entityType: 'expense',  actionUrl: '/expenses' },
    { userId: omar.id,  type: 'lead_followup',      title: 'Follow-up due: Tariq Al-Muhairi (Emirates NBD)',               entityType: 'lead',     actionUrl: '/leads', isRead: true, readAt: daysAgo(0) },
    { userId: sarah.id, type: 'proposal_viewed',    title: 'Proposal PRP-0004 viewed by STC contact',                      entityType: 'proposal', actionUrl: '/proposals' },
    { userId: ahmed.id, type: 'task_due',           title: 'Task TSK-0005 due tomorrow: Send Kitopi mockups',              entityType: 'task',     actionUrl: '/tasks' },
    { userId: admin.id, type: 'payment_received',   title: 'Payment received AED 23,625 from Dubai Holding',              entityType: 'payment',  actionUrl: '/payments', isRead: true, readAt: daysAgo(0) },
    { userId: sarah.id, type: 'contract_expiring',  title: 'Contract CTR-0002 (Arabian Adventures) expires in 5 days',   entityType: 'contract', actionUrl: '/contracts' },
    { userId: layla.id, type: 'task_assigned',      title: 'New task: Review MAF content calendar',                        entityType: 'task',     actionUrl: '/tasks' },
    { userId: omar.id,  type: 'task_assigned',      title: 'New task: Set up staging for Dubai Holding',                  entityType: 'task',     actionUrl: '/tasks' },
    { userId: admin.id, type: 'lead_converted',     title: 'Lead LD-0010 (Tabby) converted to Opportunity by Sarah',     entityType: 'lead',     actionUrl: '/leads', isRead: true, readAt: daysAgo(7) },
    { userId: sarah.id, type: 'proposal_accepted',  title: 'Proposal PRP-0001 accepted by Al Futtaim!',                   entityType: 'proposal', actionUrl: '/proposals', isRead: true, readAt: daysAgo(18) },
    { userId: admin.id, type: 'invoice_paid',       title: 'Invoice INV-0002 (Arabian Adventures) fully paid — AED 12,600', entityType: 'invoice', actionUrl: '/invoices', isRead: true, readAt: daysAgo(15) },
    { userId: omar.id,  type: 'mention',            title: 'Sarah mentioned you in PRJ-0005 discussion',                  entityType: 'project',  actionUrl: '/projects' },
    { userId: ahmed.id, type: 'task_overdue',       title: 'Task TSK-0016 is overdue: Fix TKT-0003 PDF bug',             entityType: 'task',     actionUrl: '/tasks' },
    { userId: sarah.id, type: 'lead_new',           title: 'New inbound lead from zainhub.ae contact form: Noura (ENOC)', entityType: 'lead',     actionUrl: '/leads' },
  ]

  for (const n of notificationsData) {
    await prisma.notification.create({
      data: {
        tenantId: tenant.id,
        userId: n.userId,
        type: n.type,
        title: n.title,
        entityType: n.entityType || null,
        actionUrl: n.actionUrl || null,
        isRead: n.isRead || false,
        readAt: n.readAt || null,
      },
    })
  }

  // ============================================================================
  // 29. NUMBER SEQUENCES (to keep auto-numbering consistent)
  // ============================================================================
  const sequences = [
    { entityType: 'company',     prefix: 'COM', lastNumber: 10 },
    { entityType: 'contact',     prefix: 'CON', lastNumber: 12 },
    { entityType: 'lead',        prefix: 'LD',  lastNumber: 15 },
    { entityType: 'opportunity', prefix: 'OPP', lastNumber: 10 },
    { entityType: 'project',     prefix: 'PRJ', lastNumber: 6  },
    { entityType: 'quotation',   prefix: 'QUO', lastNumber: 6  },
    { entityType: 'proposal',    prefix: 'PRP', lastNumber: 4  },
    { entityType: 'contract',    prefix: 'CTR', lastNumber: 5  },
    { entityType: 'invoice',     prefix: 'INV', lastNumber: 6  },
    { entityType: 'payment',     prefix: 'PAY', lastNumber: 8  },
    { entityType: 'expense',     prefix: 'EXP', lastNumber: 16 },
    { entityType: 'ticket',      prefix: 'TKT', lastNumber: 6  },
    { entityType: 'task',        prefix: 'TSK', lastNumber: 20 },
  ]

  for (const seq of sequences) {
    await prisma.numberSequence.upsert({
      where: { tenantId_entityType: { tenantId: tenant.id, entityType: seq.entityType } },
      update: { lastNumber: seq.lastNumber, prefix: seq.prefix },
      create: { tenantId: tenant.id, entityType: seq.entityType, prefix: seq.prefix, lastNumber: seq.lastNumber },
    })
  }

  // ============================================================================
  // 30. SETTINGS
  // ============================================================================
  const settingsData = [
    { key: 'company.name', value: 'Zain Hub AI Solutions' },
    { key: 'company.email', value: 'hello@zainhub.ae' },
    { key: 'company.phone', value: '+971501234567' },
    { key: 'company.address', value: 'Dubai Internet City, Dubai, UAE' },
    { key: 'company.website', value: 'https://zainhub.ae' },
    { key: 'company.taxNumber', value: 'TRN-100-123-456-789' },
    { key: 'invoice.prefix', value: 'INV' },
    { key: 'invoice.defaultTerms', value: 'Payment due within 30 days of invoice date. Late payments subject to 2% monthly interest.' },
    { key: 'invoice.defaultNotes', value: 'Thank you for your business!' },
    { key: 'quotation.prefix', value: 'QUO' },
    { key: 'quotation.defaultValidity', value: 30 },
    { key: 'proposal.prefix', value: 'PRP' },
    { key: 'notification.email', value: true },
    { key: 'notification.browser', value: true },
    { key: 'locale.defaultLanguage', value: 'en' },
    { key: 'locale.supportedLanguages', value: ['en', 'ar'] },
    { key: 'theme.primaryColor', value: '#1E40AF' },
    { key: 'theme.secondaryColor', value: '#3B82F6' },
  ]

  for (const s of settingsData) {
    await prisma.setting.create({
      data: { tenantId: tenant.id, key: s.key, value: s.value as any },
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
  console.log(`   Projects: ${projectsData.length}`)
  console.log(`   Campaigns: ${campaignsData.length}`)
  console.log(`   Quotations: ${quotationsData.length} (multi-line items)`)
  console.log(`   Proposals: ${proposalsData.length} (multi-line items)`)
  console.log(`   Contracts: ${contractsData.length}`)
  console.log(`   Invoices: ${invoicesData.length}`)
  console.log(`   Payments: ${paymentsData.length}`)
  console.log(`   Expenses: ${expensesData.length}`)
  console.log(`   Tickets: ${ticketsData.length} (with comments)`)
  console.log(`   Tasks: ${tasksData.length}`)
  console.log(`   Activities: ${activitiesData.length}`)
  console.log(`   Notifications: ${notificationsData.length}`)
  console.log(`   Documents: ${documentsData.length}`)
  console.log(`   Service Categories: 17`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
