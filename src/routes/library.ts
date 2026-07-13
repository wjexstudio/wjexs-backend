import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const router = Router();
const kbPath = path.join(os.homedir(), 'knowledge-base');

router.get('/realms', async (req, res) => {
  try {
    const entries = await fs.readdir(kbPath, { withFileTypes: true });
    const realms = entries
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'brain')
      .map(entry => ({
        name: entry.name,
        path: entry.name,
      }));
    res.json(realms);
  } catch (error: any) {
    console.error('Error fetching realms:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/realms/:realm/files', async (req, res) => {
  try {
    const { realm } = req.params;
    // Basic sanitization
    if (realm.includes('..') || realm.includes('/')) {
      return res.status(400).json({ error: 'Invalid realm name' });
    }
    
    const realmPath = path.join(kbPath, realm);
    const stat = await fs.stat(realmPath).catch(() => null);
    if (!stat || !stat.isDirectory()) {
      return res.status(404).json({ error: 'Realm not found' });
    }

    // Helper to get files recursively or just top level
    const files: any[] = [];
    
    async function readFiles(dir: string, relativeDir: string = '') {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(relativeDir, entry.name);
        
        if (entry.isDirectory()) {
          await readFiles(fullPath, relPath);
        } else if (entry.name.endsWith('.md')) {
          const stats = await fs.stat(fullPath);
          files.push({
            name: entry.name,
            path: relPath,
            size: stats.size,
            mtime: stats.mtime
          });
        }
      }
    }

    await readFiles(realmPath);
    res.json(files);
  } catch (error: any) {
    console.error(`Error fetching files for realm ${req.params.realm}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
