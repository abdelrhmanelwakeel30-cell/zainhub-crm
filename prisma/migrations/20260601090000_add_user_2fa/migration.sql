-- S-4: Staff TOTP two-factor auth fields on User (additive, nullable/defaulted)
ALTER TABLE "User" ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT;
