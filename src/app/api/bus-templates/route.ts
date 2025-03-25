import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// Get all bus templates with optional filtering
export async function GET(req: Request) {
  try {
    console.log("GET request received");
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    const isActive = searchParams.get("isActive") === "true";

    // Build the query
    const query: Prisma.BusTypeTemplateWhereInput = {};
    if (companyId) query.companyId = companyId;

    // Fetch templates
    const templates = await prisma.busTypeTemplate.findMany({
      where: query,
      include: {
        company: true,
        _count: {
          select: {
            buses: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log(templates);

    // Parse JSON strings back to objects
    const parsedTemplates = templates.map((template) => ({
      ...template,
      seatTemplateMatrix: JSON.parse(template.seatTemplateMatrix as string),
      seatsLayout:
        typeof template.seatsLayout === "string" &&
        template.seatsLayout.startsWith("{")
          ? JSON.parse(template.seatsLayout)
          : template.seatsLayout,
    }));

    return NextResponse.json({ templates: parsedTemplates });
  } catch (error) {
    console.error("Error fetching bus templates:", error);
    return NextResponse.json(
      { error: "Error fetching bus templates" },
      { status: 500 }
    );
  }
}

// Create a new bus template
export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Validate the required fields
    if (!data.name || !data.companyId) {
      return NextResponse.json(
        { error: "Nombre y empresa son requeridos" },
        { status: 400 }
      );
    }

    // Convert complex objects to JSON strings for Prisma
    const templateData = {
      ...data,
      // Convert the matrix to a JSON string
      seatTemplateMatrix: JSON.stringify(data.seatTemplateMatrix),
      // Convert the layout to a JSON string if it's an object
      seatsLayout:
        typeof data.seatsLayout === "object"
          ? JSON.stringify(data.seatsLayout)
          : data.seatsLayout,
    };

    // Create template
    const template = await prisma.busTypeTemplate.create({
      data: templateData,
      include: {
        company: true,
      },
    });

    // Convert the JSON strings back to objects for the response
    const responseTemplate = {
      ...template,
      seatTemplateMatrix: JSON.parse(template.seatTemplateMatrix as string),
      seatsLayout:
        typeof template.seatsLayout === "string" &&
        template.seatsLayout.startsWith("{")
          ? JSON.parse(template.seatsLayout)
          : template.seatsLayout,
    };

    return NextResponse.json({ template: responseTemplate });
  } catch (error) {
    console.error("Error creating bus template:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error creating bus template",
      },
      { status: 500 }
    );
  }
}
