-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_schedule_id_bus_seat_id_fkey";

-- DropIndex
DROP INDEX "schedule_seats_bus_seat_id_idx";

-- DropIndex
DROP INDEX "schedule_seats_schedule_id_idx";

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_schedule_id_bus_seat_id_fkey" FOREIGN KEY ("schedule_id", "bus_seat_id") REFERENCES "schedule_seats"("schedule_id", "bus_seat_id") ON DELETE RESTRICT ON UPDATE CASCADE;
