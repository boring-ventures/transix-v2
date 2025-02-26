import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma, MaintenanceStatus, SeatStatus } from "@prisma/client";

// Get all buses with optional filtering
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    const isActiveParam = searchParams.get("isActive");
    const templateId = searchParams.get("templateId");
    const maintenanceStatus = searchParams.get("maintenanceStatus");

    // Build the query
    const query: Prisma.BusWhereInput = {};
    if (companyId) query.companyId = companyId;
    if (isActiveParam !== null) {
      // Convert string to boolean properly
      query.isActive = isActiveParam === "true";
    }
    if (templateId) query.templateId = templateId;
    if (maintenanceStatus)
      query.maintenanceStatus = maintenanceStatus as MaintenanceStatus;

    // Fetch buses
    const buses = await prisma.bus.findMany({
      where: query,
      include: {
        company: true,
        template: true,
        _count: {
          select: {
            assignments: true,
            busSeats: true,
            schedules: true,
          },
        },
      },
      orderBy: {
        plateNumber: "asc",
      },
    });

    // Parse JSON strings back to objects
    const parsedBuses = buses.map((bus) => ({
      ...bus,
      seatMatrix: JSON.parse(bus.seatMatrix as string),
    }));

    return NextResponse.json({ buses: parsedBuses });
  } catch (error) {
    console.error("Error fetching buses:", error);
    return NextResponse.json(
      { error: "Error fetching buses" },
      { status: 500 }
    );
  }
}

// Create a new bus
export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Validate the required fields
    if (!data.plateNumber || !data.companyId || !data.templateId) {
      return NextResponse.json(
        { error: "Plate number, company ID, and template ID are required" },
        { status: 400 }
      );
    }

    // Check if a bus with the same plate number already exists
    const existingBus = await prisma.bus.findUnique({
      where: { plateNumber: data.plateNumber },
    });

    if (existingBus) {
      return NextResponse.json(
        { error: "A bus with this plate number already exists" },
        { status: 400 }
      );
    }

    // Get the template to use its seat matrix
    const template = await prisma.busTypeTemplate.findUnique({
      where: { id: data.templateId },
      include: {
        company: {
          include: {
            seatTiers: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Bus template not found" },
        { status: 404 }
      );
    }

    // Get default seat tier (use first available tier from company)
    const defaultTierId = template.company.seatTiers[0]?.id;

    if (!defaultTierId) {
      return NextResponse.json(
        { error: "No seat tiers found for this company" },
        { status: 400 }
      );
    }

    // Convert complex objects to JSON strings for Prisma
    const busData = {
      ...data,
      // Use the template's seat matrix if not provided
      seatMatrix: data.seatMatrix
        ? JSON.stringify(data.seatMatrix)
        : template.seatTemplateMatrix,
    };

    // Create bus in a transaction with its seats
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the bus
      const bus = await tx.bus.create({
        data: busData,
        include: {
          company: true,
          template: true,
        },
      });

      // 2. Parse the seat matrix to create seats
      const seatMatrix = JSON.parse(bus.seatMatrix as string);
      const busSeats = [];

      // Process first floor seats
      for (const seat of seatMatrix.firstFloor.seats) {
        if (!seat.isEmpty) {
          busSeats.push({
            busId: bus.id,
            seatNumber: seat.name,
            tierId: defaultTierId,
            status: "available" as SeatStatus,
            isActive: true,
          });
        }
      }

      // Process second floor seats if they exist
      if (seatMatrix.secondFloor) {
        for (const seat of seatMatrix.secondFloor.seats) {
          if (!seat.isEmpty) {
            busSeats.push({
              busId: bus.id,
              seatNumber: seat.name,
              tierId: defaultTierId,
              status: "available" as SeatStatus,
              isActive: true,
            });
          }
        }
      }

      // 3. Create all bus seats
      if (busSeats.length > 0) {
        await tx.busSeat.createMany({
          data: busSeats,
        });
      }

      return bus;
    });

    // Convert the JSON strings back to objects for the response
    const responseBus = {
      ...result,
      seatMatrix: JSON.parse(result.seatMatrix as string),
    };

    return NextResponse.json({
      bus: responseBus,
      message: "Bus created successfully with seats",
    });
  } catch (error) {
    console.error("Error creating bus:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error creating bus" },
      { status: 500 }
    );
  }
} 