-- CreateEnum
CREATE TYPE "LiquidationStatus" AS ENUM ('pending', 'approved', 'rejected', 'finalized');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('pending', 'approved', 'rejected');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SettlementStatus" ADD VALUE 'processing';
ALTER TYPE "SettlementStatus" ADD VALUE 'disputed';

-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_schedule_id_bus_seat_id_fkey";

-- DropIndex
DROP INDEX "schedule_seats_bus_seat_id_idx";

-- DropIndex
DROP INDEX "schedule_seats_schedule_id_idx";

-- CreateTable
CREATE TABLE "trip_liquidations" (
    "id" TEXT NOT NULL,
    "trip_settlement_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "liquidation_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "route_name" TEXT NOT NULL,
    "plate_number" TEXT NOT NULL,
    "bus_type" TEXT,
    "departure_time" TIMESTAMP(3) NOT NULL,
    "total_passengers" INTEGER NOT NULL,
    "passenger_breakdown" JSONB NOT NULL,
    "income_breakdown" JSONB NOT NULL,
    "total_income" DECIMAL(10,2) NOT NULL,
    "total_expenses" DECIMAL(10,2) NOT NULL,
    "net_amount" DECIMAL(10,2) NOT NULL,
    "office_fee_percent" DECIMAL(5,2),
    "office_amount" DECIMAL(10,2),
    "is_printed" BOOLEAN NOT NULL DEFAULT false,
    "admin_by" TEXT,
    "status" "LiquidationStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_liquidations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_expenses" (
    "id" TEXT NOT NULL,
    "trip_settlement_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "evidence_url" TEXT,
    "registered_by" TEXT,
    "expense_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "company_id" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trip_liquidations_trip_settlement_id_key" ON "trip_liquidations"("trip_settlement_id");

-- AddForeignKey
ALTER TABLE "trip_liquidations" ADD CONSTRAINT "trip_liquidations_trip_settlement_id_fkey" FOREIGN KEY ("trip_settlement_id") REFERENCES "trip_settlements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_expenses" ADD CONSTRAINT "trip_expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_expenses" ADD CONSTRAINT "trip_expenses_trip_settlement_id_fkey" FOREIGN KEY ("trip_settlement_id") REFERENCES "trip_settlements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
