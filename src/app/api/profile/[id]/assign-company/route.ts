import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRoleProtection } from "@/lib/api-auth";

const assignCompany = async (
  req: Request,
  context: { params: { id: string } }
) => {
  try {
    const { id } = context.params;
    const { companyId, role, branchId } = await req.json();

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Check if profile exists
    const profile = await prisma.profile.findUnique({
      where: { userId: id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // If branchId is provided, check if it exists and belongs to the company
    if (branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: branchId },
      });

      if (!branch) {
        return NextResponse.json(
          { error: "Branch not found" },
          { status: 404 }
        );
      }

      if (branch.companyId !== companyId) {
        return NextResponse.json(
          { error: "Branch does not belong to the specified company" },
          { status: 400 }
        );
      }
    }

    // Update profile with company assignment
    const updatedProfile = await prisma.profile.update({
      where: { userId: id },
      data: {
        companyId,
        branchId: branchId || null,
        role: role || profile.role, // Keep existing role if not specified
      },
    });

    return NextResponse.json({
      message: "Company assigned successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Error assigning company to profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

// Only superadmin and company_admin can assign companies to profiles
export const POST = withRoleProtection(assignCompany, [
  "superadmin",
  "company_admin",
]);
