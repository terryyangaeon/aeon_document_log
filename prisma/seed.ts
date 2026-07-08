import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.systemCode.upsert({
    where: { id: 1 },
    update: {},
    create: { type: "PREFIX", value: "ADA" },
  });

  await prisma.staff.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Michael Belshaw",
      initial: "MB",
      staffNo: "S001",
      email: "michael.belshaw@aeon.com",
    },
  });

  await prisma.staff.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: "Phoebe Chan",
      initial: "PC",
      staffNo: "S002",
      email: "phoebe.chan@aeon.com",
    },
  });

  console.log("Seed data created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
