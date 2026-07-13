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
const OS_DIR = path_1.default.join(os_1.default.homedir(), 'projects', 'wjexstudio-os');
const CHANGELOG_PATH = path_1.default.join(OS_DIR, 'CHANGELOG.md');
router.get('/', async (req, res) => {
    try {
        const content = await promises_1.default.readFile(CHANGELOG_PATH, 'utf-8');
        const lines = content.split('\n');
        const activities = [];
        let idCounter = 1;
        for (const line of lines) {
            if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                const text = line.trim().replace(/^[-*]\s+/, '');
                let agent = 'System';
                if (text.toLowerCase().includes('anna'))
                    agent = 'Anna';
                else if (text.toLowerCase().includes('yod'))
                    agent = 'Yod';
                else if (text.toLowerCase().includes('tracy'))
                    agent = 'Tracy';
                else if (text.toLowerCase().includes('tim'))
                    agent = 'Tim';
                else if (text.toLowerCase().includes('lewis'))
                    agent = 'Lewis';
                else if (text.toLowerCase().includes('pam'))
                    agent = 'Pam';
                else if (text.toLowerCase().includes('vickie'))
                    agent = 'Vickie';
                let status = 'completed';
                if (text.includes('QA APPROVED ✅')) {
                    status = 'verified';
                }
                else if (text.toLowerCase().includes('deferred') || text.toLowerCase().includes('aborted')) {
                    status = 'cancelled';
                }
                activities.push({
                    id: String(idCounter++),
                    title: text.replace(/\(QA APPROVED ✅\)/g, '').trim(),
                    agent: agent,
                    time: 'Historic Log',
                    status: status
                });
                if (activities.length >= 50)
                    break;
            }
        }
        res.json({
            status: 'success',
            data: activities
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
