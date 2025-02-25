import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma, MaintenanceStatus } from "@prisma/client";

// Get all buses with optional filtering
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    const isActive = searchParams.get("isActive") === "true";
    const templateId = searchParams.get("templateId");
    const maintenanceStatus = searchParams.get("maintenanceStatus");
    
    // Build the query
    const query: Prisma.BusWhereInput = {};
    if (companyId) query.companyId = companyId;
    if (isActive !== undefined) query.isActive = isActive;
    if (templateId) query.templateId = templateId;
    if (maintenanceStatus) query.maintenanceStatus = maintenanceStatus as MaintenanceStatus;
    
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
    const parsedBuses = buses.map(bus => ({
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
    });
    
    if (!template) {
      return NextResponse.json(
        { error: "Bus template not found" },
        { status: 404 }
      );
    }
    
    // Convert complex objects to JSON strings for Prisma
    const busData = {
      ...data,
      // Use the template's seat matrix if not provided
      seatMatrix: data.seatMatrix ? JSON.stringify(data.seatMatrix) : template.seatTemplateMatrix,
    };
    
    // Create bus
    const bus = await prisma.bus.create({
      data: busData,
      include: {
        company: true,
        template: true,
      },
    });
    
    // Convert the JSON strings back to objects for the response
    const responseBus = {
      ...bus,
      seatMatrix: JSON.parse(bus.seatMatrix as string),
    };
    
    return NextResponse.json({ bus: responseBus });
  } catch (error) {
    console.error("Error creating bus:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error creating bus" },
      { status: 500 }
    );
  }
} 