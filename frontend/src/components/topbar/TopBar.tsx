import { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { exportsApi } from '@/services/api';
import { useState } from 'react';

interface Props { project: Project | null; }

export default function TopBar({ project }: Props) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!project) return;
    setExporting(true);
    try {
      const job = await exportsApi.create(project.id);
      alert(`Export started! Job ID: ${job.id}\nStatus: ${job.status}`);
    } catch (e) {
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex items-center justify-between h-12 px-4 border-b border-border bg-card">
      <div className="flex items-center gap-3">
        <span className="font-bold text-sm">☁️ CloudCut</span>
        {project && (
          <span className="text-muted-foreground text-sm">{project.name}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleExport}
          disabled={exporting || !project}
        >
          {exporting ? 'Exporting...' : 'Export'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userId');
            window.location.reload();
          }}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}
