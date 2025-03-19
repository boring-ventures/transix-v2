import { NextRequest, NextResponse } from "next/server";
import { withRoleProtection } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// Seed default expense categories
async function seedExpenseCategories() {
  try {
    // Define the default categories
    const defaultCategories = [
      {
        name: "Combustible",
        description: "Gastos de combustible para los viajes",
        isSystem: true,
        active: true,
      },
      {
        name: "Peajes",
        description: "Pagos de peajes durante los viajes",
        isSystem: true,
        active: true,
      },
      {
        name: "Mantenimiento",
        description: "Gastos de mantenimiento de vehículos",
        isSystem: true,
        active: true,
      },
      {
        name: "Comida",
        description: "Gastos de alimentación durante el viaje",
        isSystem: true,
        active: true,
      },
      {
        name: "Hospedaje",
        description: "Gastos de hospedaje durante el viaje",
        isSystem: true,
        active: true,
      },
      {
        name: "Otros",
        description: "Otros gastos no categorizados",
        isSystem: true,
        active: true,
      },
    ];

    // Check if categories already exist
    const existingCategories = await prisma.expenseCategory.findMany({
      where: {
        isSystem: true,
      },
    });

    if (existingCategories.length > 0) {
      return NextResponse.json({
        message: "Default categories already exist",
        categories: existingCategories,
      });
    }

    // Create the categories
    const categories = await prisma.expenseCategory.createMany({
      data: defaultCategories,
      skipDuplicates: true,
    });

    // Get the created categories to return
    const createdCategories = await prisma.expenseCategory.findMany({
      where: {
        isSystem: true,
      },
    });

    return NextResponse.json({
      message: "Default categories created successfully",
      count: categories.count,
      categories: createdCategories,
    });
  } catch (error) {
    console.error("Error seeding expense categories:", error);
    return NextResponse.json(
      { error: "Failed to seed expense categories" },
      { status: 500 }
    );
  }
}

// Export the protected handler
export const GET = withRoleProtection(seedExpenseCategories, ["superadmin"]);
