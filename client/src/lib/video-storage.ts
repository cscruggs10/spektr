/**
 * Video Storage Service - IndexedDB for offline video storage
 *
 * Stores videos locally when uploads fail due to poor connectivity
 * and syncs them later when connection improves
 */

const DB_NAME = 'spektr-video-storage';
const DB_VERSION = 1;
const STORE_NAME = 'pending-videos';

export interface PendingVideo {
  id: string;
  inspectionId: number;
  file: File;
  endpoint: string;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

class VideoStorageService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('inspectionId', 'inspectionId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async saveVideo(video: Omit<PendingVideo, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    await this.ensureDB();

    const id = `${video.inspectionId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const pendingVideo: PendingVideo = {
      ...video,
      id,
      timestamp: Date.now(),
      retryCount: 0,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(pendingVideo);

      request.onsuccess = () => {
        console.log(`Video stored locally: ${id} for inspection ${video.inspectionId}`);
        resolve(id);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllPendingVideos(): Promise<PendingVideo[]> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getVideosByInspection(inspectionId: number): Promise<PendingVideo[]> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('inspectionId');
      const request = index.getAll(inspectionId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteVideo(id: string): Promise<void> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log(`Video deleted from local storage: ${id}`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateRetryCount(id: string, error?: string): Promise<void> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const video = getRequest.result as PendingVideo;
        if (video) {
          video.retryCount += 1;
          if (error) {
            video.lastError = error;
          }
          const updateRequest = store.put(video);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getPendingCount(): Promise<number> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingCountByInspection(inspectionId: number): Promise<number> {
    const videos = await this.getVideosByInspection(inspectionId);
    return videos.length;
  }

  private async ensureDB(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
  }
}

// Export singleton instance
export const videoStorage = new VideoStorageService();
