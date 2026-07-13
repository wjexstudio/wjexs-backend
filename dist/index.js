"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const projects_1 = __importDefault(require("./routes/projects"));
const quests_1 = __importDefault(require("./routes/quests"));
const characters_1 = __importDefault(require("./routes/characters"));
const library_1 = __importDefault(require("./routes/library"));
const skills_1 = __importDefault(require("./routes/skills"));
const webhooks_1 = __importDefault(require("./routes/webhooks"));
const gates_1 = __importDefault(require("./routes/gates"));
const diaryReviews_1 = __importDefault(require("./routes/diaryReviews"));
const app = (0, express_1.default)();
const port = process.env.PORT || 8080;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api/v1/projects', projects_1.default);
app.use('/api/v1/quests', quests_1.default);
app.use('/api/v1/characters', characters_1.default);
app.use('/api/v1/library', library_1.default);
app.use('/api/v1/dashboard/skills', skills_1.default);
app.use('/api/v1/dashboard/gates', gates_1.default);
app.use('/api/v1/dashboard/diary-reviews', diaryReviews_1.default);
app.use('/api/v1/webhooks', webhooks_1.default);
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'wjexs-backend' });
});
app.listen(port, () => {
    console.log(`🚀 Server is running on port ${port}`);
});
