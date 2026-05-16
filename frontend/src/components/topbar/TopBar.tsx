import { Project } from '@/types';
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
      alert(`Export started! Job ID: ${job.id}`);
    } catch {
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '48px',
      padding: '0 16px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--card)',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontWeight: 700, fontSize: '14px' }}>☁️ CloudCut</span>
        {project && (
          <span style={{ color: 'var(--muted-foreground)', fontSize: '13px' }}>
            {project.name}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleExport}
          disabled={exporting || !project}
          style={{
            padding: '6px 14px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            cursor: 'pointer',
            opacity: exporting ? 0.7 : 1,
          }}
        >
          {exporting ? 'Exporting...' : 'Export'}
        </button>
        <button
          onClick={() => {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userId');
            window.location.reload();
          }}
          style={{
            padding: '6px 14px',
            background: 'transparent',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}