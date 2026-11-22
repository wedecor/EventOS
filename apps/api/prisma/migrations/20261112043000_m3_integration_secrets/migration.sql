-- M3: encrypted write-only secret columns for integration settings
ALTER TABLE "integration_settings" ADD COLUMN "smtp_user" TEXT;
ALTER TABLE "integration_settings" ADD COLUMN "smtp_password_encrypted" TEXT;
ALTER TABLE "integration_settings" ADD COLUMN "storage_access_key" TEXT;
ALTER TABLE "integration_settings" ADD COLUMN "storage_secret_encrypted" TEXT;
