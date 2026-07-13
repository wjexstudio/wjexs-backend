import 'dotenv/config';
import { prisma } from './src/db';

async function main() {
  const quest = await prisma.quest.findUnique({
    where: { id: 'starship-enterprise__42' },
    include: { project: true }
  });
  console.log(JSON.stringify(quest, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
