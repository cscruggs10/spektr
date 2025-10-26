/**
 * Video Sync Service - Background sync for locally stored videos
 *
 * Automatically retries uploading videos when connectivity improves
 */

import { videoStorage, type PendingVideo } from './video-storage';
import { apiRequest } from './queryClient';

class VideoSyncService {
  private isRunning = false;
  private syncInterval: number | null = null;
  private listeners: Array<(status: SyncStatus) => void> = [];

  // Check connectivity every 2 minutes
  private readonly SYNC_INTERVAL_MS = 2 * 60 * 1000;

  // Max retries before giving up
  private readonly MAX_RETRIES = 10;

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Video sync service already running');
      return;
    }

    console.log('Starting video sync service...');
    this.isRunning = true;

    // Initial sync attempt
    await this.syncPendingVideos();

    // Set up periodic sync
    this.syncInterval = window.setInterval(() => {
      this.syncPendingVideos();
    }, this.SYNC_INTERVAL_MS);

    // Also sync when the page becomes visible (user returns to app)
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // Sync when online event fires
    window.addEventListener('online', this.handleOnline);
  }

  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('online', this.handleOnline);

    this.isRunning = false;
    console.log('Video sync service stopped');
  }

  private handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      console.log('App visible - checking for pending videos to sync');
      this.syncPendingVideos();
    }
  };

  private handleOnline = () => {
    console.log('Network online - syncing pending videos');
    this.syncPendingVideos();
  };

  async syncPendingVideos(): Promise<SyncResult> {
    const result: SyncResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      total: 0,
    };

    try {
      const pendingVideos = await videoStorage.getAllPendingVideos();
      result.total = pendingVideos.length;

      if (pendingVideos.length === 0) {
        this.notifyListeners({
          type: 'idle',
          pendingCount: 0
        });
        return result;
      }

      console.log(`Found ${pendingVideos.length} pending videos to sync`);
      this.notifyListeners({
        type: 'syncing',
        pendingCount: pendingVideos.length
      });

      // Check if we're online first
      if (!navigator.onLine) {
        console.log('Offline - skipping sync');
        result.skipped = pendingVideos.length;
        this.notifyListeners({
          type: 'offline',
          pendingCount: pendingVideos.length
        });
        return result;
      }

      // Process each video
      for (const video of pendingVideos) {
        // Skip if max retries reached
        if (video.retryCount >= this.MAX_RETRIES) {
          console.log(`Skipping video ${video.id} - max retries reached`);
          result.skipped++;
          continue;
        }

        try {
          await this.uploadVideo(video);
          await videoStorage.deleteVideo(video.id);
          result.success++;
          console.log(`Successfully synced video ${video.id}`);
        } catch (error) {
          console.error(`Failed to sync video ${video.id}:`, error);
          await videoStorage.updateRetryCount(
            video.id,
            error instanceof Error ? error.message : 'Unknown error'
          );
          result.failed++;
        }
      }

      // Get updated count
      const remainingCount = await videoStorage.getPendingCount();

      if (result.success > 0) {
        this.notifyListeners({
          type: 'success',
          syncedCount: result.success,
          pendingCount: remainingCount
        });
      } else if (result.failed > 0) {
        this.notifyListeners({
          type: 'error',
          pendingCount: remainingCount
        });
      }

      console.log('Sync complete:', result);
    } catch (error) {
      console.error('Error during video sync:', error);
      this.notifyListeners({
        type: 'error',
        pendingCount: await videoStorage.getPendingCount()
      });
    }

    return result;
  }

  private async uploadVideo(video: PendingVideo): Promise<void> {
    const formData = new FormData();
    formData.append('files', video.file);

    const response = await apiRequest('POST', video.endpoint, formData, {
      timeout: 90000, // 90 seconds
      retries: 0, // Don't retry here - we'll retry the whole video later
      retryDelay: 0,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }
  }

  async getPendingCount(): Promise<number> {
    return videoStorage.getPendingCount();
  }

  async getPendingCountByInspection(inspectionId: number): Promise<number> {
    return videoStorage.getPendingCountByInspection(inspectionId);
  }

  onStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(status: SyncStatus): void {
    this.listeners.forEach(listener => listener(status));
  }

  // Manual sync trigger
  async syncNow(): Promise<SyncResult> {
    console.log('Manual sync triggered');
    return this.syncPendingVideos();
  }
}

export interface SyncResult {
  success: number;
  failed: number;
  skipped: number;
  total: number;
}

export type SyncStatus =
  | { type: 'idle'; pendingCount: number }
  | { type: 'syncing'; pendingCount: number }
  | { type: 'success'; syncedCount: number; pendingCount: number }
  | { type: 'error'; pendingCount: number }
  | { type: 'offline'; pendingCount: number };

// Export singleton instance
export const videoSyncService = new VideoSyncService();
