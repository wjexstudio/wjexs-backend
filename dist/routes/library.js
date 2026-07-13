"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const router = (0, express_1.Router)();
const kbPath = path_1.default.join(os_1.default.homedir(), 'knowledge-base');
router.get('/realms', async (req, res) => {
    try {
        const entries = await promises_1.default.readdir(kbPath, { withFileTypes: true });
        const realms = entries
            .filter(entry => entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'brain')
            .map(entry => ({
            name: entry.name,
            path: entry.name,
        }));
        res.json(realms);
    }
    catch (error) {
        console.error('Error fetching realms:', error.message);
        res.status(500).json({ error: error.message });
    }
});
router.get('/realms/:realm/files', async (req, res) => {
    try {
        const { realm } = req.params;
        // Basic sanitization
        if (realm.includes('..') || realm.includes('/')) {
            return res.status(400).json({ error: 'Invalid realm name' });
        }
        const realmPath = path_1.default.join(kbPath, realm);
        const stat = await promises_1.default.stat(realmPath).catch(() => null);
        if (!stat || !stat.isDirectory()) {
            return res.status(404).json({ error: 'Realm not found' });
        }
        // Helper to get files recursively or just top level
        const files = [];
        async function readFiles(dir, relativeDir = '') {
            const entries = await promises_1.default.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.name.startsWith('.'))
                    continue;
                const fullPath = path_1.default.join(dir, entry.name);
                const relPath = path_1.default.join(relativeDir, entry.name);
                if (entry.isDirectory()) {
                    await readFiles(fullPath, relPath);
                }
                else if (entry.name.endsWith('.md')) {
                    const stats = await promises_1.default.stat(fullPath);
                    files.push({
                        name: entry.name,
                        path: relPath,
                        size: stats.size,
                        mtime: stats.mtime
                    });
                }
            }
        }
        await readFiles(realmPath);
        res.json(files);
    }
    catch (error) {
        console.error(`Error fetching files for realm ${req.params.realm}:`, error.message);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
