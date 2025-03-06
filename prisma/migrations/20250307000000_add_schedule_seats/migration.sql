-- CreateTable
CREATE TABLE "schedule_seats" (
    "schedule_id" TEXT NOT NULL,
    "bus_seat_id" TEXT NOT NULL,
    "status" "SeatStatus" NOT NULL DEFAULT 'available',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_seats_pkey" PRIMARY KEY ("schedule_id","bus_seat_id")
);

-- AddForeignKey
ALTER TABLE "schedule_seats" ADD CONSTRAINT "schedule_seats_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_seats" ADD CONSTRAINT "schedule_seats_bus_seat_id_fkey" FOREIGN KEY ("bus_seat_id") REFERENCES "bus_seats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_schedule_id_bus_seat_id_fkey" FOREIGN KEY ("schedule_id", "bus_seat_id") REFERENCES "schedule_seats"("schedule_id", "bus_seat_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "schedule_seats_schedule_id_idx" ON "schedule_seats"("schedule_id");

-- CreateIndex
CREATE INDEX "schedule_seats_bus_seat_id_idx" ON "schedule_seats"("bus_seat_id"); 