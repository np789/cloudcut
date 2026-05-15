import { useEffect, useRef } from 'react';
import Pusher, { Channel } from 'pusher-js';
import { useProjectStore } from '@/state/projectStore';

let pusherInstance: Pusher | null = null;

function getPusher(): Pusher {
  if (!pusherInstance) {
    pusherInstance = new Pusher(import.meta.env.VITE_PUSHER_KEY || '', {
      cluster: import.meta.env.VITE_PUSHER_CLUSTER || 'us2',
      authEndpoint: 'http://localhost:3000/pusher/auth',
      auth: {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      },
    });
  }
  return pusherInstance;
}

export function usePusher(projectId: string | null) {
  const channelRef = useRef<Channel | null>(null);
  const applyRemoteOperation = useProjectStore((s) => s.applyRemoteOperation);

  useEffect(() => {
    if (!projectId) return;

    const pusher = getPusher();
    const channel = pusher.subscribe(`private-project-${projectId}`);
    channelRef.current = channel;

    // Listen for operations from other users
    channel.bind('operation', (data: { type: string; payload: Record<string, unknown>; userId: string }) => {
      const myId = localStorage.getItem('userId');
      if (data.userId === myId) return; // Ignore our own broadcasts
      applyRemoteOperation(data);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`private-project-${projectId}`);
    };
  }, [projectId, applyRemoteOperation]);

  return channelRef;
}
