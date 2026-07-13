"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const githubService_1 = require("../services/githubService");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const characters = await (0, githubService_1.getCharacters)();
        res.json(characters);
    }
    catch (error) {
        console.error('Error fetching characters:', error.message);
        res.status(500).json({ error: error.message });
    }
});
router.post('/', async (req, res) => {
    try {
        const { id, charterContent } = req.body;
        if (!id || !charterContent)
            return res.status(400).json({ error: 'id and charterContent required' });
        const data = await (0, githubService_1.createCharacter)(id, charterContent);
        res.json({ success: true, data });
    }
    catch (error) {
        console.error('Error creating character:', error.message);
        res.status(500).json({ error: error.message });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const character = await (0, githubService_1.getCharacter)(req.params.id);
        res.json(character);
    }
    catch (error) {
        console.error('Error fetching character:', error.message);
        res.status(500).json({ error: error.message });
    }
});
router.patch('/:id', async (req, res) => {
    try {
        const { charterContent, sha } = req.body;
        if (!charterContent)
            return res.status(400).json({ error: 'charterContent required' });
        const data = await (0, githubService_1.updateCharacter)(req.params.id, charterContent, sha);
        res.json({ success: true, data });
    }
    catch (error) {
        console.error('Error updating character:', error.message);
        res.status(500).json({ error: error.message });
    }
});
router.patch('/:id/archive', async (req, res) => {
    try {
        const data = await (0, githubService_1.archiveCharacter)(req.params.id);
        res.json({ success: true, data });
    }
    catch (error) {
        console.error('Error archiving character:', error.message);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
