import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
// Get all customers with optional filtering
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");
    const email = searchParams.get("email");
    const phone = searchParams.get("phone");
    const fullName = searchParams.get("fullName");

    // Build the query
    const query: Prisma.CustomerWhereInput = {};

    // Use contains for documentId to support partial matches
    if (documentId) {
      query.documentId = {
        contains: documentId,
        mode: "insensitive",
      };
    }

    if (email) query.email = email;
    if (phone) query.phone = phone;
    if (fullName) query.fullName = { contains: fullName, mode: "insensitive" };

    // Fetch customers
    const customers = await prisma.customer.findMany({
      where: query,
      orderBy: {
        fullName: "asc",
      },
    });

    return NextResponse.json({ customers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Error fetching customers" },
      { status: 500 }
    );
  }
}

// Create a new customer
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { fullName, phone, email, documentId } = data;

    // Validate required fields
    if (!fullName) {
      return NextResponse.json(
        { error: "Full name is required" },
        { status: 400 }
      );
    }

    // Check if customer with same document ID already exists
    if (documentId) {
      const existingCustomer = await prisma.customer.findUnique({
        where: { documentId },
      });

      if (existingCustomer) {
        return NextResponse.json(
          {
            error: "Customer with this document ID already exists",
            customer: existingCustomer,
          },
          { status: 409 }
        );
      }
    }

    // Create the customer
    const customer = await prisma.customer.create({
      data: {
        fullName,
        phone,
        email,
        documentId,
      },
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "Error creating customer" },
      { status: 500 }
    );
  }
}
