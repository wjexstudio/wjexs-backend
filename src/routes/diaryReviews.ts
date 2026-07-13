import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { createRepoIssue } from '../services/githubService';

const router = Router();
const OS_DIR = process.env.OS_ROOT || path.join(os.homedir(), 'projects', 'wjexstudio-os');
const LOGS_DIR = path.join(OS_DIR, 'sessions', 'logs');

// List available diary logs
router.get('/', async (req, res) => {
  try {
    const files = await fs.readdir(LOGS_DIR);
    const mdFiles = files.filter(f => f.endsWith('.md') || f.endsWith('.txt') || f.endsWith('.log'));
    
    // Sort by latest first
    const sortedFiles = mdFiles.sort((a, b) => b.localeCompare(a));
    
    const documents = await Promise.all(sortedFiles.slice(0, 5).map(async (filename) => {
      const content = await fs.readFile(path.join(LOGS_DIR, filename), 'utf-8');
      const stats = await fs.stat(path.join(LOGS_DIR, filename));
      return {
        id: filename,
        title: filename,
        document_text: content,
        updated_at: stats.mtime.toISOString()
      };
    }));

    res.json({
      status: 'success',
      data: documents
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Export highlighted text to GitHub Quests
router.post('/export', async (req, res) => {
  try {
    const { documentId, text, comment } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Missing text to export' });
    }

    const title = `[Diary Review] Highlight from ${documentId || 'Logs'}`;
    const body = `**Source Document:** ${documentId || 'N/A'}\n\n**Highlighted Text:**\n> ${text.split('\\n').join('\\n> ')}\n\n**Comment:**\n${comment || 'No comment provided.'}`;

    // Create issue in wjexstudio-os
    const issue = await createRepoIssue('wjexstudio-os', title, body);

    res.json({
      status: 'success',
      data: issue
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
