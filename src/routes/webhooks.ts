import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

const getQuestMode = (labels: any[]) => {
  const modeLabel = labels.find((l: any) => l.name.startsWith('mode:'));
  return modeLabel ? modeLabel.name.replace('mode:', '') : 'do_later';
};

router.post('/github/issues', async (req, res) => {
  try {
    const event = req.headers['x-github-event'];
    
    // We only care about issues event
    if (event !== 'issues') {
      return res.status(200).send('Ignored event');
    }

    const { action, issue, repository } = req.body;

    if (!issue || !repository) {
      return res.status(400).send('Invalid payload');
    }

    const repoName = repository.name;
    const issueNumber = issue.number;
    const questId = `${repoName}__${issueNumber}`;

    // Ensure the Project exists
    // Fallback logic: check by githubRepo first, then by name
    let project = await prisma.project.findFirst({
      where: {
        OR: [
          { githubRepo: repoName },
          { name: repoName }
        ]
      }
    });

    if (!project) {
      // Try to fallback to "WJEXSTUDIO-OS" as a default project if repo mapping isn't strict?
      // "assign it to a default 'WJEXSTUDIO-OS' project or extract it from the GitHub Repo"
      // Let's create it dynamically with the repo name to keep it mapped.
      project = await prisma.project.create({
        data: {
          name: repoName,
          githubRepo: repoName,
          description: repository.description || '',
        }
      });
    }

    const title = issue.title;
    const description = issue.body || '';
    const mode = getQuestMode(issue.labels || []);
    const priority = issue.milestone ? 1 : (issue.state === 'open' ? 2 : 3);
    const status = issue.state; // 'open' or 'closed'

    if (action === 'deleted') {
      // Handle deleted issue
      await prisma.quest.delete({
        where: { id: questId }
      }).catch(() => {}); // ignore if it doesn't exist
    } else {
      // Upsert the Quest
      await prisma.quest.upsert({
        where: { id: questId },
        update: {
          title,
          description,
          mode,
          priority,
          status,
          projectId: project.id
        },
        create: {
          id: questId,
          title,
          description,
          mode,
          priority,
          status,
          projectId: project.id
        }
      });
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
