import { Injectable } from '@angular/core';
import { MediaExtractorService } from './media-extractor.service';
import { CampaignData } from '../interfaces/campaign';

export interface CachedMedia {
  url: string;
  blob: Blob;
  timestamp: number;
  metadata: {
    type: string;
    size: number;
  };
}

interface StoredData {
  url: string;
  blob: Blob;
  timestamp: number;
  metadata: {
    type: string;
    size: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class MediaCacheService {
  private dbName = 'MediaCacheDB';
  private storeName = 'media';
  private dbPromise: Promise<IDBDatabase | null>;
  private isStorageAvailable = true;

  constructor(private mediaExtractor: MediaExtractorService) {
    this.dbPromise = this.initDB();
  }

  private getMimeTypeFromExtension(extension: string): string | null {
    const mimeTypes: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'ico': 'image/x-icon'
    };
    return mimeTypes[extension] || null;
  }

  private async checkStorageAccess(): Promise<boolean> {
    try {
      const testDb = indexedDB.open('test');
      await new Promise((resolve, reject) => {
        testDb.onerror = () => {
          console.warn('[MediaCacheService] Storage access denied');
          reject(false);
        };
        testDb.onsuccess = () => {
          testDb.result.close();
          indexedDB.deleteDatabase('test');
          resolve(true);
        };
      });
      return true;
    } catch (error) {
      console.warn('[MediaCacheService] Storage access error:', error);
      return false;
    }
  }

  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const searchParams = new URLSearchParams(urlObj.search);
      const importantParams = ['w', 'h', 'width', 'height', 'size', 'quality'];
      const filteredParams = new URLSearchParams();
      
      importantParams.forEach(param => {
        if (searchParams.has(param)) {
          filteredParams.append(param, searchParams.get(param)!);
        }
      });
      
      urlObj.search = filteredParams.toString();
      urlObj.hash = '';
      return urlObj.toString();
    } catch (error) {
      return url;
    }
  }

  async preCacheMedia(campaignData: CampaignData): Promise<void> {
    const urls = this.mediaExtractor.extractMediaUrls(campaignData);
    const uniqueUrls = [...new Set(urls.map(url => this.normalizeUrl(url)))];

    for (const url of uniqueUrls) {
      try {
        if (await this.mediaExists(url)) continue;

        const blob = await this.mediaExtractor.fetchMedia(url);
        
        if (!blob) {
          continue;
        }

        await this.storeMedia(url, blob);
      } catch (error) {
        console.warn('[MediaCacheService] Failed to cache:', url, error);
        continue;
      }
    }
  }

  private initDB(): Promise<IDBDatabase | null> {
    return new Promise(async (resolve, reject) => {
      if (!('indexedDB' in window)) {
        console.warn('[MediaCacheService] IndexedDB not supported');
        this.isStorageAvailable = false;
        return resolve(null);
      }

      this.isStorageAvailable = await this.checkStorageAccess();
      if (!this.isStorageAvailable) {
        console.warn('[MediaCacheService] Storage access not available');
        return resolve(null);
      }
      
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => {
        console.error('[MediaCacheService] Failed to open IndexedDB:', request.error);
        reject(`Failed to open IndexedDB: ${request.error}`);
      };

      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'url' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  public async storeMedia(url: string, blob: Blob): Promise<void> {
    if (!this.isStorageAvailable || !blob) return;

    const normalizedUrl = this.normalizeUrl(url);
    
    if (blob.size === 0) {
      console.warn('[MediaCacheService] Attempted to store empty blob:', url);
      return;
    }

    const db = await this.dbPromise;
    if (!db) {
      console.warn('[MediaCacheService] Database not available');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);

        const data: StoredData = {
          url: normalizedUrl,
          blob: blob,
          timestamp: Date.now(),
          metadata: {
            type: blob.type || 'image/png',
            size: blob.size
          }
        };

        const request = store.put(data);
        
        request.onsuccess = () => {
          resolve();
        };
        
        request.onerror = (event) => {
          console.error('[MediaCacheService] Error storing media:', event);
          reject(request.error);
        };
      } catch (error) {
        console.error('[MediaCacheService] Exception storing media:', error);
        reject(error);
      }
    });
  }

  public async retrieveMedia(url: string): Promise<Blob | null> {
    if (!this.isStorageAvailable) return null;

    const normalizedUrl = this.normalizeUrl(url);
    const db = await this.dbPromise;
    if (!db) return null;

    try {
      const data = await this.getFromStore(normalizedUrl);
      if (!data?.blob) return null;

      return new Blob([await data.blob.arrayBuffer()], { type: data.metadata.type });
    } catch (error) {
      console.warn('[MediaCacheService] Error retrieving media:', error);
      return null;
    }
  }

  public async mediaExists(url: string): Promise<boolean> {
    if (!this.isStorageAvailable) {
      return false;
    }

    try {
      const cachedMedia = await this.retrieveMedia(url);
      return cachedMedia !== null;
    } catch (error) {
      console.error('[MediaCacheService] Error checking media existence:', error);
      return false;
    }
  }

  private async getFromStore(url: string): Promise<StoredData | null> {
    const db = await this.dbPromise;
    if (!db) return null;

    return new Promise((resolve) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(url);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }
}
