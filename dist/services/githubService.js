"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.archiveCharacter = exports.createCharacter = exports.updateCharacter = exports.getCharacter = exports.getCharacters = exports.updateRepoIssue = exports.createRepoIssue = exports.getRepoIssues = exports.updateRepoFile = exports.getRepoFile = exports.toggleProjectTracking = exports.fetchProjects = void 0;
const fetchProjects = async () => {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        throw new Error('GITHUB_TOKEN is missing in environment variables');
    }
    const query = `
    query {
      viewer {
        repositories(first: 50, ownerAffiliations: OWNER, orderBy: {field: UPDATED_AT, direction: DESC}) {
          nodes {
            name
            description
            url
            createdAt
            updatedAt
            isArchived
            issues(states: [OPEN, CLOSED]) {
              totalCount
            }
            closedIssues: issues(states: [CLOSED]) {
              totalCount
            }
            repositoryTopics(first: 10) {
              nodes {
                topic {
                  name
                }
              }
            }
          }
        }
      }
    }
  `;
    const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'wjexstudio-os-backend'
        },
        body: JSON.stringify({ query })
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const result = await response.json();
    if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }
    const repos = result.data.viewer.repositories.nodes;
    return repos.map((repo) => {
        const total_issues = repo.issues.totalCount;
        const closed_issues = repo.closedIssues.totalCount;
        let progress_percent = 0;
        if (total_issues > 0) {
            progress_percent = Math.round((closed_issues / total_issues) * 100);
        }
        let status = 'Active';
        if (repo.isArchived) {
            status = 'Archived';
        }
        else if (total_issues > 0 && closed_issues === total_issues) {
            status = 'Completed';
        }
        const topics = repo.repositoryTopics?.nodes.map((node) => node.topic.name) || [];
        return {
            id: repo.name,
            name: repo.name,
            description: repo.description,
            status,
            progress_percent,
            total_issues,
            closed_issues,
            repo_url: repo.url,
            created_at: repo.createdAt,
            updated_at: repo.updatedAt,
            topics
        };
    });
};
exports.fetchProjects = fetchProjects;
const toggleProjectTracking = async (repoName, isTracking) => {
    const token = process.env.GITHUB_TOKEN;
    if (!token)
        throw new Error('GITHUB_TOKEN is missing');
    const userRes = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'wjexstudio-os-backend' }
    });
    if (!userRes.ok)
        throw new Error('Failed to fetch user');
    const owner = (await userRes.json()).login;
    const getRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/topics`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.mercy-preview+json',
            'User-Agent': 'wjexstudio-os-backend'
        }
    });
    if (!getRes.ok)
        throw new Error('Failed to fetch repo topics');
    const topicData = await getRes.json();
    let names = topicData.names || [];
    if (isTracking) {
        if (!names.includes('wjex-active'))
            names.push('wjex-active');
    }
    else {
        names = names.filter(n => n !== 'wjex-active');
    }
    const putRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/topics`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.mercy-preview+json',
            'User-Agent': 'wjexstudio-os-backend',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ names })
    });
    if (!putRes.ok)
        throw new Error('Failed to update topics');
    return (await putRes.json()).names;
};
exports.toggleProjectTracking = toggleProjectTracking;
// ==========================================
// NEW: Fetch File Content
// ==========================================
const getRepoFile = async (repoName, filePath) => {
    const token = process.env.GITHUB_TOKEN;
    if (!token)
        throw new Error('GITHUB_TOKEN is missing');
    const userRes = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'wjexstudio-os-backend' }
    });
    const owner = (await userRes.json()).login;
    const res = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'wjexstudio-os-backend' }
    });
    if (res.status === 404) {
        return { content: '', sha: null };
    }
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to fetch file: ${errText}`);
    }
    const data = await res.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return { content, sha: data.sha };
};
exports.getRepoFile = getRepoFile;
// ==========================================
// NEW: Update File Content
// ==========================================
const updateRepoFile = async (repoName, filePath, newContent, sha, message = 'Update via WJEX OS') => {
    const token = process.env.GITHUB_TOKEN;
    if (!token)
        throw new Error('GITHUB_TOKEN is missing');
    const userRes = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'wjexstudio-os-backend' }
    });
    const owner = (await userRes.json()).login;
    const contentBase64 = Buffer.from(newContent, 'utf-8').toString('base64');
    const body = {
        message,
        content: contentBase64,
    };
    if (sha)
        body.sha = sha;
    const res = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'wjexstudio-os-backend', 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to update file: ${errorText}`);
    }
    return await res.json();
};
exports.updateRepoFile = updateRepoFile;
// ==========================================
// NEW: Issues Management
// ==========================================
const getRepoIssues = async (repoName) => {
    const token = process.env.GITHUB_TOKEN;
    if (!token)
        throw new Error('GITHUB_TOKEN is missing');
    const userRes = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'wjexstudio-os-backend' }
    });
    const owner = (await userRes.json()).login;
    const res = await fetch(`https://api.github.com/repos/${owner}/${repoName}/issues?state=all&sort=updated&direction=desc`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'wjexstudio-os-backend' }
    });
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to fetch issues: ${errText}`);
    }
    return await res.json();
};
exports.getRepoIssues = getRepoIssues;
const createRepoIssue = async (repoName, title, body) => {
    const token = process.env.GITHUB_TOKEN;
    if (!token)
        throw new Error('GITHUB_TOKEN is missing');
    const userRes = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'wjexstudio-os-backend' }
    });
    const owner = (await userRes.json()).login;
    const res = await fetch(`https://api.github.com/repos/${owner}/${repoName}/issues`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'wjexstudio-os-backend', 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body })
    });
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to create issue: ${errText}`);
    }
    return await res.json();
};
exports.createRepoIssue = createRepoIssue;
const updateRepoIssue = async (repoName, issueNumber, title, body, state) => {
    const token = process.env.GITHUB_TOKEN;
    if (!token)
        throw new Error('GITHUB_TOKEN is missing');
    const userRes = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'wjexstudio-os-backend' }
    });
    const owner = (await userRes.json()).login;
    const payload = { title, body };
    if (state)
        payload.state = state;
    const res = await fetch(`https://api.github.com/repos/${owner}/${repoName}/issues/${issueNumber}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'wjexstudio-os-backend', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to update issue: ${errText}`);
    }
    return await res.json();
};
exports.updateRepoIssue = updateRepoIssue;
// ==========================================
// CHARACTERS API (from wjexstudio-os/.agents)
// ==========================================
const getCharacters = async () => {
    const token = process.env.GITHUB_TOKEN;
    if (!token)
        throw new Error('GITHUB_TOKEN is missing');
    const userRes = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'wjexstudio-os-backend' }
    });
    const owner = (await userRes.json()).login;
    const res = await fetch(`https://api.github.com/repos/${owner}/wjexstudio-os/contents/.agents`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'wjexstudio-os-backend' }
    });
    if (!res.ok)
        throw new Error('Failed to fetch agents directory');
    const items = await res.json();
    const agents = [];
    for (const item of items) {
        if (item.type === 'dir' && item.name !== 'skills') {
            // Basic info
            let status = 'Active';
            // In a real app we might fetch CHARTER.md to get full details here, 
            // but to save API calls, we'll just return the names and fetch details individually later, 
            // or we can fetch them all via GraphQL in a single batch if needed.
            // For now, return basic stub. We will fetch CHARTER.md in getCharacter.
            agents.push({
                id: item.name,
                name: item.name,
                status: status,
                path: item.path
            });
        }
    }
    return agents;
};
exports.getCharacters = getCharacters;
const getCharacter = async (id) => {
    const fileData = await (0, exports.getRepoFile)('wjexstudio-os', `.agents/${id}/CHARTER.md`);
    return { id, charter: fileData.content, sha: fileData.sha };
};
exports.getCharacter = getCharacter;
const updateCharacter = async (id, charterContent, sha) => {
    return await (0, exports.updateRepoFile)('wjexstudio-os', `.agents/${id}/CHARTER.md`, charterContent, sha, `Update Agent: ${id}`);
};
exports.updateCharacter = updateCharacter;
const createCharacter = async (id, charterContent) => {
    // Creating a new file in github creates the directory automatically
    return await (0, exports.updateRepoFile)('wjexstudio-os', `.agents/${id}/CHARTER.md`, charterContent, null, `Create Agent: ${id}`);
};
exports.createCharacter = createCharacter;
const archiveCharacter = async (id) => {
    // Archive could be just renaming the folder to .agents/archived_agents/{id} 
    // or just updating a status in CHARTER.md. Let's append an Archived status to CHARTER.md for simplicity
    const { charter, sha } = await (0, exports.getCharacter)(id);
    const newContent = charter + '\n\n## Status\nArchived';
    return await (0, exports.updateCharacter)(id, newContent, sha);
};
exports.archiveCharacter = archiveCharacter;
