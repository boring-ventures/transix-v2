/*
  Warnings:

  - You are about to drop the column `admin_by` on the `trip_liquidations` table. All the data in the column will be lost.
  - You are about to drop the column `bus_type` on the `trip_liquidations` table. All the data in the column will be lost.
  - You are about to drop the column `departure_time` on the `trip_liquidations` table. All the data in the column will be lost.
  - You are about to drop the column `income_breakdown` on the `trip_liquidations` table. All the data in the column will be lost.
  - You are about to drop the column `liquidation_date` on the `trip_liquidations` table. All the data in the column will be lost.
  - You are about to drop the column `net_amount` on the `trip_liquidations` table. All the data in the column will be lost.
  - You are about to drop the column `office_amount` on the `trip_liquidations` table. All the data in the column will be lost.
  - You are about to drop the column `office_fee_percent` on the `trip_liquidations` table. All the data in the column will be lost.
  - You are about to drop the column `owner_id` on the `trip_liquidations` table. All the data in the column will be lost.
  - You are about to drop the column `passenger_breakdown` on the `trip_liquidations` table. All the data in the column will be lost.
  - You are about to drop the column `plate_number` on the `trip_liquidations` table. All the data in the column will be lost.
  - You are about to drop the column `route_name` on the `trip_liquidations` table. All the data in the column will be lost.
  - You are about to drop the column `total_expenses` on the `trip_liquidations` table. All the data in the column will be lost.
  - You are about to drop the column `total_income` on the `trip_liquidations` table. All the data in the column will be lost.
  - You are about to drop the column `total_passengers` on the `trip_liquidations` table. All the data in the column will be lost.
  - You are about to drop the column `trip_settlement_id` on the `trip_liquidations` table. All the data in the column will be lost.
  - You are about to drop the `trip_expenses` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[trip_id]` on the table `trip_liquidations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `created_by` to the `trip_liquidations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trip_id` to the `trip_liquidations` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "trip_expenses" DROP CONSTRAINT "trip_expenses_category_id_fkey";

-- DropForeignKey
ALTER TABLE "trip_expenses" DROP CONSTRAINT "trip_expenses_trip_settlement_id_fkey";

-- DropForeignKey
ALTER TABLE "trip_liquidations" DROP CONSTRAINT "trip_liquidations_trip_settlement_id_fkey";

-- DropIndex
DROP INDEX "trip_liquidations_trip_settlement_id_key";

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "trip_id" TEXT;

-- AlterTable
ALTER TABLE "trip_liquidations" DROP COLUMN "admin_by",
DROP COLUMN "bus_type",
DROP COLUMN "departure_time",
DROP COLUMN "income_breakdown",
DROP COLUMN "liquidation_date",
DROP COLUMN "net_amount",
DROP COLUMN "office_amount",
DROP COLUMN "office_fee_percent",
DROP COLUMN "owner_id",
DROP COLUMN "passenger_breakdown",
DROP COLUMN "plate_number",
DROP COLUMN "route_name",
DROP COLUMN "total_expenses",
DROP COLUMN "total_income",
DROP COLUMN "total_passengers",
DROP COLUMN "trip_settlement_id",
ADD COLUMN     "created_by" TEXT NOT NULL,
ADD COLUMN     "trip_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "trip_settlements" ADD COLUMN     "tripLiquidationId" TEXT;

-- DropTable
DROP TABLE "trip_expenses";

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "evidence_url" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tripSettlementId" TEXT,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "bus_id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "departure_time" TIMESTAMP(3) NOT NULL,
    "arrival_time" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trip_liquidations_trip_id_key" ON "trip_liquidations"("trip_id");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_settlements" ADD CONSTRAINT "trip_settlements_tripLiquidationId_fkey" FOREIGN KEY ("tripLiquidationId") REFERENCES "trip_liquidations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_liquidations" ADD CONSTRAINT "trip_liquidations_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_tripSettlementId_fkey" FOREIGN KEY ("tripSettlementId") REFERENCES "trip_settlements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_bus_id_fkey" FOREIGN KEY ("bus_id") REFERENCES "buses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
