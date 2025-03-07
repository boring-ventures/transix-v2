import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma} from "@prisma/client";
// Get all buses with optional filtering
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    const isActive = searchParams.get("isActive") === "true";
    const templateId = searchParams.get("templateId");

    // Build the query
    const query: Prisma.BusWhereInput = {};
    if (companyId) query.companyId = companyId;
    if (isActive !== undefined) query.isActive = isActive;
    if (templateId) query.templateId = templateId;

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
          status: "available", // Ensure all seats start as available
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
          status: "available", // Ensure all seats start as available
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
    if (seatMatrix.firstFloor && seatMatrix.firstFloor.seats) {
      const firstFloorSeats = seatMatrix.firstFloor.seats
        .filter((seat) => !seat.isEmpty)
        .map((seat) => ({
          busId: bus.id,
          seatNumber: seat.id,
          tierId: seat.tierId,
          status: "available",
          isActive: true,
          floor: "first",
          row: seat.row,
          column: seat.column,
        }));

      allSeats.push(...firstFloorSeats);
    }

    // Process second floor seats if they exist
    if (seatMatrix.secondFloor && seatMatrix.secondFloor.seats) {
      const secondFloorSeats = seatMatrix.secondFloor.seats
        .filter((seat: Seat) => !seat.isEmpty)
        .map((seat: Seat) => ({
          busId: bus.id,
          seatNumber: seat.id,
          tierId: seat.tierId,
          status: "available",
          isActive: true,
          floor: "second",
          row: seat.row,
          column: seat.column,
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