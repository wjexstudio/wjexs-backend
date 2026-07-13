import { Router } from 'express';
import { getCharacters, getCharacter, createCharacter, updateCharacter, archiveCharacter } from '../services/githubService';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const characters = await getCharacters();
    res.json(characters);
  } catch (error: any) {
    console.error('Error fetching characters:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { id, charterContent } = req.body;
    if (!id || !charterContent) return res.status(400).json({ error: 'id and charterContent required' });
    const data = await createCharacter(id, charterContent);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error creating character:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const character = await getCharacter(req.params.id);
    res.json(character);
  } catch (error: any) {
    console.error('Error fetching character:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { charterContent, sha } = req.body;
    if (!charterContent) return res.status(400).json({ error: 'charterContent required' });
    const data = await updateCharacter(req.params.id, charterContent, sha);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error updating character:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/archive', async (req, res) => {
  try {
    const data = await archiveCharacter(req.params.id);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error archiving character:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
