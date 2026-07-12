import { Router } from 'express';
import { fetchProjects, toggleProjectTracking, getRepoFile, updateRepoFile } from '../services/githubService';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const projects = await fetchProjects();
    res.json(projects);
  } catch (error: any) {
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
    
    const newTopics = await toggleProjectTracking(repoName, track);
    res.json({ success: true, topics: newTopics });
  } catch (error: any) {
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
    const data = await getRepoFile(repoName, filePath);
    res.json(data);
  } catch (error: any) {
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
    
    const data = await updateRepoFile(repoName, filePath, content, sha, message);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error(`Error updating file:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
