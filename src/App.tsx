import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Github, Search } from 'lucide-react';
import CommitChart from './components/commit/commitchart';

// Types for GitHub API responses
interface GithubRepo {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
}

interface GithubUser {
  login: string;
  avatar_url: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  html_url: string;
}

interface CommitData {
  date: string;
  count: number;
}

interface CommitItem {
  commit: {
    author: {
      date: string;
    };
    message: string;
  };
  html_url: string;
  repository: {
    name: string;
  };
}

interface CommitResponse {
  items: CommitItem[];
  total_count: number;
}

const App = () => {
  const [username, setUsername] = useState('');
  const [inputUsername, setInputUsername] = useState('');
  const [user, setUser] = useState<GithubUser | null>(null);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [commitData, setCommitData] = useState<CommitData[]>([]);
  const [recentCommits, setRecentCommits] = useState<CommitItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!inputUsername.trim()) return;
    
    setLoading(true);
    setError(null);
    setUsername(inputUsername);
    
    try {
      // Fetch user data
      const userResponse = await fetch(`https://api.github.com/users/${inputUsername}`);
      if (!userResponse.ok) {
        throw new Error(`User not found or API rate limit exceeded`);
      }
      const userData = await userResponse.json();
      setUser(userData);
      
      // Fetch repositories
      const reposResponse = await fetch(`https://api.github.com/users/${inputUsername}/repos?sort=updated&per_page=100`);
      const reposData = await reposResponse.json();
      setRepos(reposData);
      
      // Fetch commit data
      const commitsResponse = await fetch(`https://api.github.com/search/commits?q=author:${inputUsername}&sort=author-date&order=desc&page=1`);
      const commitsData: CommitResponse = await commitsResponse.json();
      
      // Process commit data for chart
      const commitsByDate = new Map<string, number>();
      const last30Days = new Array(30).fill(0).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      });
      
      last30Days.forEach(date => commitsByDate.set(date, 0));
      
      commitsData.items.forEach(item => {
        const date = item.commit.author.date.split('T')[0];
        if (commitsByDate.has(date)) {
          commitsByDate.set(date, (commitsByDate.get(date) || 0) + 1);
        }
      });
      
      const chartData = Array.from(commitsByDate.entries()).map(([date, count]) => ({
        date,
        count
      })).sort((a, b) => a.date.localeCompare(b.date));
      
      setCommitData(chartData);
      setRecentCommits(commitsData.items.slice(0, 5));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setUser(null);
      setRepos([]);
      setCommitData([]);
      setRecentCommits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        handleSearch();
      }
    };

    document.addEventListener('keypress', handleKeyPress);
    return () => {
      document.removeEventListener('keypress', handleKeyPress);
    };
  }, [inputUsername]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <header className="flex items-center mb-8 bg-white/50 p-4 rounded-lg backdrop-blur-sm">
        <Github className="h-8 w-8 mr-2 text-indigo-600" />
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          GitHub User Metrics
        </h1>
      </header>

      <div className="flex mx-auto max-w-lg gap-2 mb-6">
        <Input
          type="text"
          placeholder="Enter GitHub username"
          value={inputUsername}
          onChange={(e) => setInputUsername(e.target.value)}
          className="max-w-md bg-white/70 backdrop-blur-sm"
        />
        <Button 
          onClick={handleSearch} 
          disabled={loading}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          {loading ? 'Loading...' : <Search className="h-4 w-4 mr-2" />}
          Search
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6 bg-white/70 backdrop-blur-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {user && (
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="md:col-span-1 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <div className="flex flex-col items-center">
                <img 
                  src={user.avatar_url} 
                  alt={`${user.login}'s avatar`} 
                  className="w-24 h-24 rounded-full mb-4"
                />
                <CardTitle>{user.name || user.login}</CardTitle>
                <CardDescription className="text-center mt-1">
                  <a href={user.html_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center text-blue-600">
                    @{user.login}
                    <Github className="h-4 w-4 ml-1" />
                  </a>
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {user.bio && <p className="text-sm text-center mb-4">{user.bio}</p>}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-2xl font-bold">{user.public_repos}</p>
                  <p className="text-xs text-gray-500">Repos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{user.followers}</p>
                  <p className="text-xs text-gray-500">Followers</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{user.following}</p>
                  <p className="text-xs text-gray-500">Following</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-3">
            <Tabs defaultValue="repositories" className="bg-white/70 backdrop-blur-sm rounded-lg p-4">
              <TabsList className="mb-4 bg-gradient-to-r from-indigo-100 to-purple-100">
                <TabsTrigger value="repositories">Repositories</TabsTrigger>
                <TabsTrigger value="commits">Activity</TabsTrigger>
              </TabsList>
              
              <TabsContent value="repositories">
                {repos.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {repos.slice(0, 6).map(repo => (
                      <Card key={repo.id}>
                        <CardHeader>
                          <CardTitle className="text-lg">
                            <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {repo.name}
                            </a>
                          </CardTitle>
                          {repo.language && (
                            <CardDescription>{repo.language}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">{repo.description || 'No description provided'}</p>
                        </CardContent>
                        <CardFooter className="flex justify-between text-sm text-gray-500">
                          <div>⭐ {repo.stargazers_count}</div>
                          <div>🍴 {repo.forks_count}</div>
                          <div>Updated: {new Date(repo.updated_at).toLocaleDateString()}</div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center">No repositories found</p>
                    </CardContent>
                  </Card>
                )}
                {repos.length > 6 && (
                  <div className="mt-4 text-center">
                    <a 
                      href={`https://github.com/${username}?tab=repositories`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View all {repos.length} repositories
                    </a>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="commits">
                <div className="space-y-6">
                  <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg transition-all duration-300 hover:shadow-xl">
                    <CardHeader className="space-y-1">
                      <CardTitle className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Commit Activity
                      </CardTitle>
                      <CardDescription>
                        Contribution activity in the last 30 days
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-auto">
                        <CommitChart data={commitData} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg transition-all duration-300 hover:shadow-xl">
                    <CardHeader className="space-y-1">
                      <CardTitle className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Recent Commits
                      </CardTitle>
                      <CardDescription>
                        Latest contribution activity
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="divide-y divide-gray-100">
                        {recentCommits.map((commit, index) => (
                          <a
                            key={index}
                            href={commit.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-4 transition-colors duration-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 rounded-lg"
                          >
                            <div className="flex flex-col space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-indigo-600">
                                  {commit.repository.name}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {new Date(commit.commit.author.date).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {commit.commit.message}
                              </p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
      
      {!user && !loading && !error && (
        <Card className="w-full max-w-lg mx-auto bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              GitHub User Metrics
            </CardTitle>
            <CardDescription className="text-center">
              Enter a GitHub username to view their repositories and commit activity
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-6">
            <Github className="h-20 w-20 text-gray-300" />
          </CardContent>
        </Card>
      )}
     
    </div>
  );
};

export default App;