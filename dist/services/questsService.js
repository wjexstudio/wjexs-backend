"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.questsService = void 0;
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
exports.questsService = {
    // Get all quests, optionally filtered by projectId
    async getQuests(projectId) {
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
    async createQuest(projectId, title, description, mode = 'do_later') {
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
    async updateQuest(id, data) {
        return await prisma.quest.update({
            where: { id },
            data,
        });
    },
    // Delete a quest
    async deleteQuest(id) {
        return await prisma.quest.delete({
            where: { id },
        });
    }
};
