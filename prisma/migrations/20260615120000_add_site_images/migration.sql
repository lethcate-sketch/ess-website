-- CreateTable
CREATE TABLE "site_images" (
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_images_pkey" PRIMARY KEY ("key")
);
