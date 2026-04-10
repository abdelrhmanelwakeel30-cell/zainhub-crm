import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  try {
    const form = await prisma.leadCaptureForm.findFirst({
      where: { slug, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        fields: true,
        thankYouMsg: true,
        redirectUrl: true,
      },
    })
    if (!form) return NextResponse.json({ success: false, error: 'Form not found' }, { status: 404 })

    return NextResponse.json({
      success: true,
      data: {
        ...form,
        fields: JSON.parse(form.fields),
      },
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  try {
    const form = await prisma.leadCaptureForm.findFirst({
      where: { slug, isActive: true },
    })
    if (!form) return NextResponse.json({ success: false, error: 'Form not found' }, { status: 404 })

    const body = await req.json()
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null
    const userAgent = req.headers.get('user-agent') || null

    // Try to create a lead from the submission
    let leadId: string | null = null
    try {
      // Get the next lead number
      const count = await prisma.lead.count({ where: { tenantId: form.tenantId } })
      const leadNumber = `LD-${String(count + 1).padStart(4, '0')}`

      const fullName = body.name || body.fullName || body.full_name || ''
      const email = body.email || null
      const phone = body.phone || null

      if (fullName) {
        const lead = await prisma.lead.create({
          data: {
            tenantId: form.tenantId,
            leadNumber,
            fullName,
            email,
            phone,
            sourceId: null,
            assignedToId: form.assignToId || null,
            landingPage: form.slug,
            utmSource: form.sourceTag || null,
          },
        })
        leadId = lead.id
      }
    } catch (leadErr) {
      console.error('Could not create lead from form submission:', leadErr)
    }

    const submission = await prisma.leadCaptureSubmission.create({
      data: {
        tenantId: form.tenantId,
        formId: form.id,
        data: JSON.stringify(body),
        ipAddress,
        userAgent,
        leadId,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        submissionId: submission.id,
        thankYouMsg: form.thankYouMsg,
        redirectUrl: form.redirectUrl,
      },
    }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
