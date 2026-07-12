import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import projectsRouter from './routes/projects';
import questsRouter from './routes/quests';

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.use('/api/v1/projects', projectsRouter);
app.use('/api/v1/quests', questsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'wjexs-backend' });
});

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
