import { describe, it, expect } from 'vitest'
import { totpAvailable, generateTotpSecret, buildOtpauthUri, verifyTotp } from '@/lib/totp'
import { generate } from 'otplib'

describe('totp wrapper', () => {
  it('reports availability when otplib is installed', async () => {
    expect(await totpAvailable()).toBe(true)
  })

  it('generates a secret and a valid otpauth uri', async () => {
    const secret = await generateTotpSecret()
    expect(secret).toBeTruthy()
    const uri = await buildOtpauthUri(secret!, 'user@example.com')
    expect(uri).toContain('otpauth://totp/')
    expect(uri).toContain('secret=')
  })

  it('verifies a freshly generated token and rejects a bad one', async () => {
    const secret = await generateTotpSecret()
    const token = await generate({ secret: secret! })
    expect(await verifyTotp(secret!, token)).toBe(true)
    expect(await verifyTotp(secret!, '000000')).toBe(false)
  })

  it('rejects malformed tokens without throwing', async () => {
    const secret = await generateTotpSecret()
    expect(await verifyTotp(secret!, 'abc')).toBe(false)
    expect(await verifyTotp(secret!, '12345')).toBe(false)
  })
})
