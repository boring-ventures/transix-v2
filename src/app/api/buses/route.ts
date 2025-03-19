import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
// Get all buses with optional filtering
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    const isActiveParam = searchParams.get("isActive");

    console.log("Buses API - Raw isActive param:", isActiveParam);

    // Only set isActive in the query if the parameter is explicitly provided
    let isActive: boolean | undefined;
    if (isActiveParam !== null) {
      isActive = isActiveParam === "true";
    }

    const templateId = searchParams.get("templateId");

    console.log("Buses API - Query params:", {
      companyId,
      isActive,
      templateId,
    });

    // Build the query
    const query: Prisma.BusWhereInput = {};
    if (companyId) query.companyId = companyId;
    // Only add isActive to query if it's not undefined
    if (isActive !== undefined) query.isActive = isActive;
    if (templateId) query.templateId = templateId;

    console.log("Buses API - Final query:", query);

    // Fetch buses
    const buses = await prisma.bus.findMany({
      where: query,
      include: {
        company: true,
        template: true,
      },
      orderBy: {
        plateNumber: "asc",
      },
    });

    console.log(`Buses API - Found ${buses.length} buses`);

    if (buses.length === 0) {
      // If no buses found, log a message and check if there are any buses at all
      const totalBuses = await prisma.bus.count();
      console.log(`Buses API - Total buses in database: ${totalBuses}`);
    }

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
    if (!data.companyId || !data.templateId || !data.plateNumber) {
      return NextResponse.json(
        { error: "Empresa, plantilla y número de placa son requeridos" },
        { status: 400 }
      );
    }

    // Check if a bus with the same plate number already exists
    const existingBus = await prisma.bus.findUnique({
      where: {
        plateNumber: data.plateNumber,
      },
    });

    if (existingBus) {
      return NextResponse.json(
        { error: "Ya existe un bus con este número de placa" },
        { status: 400 }
      );
    }

    // Get the template to copy the seat matrix
    const template = await prisma.busTypeTemplate.findUnique({
      where: {
        id: data.templateId,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Plantilla no encontrada" },
        { status: 404 }
      );
    }

    // Parse the template's seat matrix
    const templateMatrix = JSON.parse(template.seatTemplateMatrix as string);

    // Define the seat type
    interface Seat {
      id: string;
      tierId: string;
      isEmpty?: boolean;
      row?: number;
      column?: number;
    }

    // Define the seat matrix type
    interface SeatMatrix {
      firstFloor: {
        dimensions: { rows: number; seatsPerRow: number };
        seats: Seat[];
      };
      secondFloor?: {
        dimensions: { rows: number; seatsPerRow: number };
        seats: Seat[];
      };
    }

    // Create a new seat matrix for the bus, preserving the structure but ensuring
    // all seats have the correct floor property and are properly organized
    const seatMatrix: SeatMatrix = {
      firstFloor: {
        dimensions: templateMatrix.firstFloor.dimensions,
        seats: templateMatrix.firstFloor.seats.map((seat: Seat) => ({
          ...seat,
          floor: "first",
          status: "available",
        })),
      },
    };

    // Add second floor if it exists in the template
    if (templateMatrix.secondFloor) {
      seatMatrix.secondFloor = {
        dimensions: templateMatrix.secondFloor.dimensions,
        seats: templateMatrix.secondFloor.seats.map((seat: Seat) => ({
          ...seat,
          floor: "second",
          status: "available",
        })),
      };
    }

    // Create the bus
    const bus = await prisma.bus.create({
      data: {
        companyId: data.companyId,
        templateId: data.templateId,
        plateNumber: data.plateNumber,
        isActive: data.isActive !== undefined ? data.isActive : true,
        maintenanceStatus: data.maintenanceStatus || "active",
        seatMatrix: JSON.stringify(seatMatrix),
      },
      include: {
        company: true,
        template: true,
      },
    });

    // Create BusSeat records for each seat in the matrix
    const allSeats = [];

    // Process first floor seats
    if (seatMatrix.firstFloor?.seats) {
      const firstFloorSeats = seatMatrix.firstFloor.seats
        .filter((seat) => !seat.isEmpty)
        .map((seat) => ({
          busId: bus.id,
          seatNumber: seat.id,
          tierId: seat.tierId,
          status: "available",
          isActive: true,
        }));

      allSeats.push(...firstFloorSeats);
    }

    // Process second floor seats if they exist
    if (seatMatrix.secondFloor?.seats) {
      const secondFloorSeats = seatMatrix.secondFloor.seats
        .filter((seat: Seat) => !seat.isEmpty)
        .map((seat: Seat) => ({
          busId: bus.id,
          seatNumber: seat.id,
          tierId: seat.tierId,
          status: "available",
          isActive: true,
        }));

      allSeats.push(...secondFloorSeats);
    }

    // Create all bus seats in a single transaction
    if (allSeats.length > 0) {
      await prisma.busSeat.createMany({
        data: allSeats as Prisma.BusSeatCreateManyInput[],
      });
    }

    // Parse the JSON string back to an object for the response
    const responseData = {
      ...bus,
      seatMatrix: JSON.parse(bus.seatMatrix as string),
    };

    return NextResponse.json({ bus: responseData });
  } catch (error) {
    console.error("Error creating bus:", error);
    return NextResponse.json({ error: "Error creating bus" }, { status: 500 });
  }
}
