import { Router } from 'express';
import { questsService } from '../services/questsService';

const router = Router();

// GET /api/v1/quests
router.get('/', async (req, res) => {
  try {
    const { projectId } = req.query;
    const quests = await questsService.getQuests(projectId as string);
    res.json(quests);
  } catch (error: any) {
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
    const quest = await questsService.createQuest(projectId, title, description, mode);
    res.status(201).json(quest);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/v1/quests/:id
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { mode, status, priority } = req.body;
    const quest = await questsService.updateQuest(id, { mode, status, priority });
    res.json(quest);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/v1/quests/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await questsService.deleteQuest(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
