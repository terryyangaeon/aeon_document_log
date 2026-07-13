-- CreateTable
CREATE TABLE "audit_log" (
    "id" SERIAL NOT NULL,
    "document_id" INTEGER NOT NULL,
    "reference" VARCHAR(50) NOT NULL,
    "user_name" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "document_log"("id") ON DELETE CASCADE ON UPDATE CASCADE;
