-- CreateTable
CREATE TABLE "Starwars" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,

    CONSTRAINT "Starwars_pkey" PRIMARY KEY ("id")
);
