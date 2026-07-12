export interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress_percent: number;
  total_issues: number;
  closed_issues: number;
  repo_url: string;
  created_at: string;
  updated_at: string;
  topics: string[];
}

export const fetchProjects = async (): Promise<ProjectData[]> => {
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

  return repos.map((repo: any) => {
    const total_issues = repo.issues.totalCount;
    const closed_issues = repo.closedIssues.totalCount;
    let progress_percent = 0;
    
    if (total_issues > 0) {
      progress_percent = Math.round((closed_issues / total_issues) * 100);
    }

    let status = 'Active';
    if (repo.isArchived) {
      status = 'Archived';
    } else if (total_issues > 0 && closed_issues === total_issues) {
      status = 'Completed';
    }

    const topics = repo.repositoryTopics?.nodes.map((node: any) => node.topic.name) || [];

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

export const toggleProjectTracking = async (repoName: string, isTracking: boolean): Promise<string[]> => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is missing');

  const userRes = await fetch('https://api.github.com/user', {
    headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'wjexstudio-os-backend' }
  });
  if (!userRes.ok) throw new Error('Failed to fetch user');
  const owner = (await userRes.json()).login;

  const getRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/topics`, {
    headers: { 
      'Authorization': `Bearer ${token}`, 
      'Accept': 'application/vnd.github.mercy-preview+json',
      'User-Agent': 'wjexstudio-os-backend' 
    }
  });
  if (!getRes.ok) throw new Error('Failed to fetch repo topics');
  const topicData = await getRes.json();
  let names: string[] = topicData.names || [];

  if (isTracking) {
    if (!names.includes('wjex-active')) names.push('wjex-active');
  } else {
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
  
  if (!putRes.ok) throw new Error('Failed to update topics');
  return (await putRes.json()).names;
};

// ==========================================
// NEW: Fetch File Content
// ==========================================
export const getRepoFile = async (repoName: string, filePath: string) => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is missing');

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

// ==========================================
// NEW: Update File Content
// ==========================================
export const updateRepoFile = async (repoName: string, filePath: string, newContent: string, sha: string | null, message: string = 'Update via WJEX OS') => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is missing');

  const userRes = await fetch('https://api.github.com/user', {
    headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'wjexstudio-os-backend' }
  });
  const owner = (await userRes.json()).login;

  const contentBase64 = Buffer.from(newContent, 'utf-8').toString('base64');

  const body: any = {
    message,
    content: contentBase64,
  };
  if (sha) body.sha = sha;

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
