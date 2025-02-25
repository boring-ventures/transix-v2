import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const profile = await prisma.profile.findUnique({
      where: {
        userId,
      },
      include: {
        company: true,
        branch: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const json = await request.json();

    // Extract only the fields that exist in the schema
    const { fullName, email, companyId, branchId, role, active, avatarUrl } =
      json;

    const profile = await prisma.profile.update({
      where: {
        userId,
      },
      data: {
        fullName,
        email,
        companyId,
        branchId,
        role: role || undefined,
        active: active !== undefined ? active : undefined,
        avatarUrl: avatarUrl || undefined,
        updatedAt: new Date(),
      },
      include: {
        company: true,
        branch: true,
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Check if profile exists
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Delete the profile
    await prisma.profile.delete({
      where: { userId },
    });

    return NextResponse.json({ message: "Profile deleted successfully" });
  } catch (error) {
    console.error("Error deleting profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
