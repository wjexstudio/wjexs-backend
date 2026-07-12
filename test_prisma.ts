import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({ url: process.env.DATABASE_URL });
prisma.$connect().then(() => console.log("Connected")).catch(e => console.error(e));
