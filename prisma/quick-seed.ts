import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Helper function to create users in Supabase Auth
async function createSupabaseUser(email: string, password: string) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error && error.status === 422) {
      // User already exists, get existing user
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = users?.users?.find(u => u.email === email);
      if (existingUser) {
        console.log(`✅ User ${email} already exists`);
        return existingUser.id;
      }
    }

    if (error) {
      console.error(`❌ Error creating user ${email}:`, error);
      throw error;
    }

    console.log(`✅ Created user: ${email}`);
    return data.user?.id;
  } catch (error) {
    console.error(`❌ Failed to create user ${email}:`, error);
    throw error;
  }
}

async function main() {
  console.log("🌱 Starting quick database seed...");

  try {
    // Create Companies
    console.log("🏢 Creating companies...");
    const company = await prisma.company.create({
      data: {
        name: "TransitX Express",
        active: true,
      },
    });
    console.log(`✅ Created company: ${company.name}`);

    // Create Branch
    console.log("🏪 Creating branch...");
    const branch = await prisma.branch.create({
      data: {
        companyId: company.id,
        name: "Main Branch",
        address: "123 Main Street",
        city: "Metropolitan City",
        active: true,
      },
    });
    console.log(`✅ Created branch: ${branch.name}`);

    // Create Users and Profiles
    console.log("👥 Creating users and profiles...");
    const userCredentials = [
      { email: "superadmin@transix.com", password: "SuperAdmin123!", role: "superadmin", fullName: "Super Administrator" },
      { email: "admin@transix.com", password: "Admin123!", role: "company_admin", fullName: "System Admin" },
      { email: "manager@transix.com", password: "Manager123!", role: "branch_admin", fullName: "Branch Manager" },
      { email: "seller@transix.com", password: "Seller123!", role: "seller", fullName: "Ticket Seller" },
    ];

    const profiles = [];
    for (const cred of userCredentials) {
      try {
        const userId = await createSupabaseUser(cred.email, cred.password);
        if (userId) {
          const profile = await prisma.profile.create({
            data: {
              userId,
              email: cred.email,
              fullName: cred.fullName,
              role: cred.role as any,
              companyId: cred.role === "superadmin" ? null : company.id,
              branchId: cred.role === "branch_admin" || cred.role === "seller" ? branch.id : null,
              active: true,
            },
          });
          profiles.push(profile);
          console.log(`✅ Created profile: ${cred.email} (${cred.role})`);
        }
      } catch (error) {
        console.error(`❌ Failed to create profile for ${cred.email}`);
      }
    }

    // Create Seat Tiers
    console.log("💺 Creating seat tiers...");
    const seatTiers = await Promise.all([
      prisma.seatTier.create({
        data: {
          companyId: company.id,
          name: "Economy",
          description: "Standard seating",
          basePrice: 50.00,
          isActive: true,
        },
      }),
      prisma.seatTier.create({
        data: {
          companyId: company.id,
          name: "Premium",
          description: "Premium seating",
          basePrice: 75.00,
          isActive: true,
        },
      }),
    ]);
    console.log(`✅ Created ${seatTiers.length} seat tiers`);

    // Create Bus Type Template
    console.log("🚌 Creating bus template...");
    const busTemplate = await prisma.busTypeTemplate.create({
      data: {
        companyId: company.id,
        name: "Standard Bus 40",
        description: "Standard 40-seater bus",
        totalCapacity: 40,
        type: "standard",
        seatTemplateMatrix: JSON.stringify({
          firstFloor: {
            rows: 10,
            columns: 4,
            seats: Array.from({ length: 40 }, (_, i) => ({
              id: `S${i + 1}`,
              row: Math.floor(i / 4),
              column: i % 4,
              isEmpty: false,
              tierId: seatTiers[i % 2].id, // Alternate between Economy and Premium
            })),
          },
        }),
        seatsLayout: "2+2",
        isActive: true,
      },
    });
    console.log(`✅ Created bus template: ${busTemplate.name}`);

    // Create Bus
    console.log("🚍 Creating bus...");
    const bus = await prisma.bus.create({
      data: {
        companyId: company.id,
        templateId: busTemplate.id,
        plateNumber: "BUS-001",
        isActive: true,
        seatMatrix: busTemplate.seatTemplateMatrix,
        maintenanceStatus: "active",
      },
    });
    console.log(`✅ Created bus: ${bus.plateNumber}`);

    // Create Bus Seats
    console.log("💺 Creating bus seats...");
    const seatMatrix = JSON.parse(busTemplate.seatTemplateMatrix);
    const busSeats = [];

    for (const seat of seatMatrix.firstFloor.seats) {
      if (!seat.isEmpty) {
        busSeats.push({
          busId: bus.id,
          seatNumber: seat.id,
          tierId: seat.tierId,
          status: "available",
          isActive: true,
        });
      }
    }

    await prisma.busSeat.createMany({
      data: busSeats,
    });
    console.log(`✅ Created ${busSeats.length} bus seats`);

    // Create Driver
    console.log("👨‍✈️ Creating driver...");
    const driver = await prisma.driver.create({
      data: {
        companyId: company.id,
        fullName: "Carlos Rodriguez",
        documentId: "DOC-12345",
        licenseNumber: "LIC-67890",
        licenseCategory: "D1",
        active: true,
      },
    });
    console.log(`✅ Created driver: ${driver.fullName}`);

    // Create Locations
    console.log("📍 Creating locations...");
    const locations = await Promise.all([
      prisma.location.create({ data: { name: "Central Station", active: true } }),
      prisma.location.create({ data: { name: "Airport Terminal", active: true } }),
      prisma.location.create({ data: { name: "North Station", active: true } }),
    ]);
    console.log(`✅ Created ${locations.length} locations`);

    // Create Route
    console.log("🛣️ Creating route...");
    const route = await prisma.route.create({
      data: {
        name: "Central to Airport Express",
        originId: locations[0].id,
        destinationId: locations[1].id,
        estimatedDuration: 45,
        departureLane: "A1",
        active: true,
      },
    });
    console.log(`✅ Created route: ${route.name}`);

    // Create Route Schedule
    console.log("📅 Creating route schedule...");
    const now = new Date();
    const departureTime = new Date(now);
    departureTime.setHours(8, 0, 0, 0);
    const arrivalTime = new Date(departureTime);
    arrivalTime.setMinutes(arrivalTime.getMinutes() + route.estimatedDuration);

    const routeSchedule = await prisma.routeSchedule.create({
      data: {
        routeId: route.id,
        departureTime,
        estimatedArrivalTime: arrivalTime,
        operatingDays: "1,2,3,4,5,6,7", // All days
        active: true,
      },
    });
    console.log(`✅ Created route schedule`);

    // Create Schedule
    console.log("🗓️ Creating schedule...");
    const scheduleDate = new Date(now);
    scheduleDate.setDate(scheduleDate.getDate() + 1); // Tomorrow
    scheduleDate.setHours(8, 0, 0, 0);

    const schedule = await prisma.schedule.create({
      data: {
        routeId: route.id,
        routeScheduleId: routeSchedule.id,
        busId: bus.id,
        departureDate: scheduleDate,
        estimatedArrivalTime: new Date(scheduleDate.getTime() + route.estimatedDuration * 60000),
        price: 100,
        status: "scheduled",
        primaryDriverId: driver.id,
      },
    });
    console.log(`✅ Created schedule`);

    // Create Schedule Seats
    console.log("🪑 Creating schedule seats...");
    const allBusSeats = await prisma.busSeat.findMany({
      where: { busId: bus.id },
      select: { id: true }
    });

    const scheduleSeats = allBusSeats.map(seat => ({
      scheduleId: schedule.id,
      busSeatId: seat.id,
      status: "available",
      isActive: true,
    }));

    await prisma.scheduleSeat.createMany({
      data: scheduleSeats,
    });
    console.log(`✅ Created ${scheduleSeats.length} schedule seats`);

    // Create Sample Customers
    console.log("👤 Creating customers...");
    const customers = await Promise.all([
      prisma.customer.create({
        data: {
          fullName: "John Smith",
          phone: "+1234567890",
          email: "john@example.com",
          documentId: "ID-001",
        },
      }),
      prisma.customer.create({
        data: {
          fullName: "Jane Doe",
          phone: "+1234567891",
          email: "jane@example.com",
          documentId: "ID-002",
        },
      }),
    ]);
    console.log(`✅ Created ${customers.length} customers`);

    // Create Sample Tickets
    console.log("🎫 Creating tickets...");
    const firstSeat = allBusSeats[0];
    const secondSeat = allBusSeats[1];

    const tickets = await Promise.all([
      prisma.ticket.create({
        data: {
          scheduleId: schedule.id,
          customerId: customers[0].id,
          busSeatId: firstSeat.id,
          status: "active",
          price: 100,
          purchasedBy: profiles.find(p => p.role === "seller")?.id,
        },
      }),
      prisma.ticket.create({
        data: {
          scheduleId: schedule.id,
          customerId: customers[1].id,
          busSeatId: secondSeat.id,
          status: "active",
          price: 100,
          purchasedBy: profiles.find(p => p.role === "seller")?.id,
        },
      }),
    ]);
    console.log(`✅ Created ${tickets.length} tickets`);

    // Create Expense Categories
    console.log("💰 Creating expense categories...");
    const expenseCategories = await Promise.all([
      prisma.expenseCategory.create({
        data: {
          name: "Fuel",
          description: "Fuel expenses",
          isSystem: true,
          active: true,
        },
      }),
      prisma.expenseCategory.create({
        data: {
          name: "Tolls",
          description: "Toll expenses",
          isSystem: true,
          active: true,
        },
      }),
    ]);
    console.log(`✅ Created ${expenseCategories.length} expense categories`);

    // Summary
    console.log("\n🎉 Quick database seeding completed successfully!");
    console.log("📊 Summary:");
    console.log(`  - Company: 1`);
    console.log(`  - Branch: 1`);
    console.log(`  - Users/Profiles: ${profiles.length}`);
    console.log(`  - Seat Tiers: ${seatTiers.length}`);
    console.log(`  - Bus Template: 1`);
    console.log(`  - Bus: 1`);
    console.log(`  - Bus Seats: ${busSeats.length}`);
    console.log(`  - Driver: 1`);
    console.log(`  - Locations: ${locations.length}`);
    console.log(`  - Route: 1`);
    console.log(`  - Schedule: 1`);
    console.log(`  - Customers: ${customers.length}`);
    console.log(`  - Tickets: ${tickets.length}`);

    console.log("\n🔐 Login Credentials:");
    console.log("  Super Admin: superadmin@transix.com / SuperAdmin123!");
    console.log("  Company Admin: admin@transix.com / Admin123!");
    console.log("  Branch Manager: manager@transix.com / Manager123!");
    console.log("  Ticket Seller: seller@transix.com / Seller123!");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });