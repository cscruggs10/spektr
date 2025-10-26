import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { videoSyncService, type SyncStatus } from '@/lib/video-sync-service';
import { toast } from '@/hooks/use-toast';

export function VideoSyncStatus() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ type: 'idle', pendingCount: 0 });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Initialize with current pending count
    videoSyncService.getPendingCount().then(count => {
      setSyncStatus({ type: 'idle', pendingCount: count });
    });

    // Subscribe to sync status changes
    const unsubscribe = videoSyncService.onStatusChange((status) => {
      setSyncStatus(status);
      if (status.type === 'syncing') {
        setIsSyncing(true);
      } else {
        setIsSyncing(false);
      }
    });

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline) {
      toast({
        title: 'Offline',
        description: 'Cannot sync videos while offline',
        variant: 'destructive',
      });
      return;
    }

    setIsSyncing(true);
    try {
      const result = await videoSyncService.syncNow();

      if (result.success > 0) {
        toast({
          title: 'Sync Complete',
          description: `Successfully synced ${result.success} video(s)`,
        });
      } else if (result.failed > 0) {
        toast({
          title: 'Sync Failed',
          description: `Failed to sync ${result.failed} video(s). Will retry automatically.`,
          variant: 'destructive',
        });
      } else if (result.total === 0) {
        toast({
          title: 'No Videos to Sync',
          description: 'All videos are already uploaded',
        });
      }
    } catch (error) {
      toast({
        title: 'Sync Error',
        description: 'Failed to sync videos. Will retry automatically.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Don't show if no pending videos
  if (syncStatus.pendingCount === 0) {
    return null;
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <Cloud className="h-5 w-5 text-yellow-600" />
            ) : (
              <CloudOff className="h-5 w-5 text-gray-400" />
            )}

            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {syncStatus.pendingCount} video(s) pending sync
                </span>
                {syncStatus.type === 'syncing' && (
                  <Badge variant="secondary" className="text-xs">
                    Syncing...
                  </Badge>
                )}
                {!isOnline && (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <WifiOff className="h-3 w-3" />
                    Offline
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {syncStatus.type === 'syncing'
                  ? 'Uploading videos in background...'
                  : !isOnline
                  ? 'Will sync automatically when connection improves'
                  : 'Videos will sync automatically or click to sync now'}
              </p>
            </div>
          </div>

          <Button
            onClick={handleManualSync}
            disabled={isSyncing || !isOnline}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync Now
          </Button>
        </div>

        {syncStatus.type === 'success' && syncStatus.syncedCount > 0 && (
          <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
            <CheckCircle className="h-4 w-4" />
            Successfully synced {syncStatus.syncedCount} video(s)
          </div>
        )}

        {syncStatus.type === 'error' && (
          <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
            <AlertCircle className="h-4 w-4" />
            Some videos failed to sync - will retry automatically
          </div>
        )}
      </CardContent>
    </Card>
  );
}
