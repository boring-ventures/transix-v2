/*
  Warnings:

  - You are about to drop the `bus_logs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "bus_logs" DROP CONSTRAINT "bus_logs_location_id_fkey";

-- DropForeignKey
ALTER TABLE "bus_logs" DROP CONSTRAINT "bus_logs_logged_by_fkey";

-- DropTable
DROP TABLE "bus_logs";

-- CreateTable
CREATE TABLE "BusLog" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusLog_scheduleId_idx" ON "BusLog"("scheduleId");

-- CreateIndex
CREATE INDEX "BusLog_profileId_idx" ON "BusLog"("profileId");

-- AddForeignKey
ALTER TABLE "BusLog" ADD CONSTRAINT "BusLog_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusLog" ADD CONSTRAINT "BusLog_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
