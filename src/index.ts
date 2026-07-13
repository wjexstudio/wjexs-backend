import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import projectsRouter from './routes/projects';
import questsRouter from './routes/quests';
import charactersRouter from './routes/characters';
import libraryRouter from './routes/library';
import skillsRouter from './routes/skills';
import webhooksRouter from './routes/webhooks';
import gatesRouter from './routes/gates';
import diaryReviewsRouter from './routes/diaryReviews';

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.use('/api/v1/projects', projectsRouter);
app.use('/api/v1/quests', questsRouter);
app.use('/api/v1/characters', charactersRouter);
app.use('/api/v1/library', libraryRouter);
app.use('/api/v1/dashboard/skills', skillsRouter);
app.use('/api/v1/dashboard/gates', gatesRouter);
app.use('/api/v1/dashboard/diary-reviews', diaryReviewsRouter);
app.use('/api/v1/webhooks', webhooksRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'wjexs-backend' });
});

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
