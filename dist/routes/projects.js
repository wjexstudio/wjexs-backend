"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const githubService_1 = require("../services/githubService");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const projects = await (0, githubService_1.fetchProjects)();
        res.json(projects);
    }
    catch (error) {
        console.error('Error fetching projects:', error.message);
        res.status(500).json({ error: error.message });
    }
});
router.post('/:repoName/track', async (req, res) => {
    try {
        const { repoName } = req.params;
        const { track } = req.body;
        if (typeof track !== 'boolean') {
            return res.status(400).json({ error: 'Missing track boolean in body' });
        }
        const newTopics = await (0, githubService_1.toggleProjectTracking)(repoName, track);
        res.json({ success: true, topics: newTopics });
    }
    catch (error) {
        console.error(`Error toggling track for ${req.params.repoName}:`, error.message);
        res.status(500).json({ error: error.message });
    }
});
// GET file content
// Example: /api/v1/projects/wjexstudio-os/files/README.md
// We use (*) to catch the whole file path
router.get('/:repoName/files/*', async (req, res) => {
    try {
        const { repoName } = req.params;
        const filePath = req.params[0]; // Captures the wildcard (*)
        const data = await (0, githubService_1.getRepoFile)(repoName, filePath);
        res.json(data);
    }
    catch (error) {
        console.error(`Error fetching file:`, error.message);
        res.status(500).json({ error: error.message });
    }
});
// PUT file content
router.put('/:repoName/files/*', async (req, res) => {
    try {
        const { repoName } = req.params;
        const filePath = req.params[0];
        const { content, sha, message } = req.body;
        const data = await (0, githubService_1.updateRepoFile)(repoName, filePath, content, sha, message);
        res.json({ success: true, data });
    }
    catch (error) {
        console.error(`Error updating file:`, error.message);
        res.status(500).json({ error: error.message });
    }
});
// GET issues
router.get('/:repoName/issues', async (req, res) => {
    try {
        const { repoName } = req.params;
        const data = await (0, githubService_1.getRepoIssues)(repoName);
        res.json(data);
    }
    catch (error) {
        console.error('Error fetching issues:', error.message);
        res.status(500).json({ error: error.message });
    }
});
// POST issue
router.post('/:repoName/issues', async (req, res) => {
    try {
        const { repoName } = req.params;
        const { title, body } = req.body;
        const data = await (0, githubService_1.createRepoIssue)(repoName, title, body);
        res.json({ success: true, data });
    }
    catch (error) {
        console.error('Error creating issue:', error.message);
        res.status(500).json({ error: error.message });
    }
});
// PATCH issue
router.patch('/:repoName/issues/:issueNumber', async (req, res) => {
    try {
        const { repoName } = req.params;
        const issueNumber = parseInt(req.params.issueNumber);
        const { title, body, state } = req.body;
        const data = await (0, githubService_1.updateRepoIssue)(repoName, issueNumber, title, body, state);
        res.json({ success: true, data });
    }
    catch (error) {
        console.error('Error updating issue:', error.message);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
