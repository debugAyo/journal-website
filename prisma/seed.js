require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data (in reverse order of dependencies)
  console.log("Clearing existing data...");
  await prisma.review.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.editorialDecision.deleteMany();
  await prisma.article.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.volume.deleteMany();
  await prisma.user.deleteMany();

  // Create users with different roles
  console.log("Creating users...");
  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@ijeccet.org",
      passwordHash: passwordHash,
      name: "Admin User",
      role: "ADMIN",
      affiliation: "IJECCET Editorial Office",
      isVerified: true,
    },
  });

  console.log("✅ Created Admin user");

  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📋 Test Accounts:");
  console.log("================================");
  console.log("Admin:     admin@ijeccet.org    / password123");
  console.log("Editor:    editor@ijeccet.org   / password123");
  console.log("Reviewer:  reviewer1@example.com    / password123");
  console.log("Reviewer:  reviewer2@example.com    / password123");
  console.log("Author:    author1@example.com      / password123");
  console.log("Author:    author2@example.com      / password123");
  console.log("================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
