import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis;

const pool =
  globalForPrisma.prismaPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" 
      ? { rejectUnauthorized: false } 
      : false,
    max: 2, // Limit connections for serverless
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 10000,
  });

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

// Cache in global for hot reloads in dev and connection reuse
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaPool = pool;
} else {
  // Also cache in production for serverless connection reuse
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaPool = pool;
}
