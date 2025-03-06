// Use CommonJS syntax for imports
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function populateScheduleSeats() {
  console.log("Starting to populate schedule seats for existing schedules...");

  try {
    // Get all schedules that have a bus assigned
    const schedules = await prisma.schedule.findMany({
      where: {
        busId: {
          not: null,
        },
      },
      include: {
        bus: true,
      },
    });

    console.log(`Found ${schedules.length} schedules with buses assigned.`);

    // Process each schedule
    for (const schedule of schedules) {
      console.log(
        `Processing schedule ${schedule.id} with bus ${schedule.busId}...`
      );

      // Check if schedule seats already exist for this schedule
      const existingSeatsCount = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM "schedule_seats" WHERE "schedule_id" = ${schedule.id}
      `;

      if (existingSeatsCount[0].count > 0) {
        console.log(
          `Schedule ${schedule.id} already has ${existingSeatsCount[0].count} seats. Skipping.`
        );
        continue;
      }

      // Get all seats for the bus
      let busSeats = await prisma.busSeat.findMany({
        where: {
          busId: schedule.busId,
        },
      });

      console.log(`Found ${busSeats.length} seats for bus ${schedule.busId}.`);

      // If no bus seats exist, create them from the seatMatrix
      if (busSeats.length === 0 && schedule.bus && schedule.bus.seatMatrix) {
        console.log(
          `Creating bus seats from seatMatrix for bus ${schedule.busId}...`
        );

        try {
          const seatMatrix = JSON.parse(schedule.bus.seatMatrix);
          const allSeats = [];

          // Process first floor seats
          if (seatMatrix.firstFloor && seatMatrix.firstFloor.seats) {
            allSeats.push(...seatMatrix.firstFloor.seats);
          }

          // Process second floor seats
          if (seatMatrix.secondFloor && seatMatrix.secondFloor.seats) {
            allSeats.push(...seatMatrix.secondFloor.seats);
          }

          console.log(`Found ${allSeats.length} seats in seatMatrix.`);

          // Create BusSeat records
          for (const seat of allSeats) {
            if (seat.isEmpty) continue; // Skip empty seats

            await prisma.busSeat.create({
              data: {
                busId: schedule.busId,
                seatNumber: seat.id,
                tierId: seat.tierId || null,
                status: seat.status || "available",
                isActive: true,
              },
            });
          }

          console.log(
            `Created ${allSeats.filter((s) => !s.isEmpty).length} bus seats for bus ${schedule.busId}.`
          );

          // Fetch the newly created bus seats
          busSeats = await prisma.busSeat.findMany({
            where: {
              busId: schedule.busId,
            },
          });
        } catch (error) {
          console.error(
            `Error creating bus seats for bus ${schedule.busId}:`,
            error
          );
          continue;
        }
      }

      if (busSeats.length === 0) {
        console.log(`No seats found for bus ${schedule.busId}. Skipping.`);
        continue;
      }

      // Create schedule seats for each bus seat
      let createdCount = 0;
      for (const seat of busSeats) {
        try {
          await prisma.scheduleSeat.create({
            data: {
              scheduleId: schedule.id,
              busSeatId: seat.id,
              status: seat.status || "available",
              isActive: seat.isActive,
            },
          });
          createdCount++;
        } catch (error) {
          console.error(
            `Error creating schedule seat for bus seat ${seat.id}:`,
            error
          );
        }
      }

      console.log(
        `Created ${createdCount} schedule seats for schedule ${schedule.id}.`
      );
    }

    console.log("Finished populating schedule seats for existing schedules.");
  } catch (error) {
    console.error("Error populating schedule seats:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
populateScheduleSeats()
  .then(() => console.log("Script completed successfully."))
  .catch((error) => console.error("Script failed:", error));
