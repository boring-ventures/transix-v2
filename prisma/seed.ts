import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

    if (error) {
      console.error(`Error creating user ${email}:`, error);
      // Try to get existing user
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = users?.users?.find(u => u.email === email);
      if (existingUser) {
        console.log(`User ${email} already exists, using existing user`);
        return existingUser.id;
      }
      throw error;
    }

    console.log(`Created Supabase user: ${email}`);
    return data.user?.id;
  } catch (error) {
    console.error(`Failed to create user ${email}:`, error);
    throw error;
  }
}

async function main() {
  console.log("🌱 Starting database seed...");

  try {
    // Clear existing data in correct order to respect foreign key constraints
    console.log("🧹 Clearing existing data...");

    await prisma.ticketReassignment.deleteMany();
    await prisma.ticketCancellation.deleteMany();
    await prisma.paymentLine.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.scheduleSeat.deleteMany();
    await prisma.passengerList.deleteMany();
    await prisma.parcelStatusUpdate.deleteMany();
    await prisma.parcel.deleteMany();
    await prisma.occupancyLog.deleteMany();
    await prisma.busLog.deleteMany();
    await prisma.incident.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.tripExpense.deleteMany();
    await prisma.tripSettlement.deleteMany();
    await prisma.tripLiquidation.deleteMany();
    await prisma.trip.deleteMany();
    await prisma.busAssignment.deleteMany();
    await prisma.schedule.deleteMany();
    await prisma.routeSchedule.deleteMany();
    await prisma.route.deleteMany();
    await prisma.location.deleteMany();
    await prisma.busSeat.deleteMany();
    await prisma.bus.deleteMany();
    await prisma.busTypeTemplate.deleteMany();
    await prisma.driver.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.branch.deleteMany();
    await prisma.seatTier.deleteMany();
    await prisma.expenseCategory.deleteMany();
    await prisma.company.deleteMany();

    console.log("✅ Existing data cleared");

    // Create Companies
    console.log("🏢 Creating companies...");
    const companies = await Promise.all([
      prisma.company.create({
        data: {
          name: "TransitX Express",
          active: true,
        },
      }),
      prisma.company.create({
        data: {
          name: "CityLink Transport",
          active: true,
        },
      }),
      prisma.company.create({
        data: {
          name: "Regional Carriers",
          active: true,
        },
      }),
    ]);
    console.log(`✅ Created ${companies.length} companies`);

    // Create Branches for each company
    console.log("🏪 Creating branches...");
    const branches = [];
    for (const company of companies) {
      const companyBranches = await Promise.all([
        prisma.branch.create({
          data: {
            companyId: company.id,
            name: `${company.name} - Main Branch`,
            address: "123 Main Street",
            city: "Metropolitan City",
            active: true,
          },
        }),
        prisma.branch.create({
          data: {
            companyId: company.id,
            name: `${company.name} - North Branch`,
            address: "456 North Avenue",
            city: "North City",
            active: true,
          },
        }),
      ]);
      branches.push(...companyBranches);
    }
    console.log(`✅ Created ${branches.length} branches`);

    // Create Users and Profiles
    console.log("👥 Creating users and profiles...");
    const userCredentials = [
      { email: "superadmin@transix.com", password: "SuperAdmin123!", role: "superadmin", fullName: "Super Admin" },
      { email: "admin@transitx.com", password: "Admin123!", role: "company_admin", fullName: "John Smith", company: companies[0] },
      { email: "manager@transitx.com", password: "Manager123!", role: "branch_admin", fullName: "Jane Doe", company: companies[0], branch: branches[0] },
      { email: "seller@transitx.com", password: "Seller123!", role: "seller", fullName: "Mike Johnson", company: companies[0], branch: branches[0] },
      { email: "admin@citylink.com", password: "Admin123!", role: "company_admin", fullName: "Sarah Williams", company: companies[1] },
      { email: "manager@citylink.com", password: "Manager123!", role: "branch_admin", fullName: "Robert Brown", company: companies[1], branch: branches[2] },
      { email: "admin@regional.com", password: "Admin123!", role: "company_admin", fullName: "Emily Davis", company: companies[2] },
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
              companyId: cred.company?.id || null,
              branchId: cred.branch?.id || null,
              active: true,
            },
          });
          profiles.push(profile);
          console.log(`✅ Created profile for ${cred.email} with role ${cred.role}`);
        }
      } catch (error) {
        console.error(`Failed to create profile for ${cred.email}:`, error);
      }
    }

    // Create Seat Tiers for each company
    console.log("💺 Creating seat tiers...");
    const seatTiers = [];
    for (const company of companies) {
      const tiers = await Promise.all([
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
            description: "Premium seating with extra legroom",
            basePrice: 75.00,
            isActive: true,
          },
        }),
        prisma.seatTier.create({
          data: {
            companyId: company.id,
            name: "VIP",
            description: "VIP seating with premium amenities",
            basePrice: 120.00,
            isActive: true,
          },
        }),
      ]);
      seatTiers.push(...tiers);
    }
    console.log(`✅ Created ${seatTiers.length} seat tiers`);

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
          description: "Toll road expenses",
          isSystem: true,
          active: true,
        },
      }),
      prisma.expenseCategory.create({
        data: {
          name: "Meals",
          description: "Driver meals and refreshments",
          isSystem: true,
          active: true,
        },
      }),
      prisma.expenseCategory.create({
        data: {
          name: "Maintenance",
          description: "Vehicle maintenance and repairs",
          isSystem: true,
          active: true,
        },
      }),
      prisma.expenseCategory.create({
        data: {
          name: "Parking",
          description: "Parking fees",
          isSystem: true,
          active: true,
        },
      }),
    ]);
    console.log(`✅ Created ${expenseCategories.length} expense categories`);

    // Create Bus Type Templates for each company
    console.log("🚌 Creating bus type templates...");
    const busTemplates = [];
    for (const company of companies) {
      const templates = await Promise.all([
        prisma.busTypeTemplate.create({
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
                  tierId: seatTiers.find(t => t.companyId === company.id && t.name === "Economy")?.id,
                })),
              },
            }),
            seatsLayout: "2+2",
            isActive: true,
          },
        }),
        prisma.busTypeTemplate.create({
          data: {
            companyId: company.id,
            name: "Double Decker 60",
            description: "Double decker 60-seater bus",
            totalCapacity: 60,
            type: "double_decker",
            seatTemplateMatrix: JSON.stringify({
              firstFloor: {
                rows: 8,
                columns: 4,
                seats: Array.from({ length: 32 }, (_, i) => ({
                  id: `F${i + 1}`,
                  row: Math.floor(i / 4),
                  column: i % 4,
                  isEmpty: false,
                  tierId: seatTiers.find(t => t.companyId === company.id && t.name === "Premium")?.id,
                })),
              },
              secondFloor: {
                rows: 7,
                columns: 4,
                seats: Array.from({ length: 28 }, (_, i) => ({
                  id: `S${i + 1}`,
                  row: Math.floor(i / 4),
                  column: i % 4,
                  isEmpty: false,
                  tierId: seatTiers.find(t => t.companyId === company.id && t.name === "VIP")?.id,
                })),
              },
            }),
            seatsLayout: "2+2",
            isActive: true,
          },
        }),
      ]);
      busTemplates.push(...templates);
    }
    console.log(`✅ Created ${busTemplates.length} bus type templates`);

    // Create Buses for each company
    console.log("🚍 Creating buses...");
    const buses = [];
    let plateCounter = 1000;
    for (const company of companies) {
      const companyTemplates = busTemplates.filter(t => t.companyId === company.id);
      const companyBuses = [];

      for (const template of companyTemplates) {
        for (let i = 0; i < 3; i++) {
          const bus = await prisma.bus.create({
            data: {
              companyId: company.id,
              templateId: template.id,
              plateNumber: `BUS-${plateCounter++}`,
              isActive: true,
              seatMatrix: template.seatTemplateMatrix,
              maintenanceStatus: "active",
            },
          });
          companyBuses.push(bus);
        }
      }
      buses.push(...companyBuses);
    }
    console.log(`✅ Created ${buses.length} buses`);

    // Create Bus Seats for each bus (bulk operation)
    console.log("💺 Creating bus seats...");
    const allBusSeats = [];

    for (const bus of buses) {
      const template = busTemplates.find(t => t.id === bus.templateId);
      if (!template) continue;

      const seatMatrix = JSON.parse(template.seatTemplateMatrix);
      const busSeats = [];

      // Process first floor seats
      if (seatMatrix.firstFloor?.seats) {
        busSeats.push(...seatMatrix.firstFloor.seats);
      }

      // Process second floor seats
      if (seatMatrix.secondFloor?.seats) {
        busSeats.push(...seatMatrix.secondFloor.seats);
      }

      for (const seat of busSeats) {
        if (!seat.isEmpty) {
          allBusSeats.push({
            busId: bus.id,
            seatNumber: seat.id,
            tierId: seat.tierId,
            status: "available",
            isActive: true,
          });
        }
      }
    }

    // Bulk create all bus seats
    await prisma.busSeat.createMany({
      data: allBusSeats,
    });
    const totalSeats = allBusSeats.length;
    console.log(`✅ Created ${totalSeats} bus seats`);

    // Create Drivers for each company
    console.log("👨‍✈️ Creating drivers...");
    const drivers = [];
    let driverIdCounter = 10000;
    let licenseCounter = 5000;

    const driverNames = [
      "Carlos Rodriguez", "Maria Garcia", "Juan Martinez", "Ana Lopez",
      "Pedro Sanchez", "Sofia Gonzalez", "Diego Fernandez", "Isabella Torres",
      "Luis Ramirez", "Carmen Flores", "Miguel Silva", "Elena Morales",
    ];

    for (const company of companies) {
      const companyDrivers = [];
      for (let i = 0; i < 4; i++) {
        const driver = await prisma.driver.create({
          data: {
            companyId: company.id,
            fullName: driverNames[i % driverNames.length],
            documentId: `DOC-${driverIdCounter++}`,
            licenseNumber: `LIC-${licenseCounter++}`,
            licenseCategory: i % 2 === 0 ? "D1" : "D",
            active: true,
          },
        });
        companyDrivers.push(driver);
      }
      drivers.push(...companyDrivers);
    }
    console.log(`✅ Created ${drivers.length} drivers`);

    // Create Locations
    console.log("📍 Creating locations...");
    const locations = await Promise.all([
      prisma.location.create({ data: { name: "Central Station", active: true } }),
      prisma.location.create({ data: { name: "North Terminal", active: true } }),
      prisma.location.create({ data: { name: "South Terminal", active: true } }),
      prisma.location.create({ data: { name: "East Terminal", active: true } }),
      prisma.location.create({ data: { name: "West Terminal", active: true } }),
      prisma.location.create({ data: { name: "Airport", active: true } }),
      prisma.location.create({ data: { name: "Downtown", active: true } }),
      prisma.location.create({ data: { name: "University", active: true } }),
      prisma.location.create({ data: { name: "Shopping Mall", active: true } }),
      prisma.location.create({ data: { name: "Industrial Park", active: true } }),
    ]);
    console.log(`✅ Created ${locations.length} locations`);

    // Create Routes
    console.log("🛣️ Creating routes...");
    const routes = await Promise.all([
      prisma.route.create({
        data: {
          name: "Central to Airport Express",
          originId: locations[0].id,
          destinationId: locations[5].id,
          estimatedDuration: 45,
          departureLane: "A1",
          active: true,
        },
      }),
      prisma.route.create({
        data: {
          name: "North-South Corridor",
          originId: locations[1].id,
          destinationId: locations[2].id,
          estimatedDuration: 60,
          departureLane: "B2",
          active: true,
        },
      }),
      prisma.route.create({
        data: {
          name: "East-West Express",
          originId: locations[3].id,
          destinationId: locations[4].id,
          estimatedDuration: 55,
          departureLane: "C3",
          active: true,
        },
      }),
      prisma.route.create({
        data: {
          name: "Downtown Circle",
          originId: locations[6].id,
          destinationId: locations[0].id,
          estimatedDuration: 30,
          departureLane: "D4",
          active: true,
        },
      }),
      prisma.route.create({
        data: {
          name: "University Express",
          originId: locations[0].id,
          destinationId: locations[7].id,
          estimatedDuration: 25,
          departureLane: "E5",
          active: true,
        },
      }),
    ]);
    console.log(`✅ Created ${routes.length} routes`);

    // Create Route Schedules
    console.log("📅 Creating route schedules...");
    const routeSchedules = [];
    const now = new Date();

    for (const route of routes) {
      // Create morning, afternoon, and evening schedules
      const times = [
        { hour: 6, minute: 0 },   // Morning
        { hour: 9, minute: 0 },   // Mid-morning
        { hour: 12, minute: 0 },  // Noon
        { hour: 15, minute: 0 },  // Afternoon
        { hour: 18, minute: 0 },  // Evening
        { hour: 21, minute: 0 },  // Night
      ];

      for (const time of times) {
        const departureTime = new Date(now);
        departureTime.setHours(time.hour, time.minute, 0, 0);

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
        routeSchedules.push(routeSchedule);
      }
    }
    console.log(`✅ Created ${routeSchedules.length} route schedules`);

    // Create Schedules for the next 7 days
    console.log("🗓️ Creating schedules...");
    const schedules = [];
    const basePrice = 100;

    for (let day = 0; day < 7; day++) {
      const scheduleDate = new Date(now);
      scheduleDate.setDate(scheduleDate.getDate() + day);

      for (const routeSchedule of routeSchedules) {
        const departureDate = new Date(scheduleDate);
        const departureTime = new Date(routeSchedule.departureTime);
        departureDate.setHours(departureTime.getHours(), departureTime.getMinutes(), 0, 0);

        const arrivalDate = new Date(departureDate);
        arrivalDate.setMinutes(arrivalDate.getMinutes() + routes.find(r => r.id === routeSchedule.routeId)!.estimatedDuration);

        // Assign a random bus and drivers
        const randomBus = buses[Math.floor(Math.random() * buses.length)];
        const busCompanyDrivers = drivers.filter(d => d.companyId === randomBus.companyId);
        const primaryDriver = busCompanyDrivers[Math.floor(Math.random() * busCompanyDrivers.length)];
        const secondaryDriver = busCompanyDrivers.find(d => d.id !== primaryDriver.id);

        const schedule = await prisma.schedule.create({
          data: {
            routeId: routeSchedule.routeId,
            routeScheduleId: routeSchedule.id,
            busId: randomBus.id,
            departureDate,
            estimatedArrivalTime: arrivalDate,
            price: basePrice + (day * 10), // Dynamic pricing
            status: day === 0 && departureDate > now ? "scheduled" : day < 0 ? "completed" : "scheduled",
            primaryDriverId: primaryDriver?.id,
            secondaryDriverId: secondaryDriver?.id,
          },
        });
        schedules.push(schedule);
      }
    }
    console.log(`✅ Created ${schedules.length} schedules`);

    // Create Schedule Seats for each schedule (bulk operation)
    console.log("🪑 Creating schedule seats...");
    const allScheduleSeats = [];

    // Get all bus seats at once
    const existingBusSeats = await prisma.busSeat.findMany({
      select: { id: true, busId: true }
    });

    for (const schedule of schedules.slice(0, 20)) { // Limit to first 20 schedules for performance
      if (!schedule.busId) continue;

      const busSeats = existingBusSeats.filter(seat => seat.busId === schedule.busId);

      for (const seat of busSeats) {
        allScheduleSeats.push({
          scheduleId: schedule.id,
          busSeatId: seat.id,
          status: "available",
          isActive: true,
        });
      }
    }

    // Bulk create all schedule seats
    if (allScheduleSeats.length > 0) {
      await prisma.scheduleSeat.createMany({
        data: allScheduleSeats,
      });
    }
    const totalScheduleSeats = allScheduleSeats.length;
    console.log(`✅ Created ${totalScheduleSeats} schedule seats`);

    // Create Customers
    console.log("👤 Creating customers...");
    const customerNames = [
      { fullName: "Alice Johnson", phone: "+1234567890", email: "alice@example.com" },
      { fullName: "Bob Smith", phone: "+1234567891", email: "bob@example.com" },
      { fullName: "Charlie Brown", phone: "+1234567892", email: "charlie@example.com" },
      { fullName: "Diana Prince", phone: "+1234567893", email: "diana@example.com" },
      { fullName: "Edward Norton", phone: "+1234567894", email: "edward@example.com" },
      { fullName: "Fiona Green", phone: "+1234567895", email: "fiona@example.com" },
      { fullName: "George Wilson", phone: "+1234567896", email: "george@example.com" },
      { fullName: "Helen White", phone: "+1234567897", email: "helen@example.com" },
      { fullName: "Ian Black", phone: "+1234567898", email: "ian@example.com" },
      { fullName: "Julia Roberts", phone: "+1234567899", email: "julia@example.com" },
    ];

    const customers = [];
    let docIdCounter = 20000;
    for (const customer of customerNames) {
      const newCustomer = await prisma.customer.create({
        data: {
          fullName: customer.fullName,
          phone: customer.phone,
          email: customer.email,
          documentId: `ID-${docIdCounter++}`,
        },
      });
      customers.push(newCustomer);
    }
    console.log(`✅ Created ${customers.length} customers`);

    // Create sample Tickets
    console.log("🎫 Creating tickets...");
    const tickets = [];
    const ticketCount = 100;

    for (let i = 0; i < ticketCount; i++) {
      const randomSchedule = schedules[Math.floor(Math.random() * Math.min(20, schedules.length))];
      if (!randomSchedule.busId) continue;

      const availableSeats = await prisma.busSeat.findMany({
        where: {
          busId: randomSchedule.busId,
          status: "available",
        },
      });

      if (availableSeats.length === 0) continue;

      const randomSeat = availableSeats[Math.floor(Math.random() * availableSeats.length)];
      const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
      const randomProfile = profiles.filter(p => p.role === "seller")[Math.floor(Math.random() * profiles.filter(p => p.role === "seller").length)];

      try {
        const ticket = await prisma.ticket.create({
          data: {
            scheduleId: randomSchedule.id,
            customerId: randomCustomer.id,
            busSeatId: randomSeat.id,
            status: Math.random() > 0.9 ? "cancelled" : "active",
            price: randomSchedule.price,
            purchasedBy: randomProfile?.id,
            notes: Math.random() > 0.7 ? "Special request: Window seat preferred" : null,
          },
        });
        tickets.push(ticket);
      } catch (error) {
        // Skip if seat already taken
        continue;
      }
    }
    console.log(`✅ Created ${tickets.length} tickets`);

    // Create sample Trips
    console.log("✈️ Creating trips...");
    const trips = [];
    for (let i = 0; i < 20; i++) {
      const randomRoute = routes[Math.floor(Math.random() * routes.length)];
      const randomBus = buses[Math.floor(Math.random() * buses.length)];
      const busCompanyDrivers = drivers.filter(d => d.companyId === randomBus.companyId);
      const randomDriver = busCompanyDrivers[Math.floor(Math.random() * busCompanyDrivers.length)];

      const departureTime = new Date();
      departureTime.setDate(departureTime.getDate() - Math.floor(Math.random() * 30)); // Past 30 days

      const arrivalTime = new Date(departureTime);
      arrivalTime.setMinutes(arrivalTime.getMinutes() + randomRoute.estimatedDuration);

      const trip = await prisma.trip.create({
        data: {
          routeId: randomRoute.id,
          busId: randomBus.id,
          driverId: randomDriver.id,
          departureTime,
          arrivalTime: Math.random() > 0.3 ? arrivalTime : null,
          status: Math.random() > 0.3 ? "completed" : "in_progress",
        },
      });
      trips.push(trip);
    }
    console.log(`✅ Created ${trips.length} trips`);

    // Create sample Trip Expenses
    console.log("💸 Creating trip expenses...");
    let expenseCount = 0;
    for (const trip of trips.slice(0, 10)) {
      const numExpenses = Math.floor(Math.random() * 5) + 1;

      for (let i = 0; i < numExpenses; i++) {
        const randomCategory = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];

        await prisma.tripExpense.create({
          data: {
            tripId: trip.id,
            categoryId: randomCategory.id,
            amount: Math.floor(Math.random() * 500) + 50,
            description: `${randomCategory.name} expense for trip`,
            createdBy: profiles[0].id,
          },
        });
        expenseCount++;
      }
    }
    console.log(`✅ Created ${expenseCount} trip expenses`);

    // Create sample Parcels
    console.log("📦 Creating parcels...");
    const parcels = [];
    for (let i = 0; i < 30; i++) {
      const randomSchedule = schedules[Math.floor(Math.random() * Math.min(10, schedules.length))];
      const randomSender = customers[Math.floor(Math.random() * customers.length)];
      const randomReceiver = customers.find(c => c.id !== randomSender.id);

      const parcel = await prisma.parcel.create({
        data: {
          scheduleId: randomSchedule.id,
          senderId: randomSender.id,
          receiverId: randomReceiver?.id,
          weight: Math.floor(Math.random() * 50) + 1,
          dimensions: `${Math.floor(Math.random() * 100) + 10}x${Math.floor(Math.random() * 100) + 10}x${Math.floor(Math.random() * 100) + 10}`,
          declaredValue: Math.floor(Math.random() * 1000) + 100,
          status: ["received", "in_transit", "delivered"][Math.floor(Math.random() * 3)] as any,
          price: Math.floor(Math.random() * 200) + 20,
        },
      });
      parcels.push(parcel);
    }
    console.log(`✅ Created ${parcels.length} parcels`);

    // Summary
    console.log("\n🎉 Database seeding completed successfully!");
    console.log("📊 Summary:");
    console.log(`  - Companies: ${companies.length}`);
    console.log(`  - Branches: ${branches.length}`);
    console.log(`  - Users/Profiles: ${profiles.length}`);
    console.log(`  - Seat Tiers: ${seatTiers.length}`);
    console.log(`  - Bus Templates: ${busTemplates.length}`);
    console.log(`  - Buses: ${buses.length}`);
    console.log(`  - Bus Seats: ${totalSeats}`);
    console.log(`  - Drivers: ${drivers.length}`);
    console.log(`  - Locations: ${locations.length}`);
    console.log(`  - Routes: ${routes.length}`);
    console.log(`  - Route Schedules: ${routeSchedules.length}`);
    console.log(`  - Schedules: ${schedules.length}`);
    console.log(`  - Customers: ${customers.length}`);
    console.log(`  - Tickets: ${tickets.length}`);
    console.log(`  - Trips: ${trips.length}`);
    console.log(`  - Parcels: ${parcels.length}`);

    console.log("\n🔐 Login Credentials:");
    console.log("  Super Admin: superadmin@transix.com / SuperAdmin123!");
    console.log("  Company Admin (TransitX): admin@transitx.com / Admin123!");
    console.log("  Branch Manager (TransitX): manager@transitx.com / Manager123!");
    console.log("  Seller (TransitX): seller@transitx.com / Seller123!");
    console.log("  Company Admin (CityLink): admin@citylink.com / Admin123!");
    console.log("  Company Admin (Regional): admin@regional.com / Admin123!");

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