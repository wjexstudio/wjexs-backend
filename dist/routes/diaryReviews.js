"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const githubService_1 = require("../services/githubService");
const router = (0, express_1.Router)();
const OS_DIR = path_1.default.join(os_1.default.homedir(), 'projects', 'wjexstudio-os');
const LOGS_DIR = path_1.default.join(OS_DIR, 'sessions', 'logs');
// List available diary logs
router.get('/', async (req, res) => {
    try {
        const files = await promises_1.default.readdir(LOGS_DIR);
        const mdFiles = files.filter(f => f.endsWith('.md') || f.endsWith('.txt') || f.endsWith('.log'));
        // Sort by latest first
        const sortedFiles = mdFiles.sort((a, b) => b.localeCompare(a));
        const documents = await Promise.all(sortedFiles.slice(0, 5).map(async (filename) => {
            const content = await promises_1.default.readFile(path_1.default.join(LOGS_DIR, filename), 'utf-8');
            const stats = await promises_1.default.stat(path_1.default.join(LOGS_DIR, filename));
            return {
                id: filename,
                title: filename,
                document_text: content,
                updated_at: stats.mtime.toISOString()
            };
        }));
        res.json({
            status: 'success',
            data: documents
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Export highlighted text to GitHub Quests
router.post('/export', async (req, res) => {
    try {
        const { documentId, text, comment } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Missing text to export' });
        }
        const title = `[Diary Review] Highlight from ${documentId || 'Logs'}`;
        const body = `**Source Document:** ${documentId || 'N/A'}\n\n**Highlighted Text:**\n> ${text.split('\\n').join('\\n> ')}\n\n**Comment:**\n${comment || 'No comment provided.'}`;
        // Create issue in wjexstudio-os
        const issue = await (0, githubService_1.createRepoIssue)('wjexstudio-os', title, body);
        res.json({
            status: 'success',
            data: issue
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
