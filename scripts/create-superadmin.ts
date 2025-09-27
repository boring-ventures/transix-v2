import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createSuperAdmin() {
  console.log("👑 Creating superadmin user...");

  try {
    // Create Supabase user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: "superadmin@transix.com",
      password: "SuperAdmin123!",
      email_confirm: true,
    });

    let userId = data?.user?.id;

    if (error && error.status === 422) {
      // User already exists, get existing user
      console.log("User already exists in Supabase, getting existing user...");
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = users?.users?.find(u => u.email === "superadmin@transix.com");
      if (existingUser) {
        userId = existingUser.id;
        console.log("✅ Found existing Supabase user");
      }
    } else if (error) {
      console.error("Error creating Supabase user:", error);
      throw error;
    } else {
      console.log("✅ Created new Supabase user");
    }

    if (!userId) {
      throw new Error("No user ID available");
    }

    // Check if profile already exists
    const existingProfile = await prisma.profile.findUnique({
      where: { userId }
    });

    if (existingProfile) {
      console.log("✅ Profile already exists for superadmin@transix.com");
      console.log(`   Role: ${existingProfile.role}`);
      console.log(`   Full Name: ${existingProfile.fullName}`);
    } else {
      // Create profile
      const profile = await prisma.profile.create({
        data: {
          userId,
          email: "superadmin@transix.com",
          fullName: "Super Administrator",
          role: "superadmin",
          companyId: null, // Superadmin is not tied to any company
          branchId: null,
          active: true,
        },
      });

      console.log("✅ Created superadmin profile");
      console.log(`   Email: ${profile.email}`);
      console.log(`   Role: ${profile.role}`);
      console.log(`   Full Name: ${profile.fullName}`);
    }

    console.log("\n🔐 Superadmin Login Credentials:");
    console.log("  Email: superadmin@transix.com");
    console.log("  Password: SuperAdmin123!");

  } catch (error) {
    console.error("❌ Error creating superadmin:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin()
  .then(() => console.log("\n✅ Superadmin creation completed"))
  .catch((error) => {
    console.error("❌ Failed to create superadmin:", error);
    process.exit(1);
  });