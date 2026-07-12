import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const questsService = {
  // Get all quests, optionally filtered by projectId
  async getQuests(projectId?: string) {
    if (projectId) {
      return await prisma.quest.findMany({
        where: { projectId },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      });
    }
    return await prisma.quest.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  },

  // Create a new quest
  async createQuest(projectId: string, title: string, description?: string, mode: string = 'do_later') {
    return await prisma.quest.create({
      data: {
        projectId,
        title,
        description,
        mode,
      },
    });
  },

  // Update a quest's mode or status
  async updateQuest(id: string, data: { mode?: string; status?: string; priority?: number }) {
    return await prisma.quest.update({
      where: { id },
      data,
    });
  },

  // Delete a quest
  async deleteQuest(id: string) {
    return await prisma.quest.delete({
      where: { id },
    });
  }
};
