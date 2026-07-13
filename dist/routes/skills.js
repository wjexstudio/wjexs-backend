"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// Deterministic random generator for consistent positions
function seededRandom(seed) {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}
router.get('/', async (req, res) => {
    try {
        const token = process.env.GITHUB_TOKEN;
        if (!token)
            throw new Error('GITHUB_TOKEN is missing');
        const userRes = await fetch('https://api.github.com/user', {
            headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'wjexstudio-os-backend' }
        });
        const owner = (await userRes.json()).login;
        const resGithub = await fetch(`https://api.github.com/repos/${owner}/wjexstudio-os/contents/.agents/skills`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'wjexstudio-os-backend' }
        });
        if (!resGithub.ok)
            throw new Error('Failed to fetch skills directory');
        const items = await resGithub.json();
        const clustersMap = {
            'Core Logic': { name: 'Core Logic', center: [20, 20], count: 0 },
            'Memory': { name: 'Memory', center: [80, 20], count: 0 },
            'Communication': { name: 'Communication', center: [50, 80], count: 0 },
            'Other': { name: 'Other', center: [50, 50], count: 0 }
        };
        const skills = [];
        let seed = 1;
        for (const item of items) {
            if (item.type === 'dir') {
                const name = item.name;
                // Simple assignment based on name
                let cluster_name = 'Other';
                if (name.includes('memory') || name.includes('session'))
                    cluster_name = 'Memory';
                else if (name.includes('caveman'))
                    cluster_name = 'Communication';
                else if (name.includes('team') || name.includes('orchestration') || name.includes('crew'))
                    cluster_name = 'Core Logic';
                clustersMap[cluster_name].count++;
                const center = clustersMap[cluster_name].center;
                // Distribute around center
                const r = seededRandom(seed++) * 15;
                const theta = seededRandom(seed++) * 2 * Math.PI;
                skills.push({
                    id: name,
                    name: name,
                    cluster_name,
                    position: {
                        x: center[0] + r * Math.cos(theta),
                        y: center[1] + r * Math.sin(theta)
                    },
                    usage_count: Math.floor(seededRandom(seed++) * 100),
                    stars: Math.floor(seededRandom(seed++) * 5) + 1
                });
            }
        }
        const clusters = Object.values(clustersMap).filter(c => c.count > 0);
        res.json({ skills, clusters });
    }
    catch (error) {
        console.error('Error fetching skills:', error.message);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
