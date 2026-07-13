"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gateEvents = void 0;
const express_1 = require("express");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const events_1 = require("events");
const router = (0, express_1.Router)();
exports.gateEvents = new events_1.EventEmitter();
const OS_DIR = path_1.default.join(os_1.default.homedir(), 'projects', 'wjexstudio-os');
const AGENTS_MD_PATH = path_1.default.join(OS_DIR, 'AGENTS.md');
const CONFIG_DIR = path_1.default.join(os_1.default.homedir(), 'knowledge-base', 'config');
const GATES_STATE_PATH = path_1.default.join(CONFIG_DIR, 'gates_state.json');
// Ensure config dir exists
const ensureConfig = async () => {
    try {
        await promises_1.default.mkdir(CONFIG_DIR, { recursive: true });
        try {
            await promises_1.default.access(GATES_STATE_PATH);
        }
        catch {
            await promises_1.default.writeFile(GATES_STATE_PATH, JSON.stringify({}));
        }
    }
    catch (err) {
        console.error('Error ensuring config dir:', err);
    }
};
router.get('/', async (req, res) => {
    try {
        await ensureConfig();
        const content = await promises_1.default.readFile(AGENTS_MD_PATH, 'utf-8');
        const stateContent = await promises_1.default.readFile(GATES_STATE_PATH, 'utf-8');
        const states = JSON.parse(stateContent);
        const rules = [];
        const lines = content.split('\n');
        let currentId = '';
        let currentTitle = '';
        let currentDescription = '';
        for (const line of lines) {
            // Clean up markdown bolding and get title
            const match = line.match(/^## (\d+)\.\s+(.*)/);
            if (match) {
                if (currentId) {
                    rules.push({
                        id: currentId,
                        title: currentTitle.replace(/\*\*/g, '').trim(),
                        description: currentDescription.trim().substring(0, 150) + '...',
                        active: states[currentId] !== false
                    });
                }
                currentId = `rule_${match[1]}`;
                currentTitle = match[2];
                currentDescription = '';
            }
            else if (currentId && !line.startsWith('##')) {
                if (line.trim().length > 0) {
                    currentDescription += line + ' ';
                }
            }
        }
        if (currentId) {
            rules.push({
                id: currentId,
                title: currentTitle.replace(/\*\*/g, '').trim(),
                description: currentDescription.trim().substring(0, 150) + '...',
                active: states[currentId] !== false
            });
        }
        res.json(rules);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.patch('/:id/toggle', async (req, res) => {
    try {
        const { id } = req.params;
        await ensureConfig();
        const stateContent = await promises_1.default.readFile(GATES_STATE_PATH, 'utf-8');
        const states = JSON.parse(stateContent);
        const currentState = states[id] !== false;
        states[id] = !currentState;
        await promises_1.default.writeFile(GATES_STATE_PATH, JSON.stringify(states, null, 2));
        exports.gateEvents.emit('log', {
            timestamp: new Date().toISOString(),
            message: `[TOGGLE] ${id} -> ${states[id] ? 'ON' : 'OFF'}`,
            level: 'info'
        });
        res.json({ success: true, id, active: states[id] });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    const onLog = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };
    exports.gateEvents.on('log', onLog);
    res.write(`data: ${JSON.stringify({ timestamp: new Date().toISOString(), message: '[SYSTEM] Hook Interceptor Connected', level: 'system' })}\n\n`);
    req.on('close', () => {
        exports.gateEvents.off('log', onLog);
    });
});
exports.default = router;
