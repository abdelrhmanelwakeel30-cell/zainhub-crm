import { createUploadthing, type FileRouter } from 'uploadthing/server'
import { getSession } from '@/lib/api-helpers'

const f = createUploadthing()

export const ourFileRouter = {
  documentUploader: f({
    pdf: { maxFileSize: '16MB', maxFileCount: 5 },
    image: { maxFileSize: '8MB', maxFileCount: 10 },
    text: { maxFileSize: '4MB', maxFileCount: 5 },
    blob: { maxFileSize: '16MB', maxFileCount: 5 },
  })
    .middleware(async () => {
      const session = await getSession()
      if (!session?.user) throw new Error('Unauthorized')
      return { userId: session.user.id, tenantId: session.user.tenantId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, tenantId: metadata.tenantId, url: file.ufsUrl, name: file.name, size: file.size }
    }),

  avatarUploader: f({ image: { maxFileSize: '2MB', maxFileCount: 1 } })
    .middleware(async () => {
      const session = await getSession()
      if (!session?.user) throw new Error('Unauthorized')
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl }
    }),

  expenseReceipt: f({
    pdf: { maxFileSize: '8MB', maxFileCount: 1 },
    image: { maxFileSize: '8MB', maxFileCount: 3 },
  })
    .middleware(async () => {
      const session = await getSession()
      if (!session?.user) throw new Error('Unauthorized')
      return { userId: session.user.id, tenantId: session.user.tenantId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, tenantId: metadata.tenantId, url: file.ufsUrl, name: file.name, size: file.size }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
