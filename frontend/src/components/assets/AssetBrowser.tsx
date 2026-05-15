import { useEffect, useState } from 'react';
import { Asset } from '@/types';
import { assetsApi } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface Props { projectId: string; }

const statusColor: Record<string, string> = {
  READY: 'bg-green-500/20 text-green-400',
  PROCESSING: 'bg-blue-500/20 text-blue-400',
  UPLOADING: 'bg-yellow-500/20 text-yellow-400',
  FAILED: 'bg-red-500/20 text-red-400',
};

export default function AssetBrowser({ projectId }: Props) {
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    assetsApi.list(projectId).then(setAssets).catch(() => {});
  }, [projectId]);

  const filter = (type: string) =>
    type === 'all' ? assets : assets.filter((a) => a.type === type.toUpperCase());

  return (
    <div className="h-full flex flex-col border-r border-border">
      <div className="px-3 py-2 border-b border-border">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assets</h2>
      </div>
      <Tabs defaultValue="all" className="flex-1 flex flex-col">
        <TabsList className="mx-2 mt-2 h-7">
          <TabsTrigger value="all" className="text-xs py-0.5 px-2">All</TabsTrigger>
          <TabsTrigger value="video" className="text-xs py-0.5 px-2">Video</TabsTrigger>
          <TabsTrigger value="audio" className="text-xs py-0.5 px-2">Audio</TabsTrigger>
        </TabsList>
        {['all', 'video', 'audio'].map((tab) => (
          <TabsContent key={tab} value={tab} className="flex-1 m-0">
            <ScrollArea className="h-full">
              <div className="p-2 flex flex-col gap-1">
                {filter(tab).map((asset) => (
                  <div
                    key={asset.id}
                    className="p-2 rounded bg-secondary hover:bg-secondary/80 cursor-pointer text-xs"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('assetId', asset.id)}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate font-medium">{asset.type}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] ${statusColor[asset.status]}`}>
                        {asset.status}
                      </span>
                    </div>
                    {asset.metadata?.durationMs && (
                      <div className="text-muted-foreground mt-0.5">
                        {(asset.metadata.durationMs / 1000).toFixed(1)}s
                      </div>
                    )}
                  </div>
                ))}
                {filter(tab).length === 0 && (
                  <p className="text-xs text-muted-foreground p-2">No {tab} assets</p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
