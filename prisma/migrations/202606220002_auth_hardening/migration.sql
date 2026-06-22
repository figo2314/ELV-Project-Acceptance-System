ALTER TABLE "users"
ADD COLUMN "must_change_password" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "failed_login_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "locked_until" TIMESTAMPTZ(6),
ADD COLUMN "password_changed_at" TIMESTAMPTZ(6);

CREATE INDEX "users_locked_until_idx" ON "users"("locked_until");
