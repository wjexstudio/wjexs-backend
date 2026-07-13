"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const githubService_1 = require("../services/githubService");
const router = (0, express_1.Router)();
// Helper to extract mode from labels
const getQuestMode = (labels) => {
    const modeLabel = labels.find(l => l.name.startsWith('mode:'));
    return modeLabel ? modeLabel.name.replace('mode:', '') : 'do_later';
};
// GET /api/v1/quests
router.get('/', async (req, res) => {
    try {
        const { projectId } = req.query;
        let reposToFetch = [];
        if (projectId) {
            reposToFetch.push(projectId);
        }
        else {
            // If no projectId is provided, we fetch from a few key repos for demo purposes
            reposToFetch = ['wjexs-backend', 'wjexs-frontend', 'wjexstudio-os'];
        }
        const allQuests = [];
        // Fetch issues concurrently
        const promises = reposToFetch.map(async (repo) => {
            try {
                const issues = await (0, githubService_1.getRepoIssues)(repo);
                // Filter out pull requests, only keep issues
                const onlyIssues = issues.filter((issue) => !issue.pull_request);
                return onlyIssues.map((issue) => ({
                    id: `${repo}__${issue.number}`,
                    title: issue.title,
                    project: repo,
                    mode: getQuestMode(issue.labels),
                    priority: issue.milestone ? 1 : (issue.state === 'open' ? 2 : 3), // Simple priority logic
                    status: issue.state, // 'open' or 'closed'
                }));
            }
            catch (err) {
                console.warn(`Failed to fetch issues for ${repo}`, err);
                return [];
            }
        });
        const results = await Promise.all(promises);
        // Flatten and sort
        results.forEach(r => allQuests.push(...r));
        allQuests.sort((a, b) => a.priority - b.priority);
        res.json(allQuests);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/v1/quests
router.post('/', async (req, res) => {
    try {
        const { projectId, title, description, mode } = req.body;
        if (!projectId || !title) {
            return res.status(400).json({ error: 'projectId and title are required' });
        }
        // mode will be added as a label (would need custom label creation in a real scenario, but we skip it here for simplicity or assume it exists)
        // Actually, GitHub API to create issue with labels:
        const token = process.env.GITHUB_TOKEN;
        const userRes = await fetch('https://api.github.com/user', { headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'wjexstudio-os-backend' } });
        const owner = (await userRes.json()).login;
        const resGithub = await fetch(`https://api.github.com/repos/${owner}/${projectId}/issues`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'wjexstudio-os-backend', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                body: description || '',
                labels: mode ? [`mode:${mode}`] : ['mode:do_later']
            })
        });
        if (!resGithub.ok)
            throw new Error('Failed to create issue');
        const issue = await resGithub.json();
        res.status(201).json({
            id: `${projectId}__${issue.number}`,
            title: issue.title,
            project: projectId,
            mode: getQuestMode(issue.labels),
            priority: 2
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// PATCH /api/v1/quests/:id/mode
router.patch('/:id/mode', async (req, res) => {
    try {
        const { id } = req.params;
        const { mode } = req.body;
        if (!mode)
            return res.status(400).json({ error: 'mode is required' });
        const [repo, issueNumber] = id.split('__');
        if (!repo || !issueNumber)
            return res.status(400).json({ error: 'Invalid quest ID format (expected repo__number)' });
        // To update labels, we need to first get existing labels
        const token = process.env.GITHUB_TOKEN;
        const userRes = await fetch('https://api.github.com/user', { headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'wjexstudio-os-backend' } });
        const owner = (await userRes.json()).login;
        const issueRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'wjexstudio-os-backend' }
        });
        const issue = await issueRes.json();
        const existingLabels = issue.labels.map((l) => l.name).filter((n) => !n.startsWith('mode:'));
        const newLabels = [...existingLabels, `mode:${mode}`];
        const updateRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'wjexstudio-os-backend', 'Content-Type': 'application/json' },
            body: JSON.stringify({ labels: newLabels })
        });
        if (!updateRes.ok)
            throw new Error('Failed to update labels');
        const updatedIssue = await updateRes.json();
        res.json({
            id,
            title: updatedIssue.title,
            project: repo,
            mode: getQuestMode(updatedIssue.labels),
            priority: updatedIssue.milestone ? 1 : 2
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/v1/quests/:id/run
router.post('/:id/run', async (req, res) => {
    try {
        const { id } = req.params;
        // In a real system, this would trigger an agent action.
        // Here we just simulate updating the issue comment or status.
        const [repo, issueNumber] = id.split('__');
        const token = process.env.GITHUB_TOKEN;
        const userRes = await fetch('https://api.github.com/user', { headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'wjexstudio-os-backend' } });
        const owner = (await userRes.json()).login;
        // Add a comment
        await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'wjexstudio-os-backend', 'Content-Type': 'application/json' },
            body: JSON.stringify({ body: `🚀 **Quest Execution Triggered**\nAgent is now running this quest in mode \`do_now\`...` })
        });
        res.json({ success: true, message: 'Quest execution triggered' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/v1/quests/trigger
router.post('/trigger', async (req, res) => {
    try {
        // Manual trigger for the scheduler
        res.json({ success: true, message: 'Manual trigger activated. The backend scheduler is processing quests.' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
