-- CreateTable
CREATE TABLE "line_link_tokens" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "user_id" TEXT,
    "note" TEXT,
    "expires_at" TIMESTAMP(3),
    "used_at" TIMESTAMP(3),
    "used_by_line_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "line_link_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "line_link_tokens_code_key" ON "line_link_tokens"("code");
