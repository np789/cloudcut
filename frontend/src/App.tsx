import { useState, useEffect } from 'react';
import { authApi, workspacesApi } from '@/services/api';
import EditorLayout from '@/components/layout/EditorLayout';
import LoginPage from '@/components/auth/LoginPage';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      authApi.me()
        .then((user) => {
          localStorage.setItem('userId', user.id);
          setIsLoggedIn(true);
          return workspacesApi.list();
        })
        .then((workspaces) => {
          if (workspaces.length > 0) {
            return fetch(
              `http://localhost:3000/projects?workspaceId=${workspaces[0].id}`,
              { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }
            ).then((r) => r.json());
          }
        })
        .then((projectsData) => {
          if (projectsData?.data?.length > 0) {
            // Find Summer Campaign project (seeded), otherwise use first
            const seeded = projectsData.data.find((p: any) =>
              p.name.includes('Summer') || p.name.includes('Campaign')
            );
            setProjectId(seeded ? seeded.id : projectsData.data[0].id);
          }
        })
        .catch(() => {
          localStorage.removeItem('accessToken');
          setIsLoggedIn(false);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleLogin = (token: string, userId: string) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('userId', userId);
    setIsLoggedIn(true);
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen"
        style={{ background: 'hsl(224 71% 4%)', color: 'hsl(213 31% 91%)' }}>
        <div>Loading CloudCut...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <EditorLayout projectId={projectId} />;
}