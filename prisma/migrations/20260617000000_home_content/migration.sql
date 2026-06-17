-- CreateTable
CREATE TABLE "home_content" (
    "id" TEXT NOT NULL,
    "hero_title" TEXT,
    "hero_subtitle" TEXT,
    "feature_eyebrow" TEXT,
    "feature_title" TEXT,
    "feature_items" TEXT,
    "gallery_eyebrow" TEXT,
    "gallery_title" TEXT,
    "gallery_items" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_content_pkey" PRIMARY KEY ("id")
);
