-- AlterTable
ALTER TABLE "users" ADD COLUMN "line_user_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_line_user_id_key" ON "users"("line_user_id");
