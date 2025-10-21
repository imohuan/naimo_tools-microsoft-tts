/**
 * 音頻預加載器 - 管理音頻分段加載和預加載
 */

import type { TextSegment } from './TextSplitter';
import type { TTSApiConfig } from '../typings';

export interface PreloadStatus {
  totalSegments: number;
  loadedCount: number;
  preloadedCount: number;
  currentIndex: number;
}

export type PreloadStatusCallback = (status: PreloadStatus) => void;
export type LoadingCallback = (isLoading: boolean, segmentIndex: number) => void;

export class AudioPreloader {
  private segments: TextSegment[];
  private config: TTSApiConfig;
  private preloadCount: number; // 預加載段數
  private currentIndex: number;
  private isPlaying: boolean;
  private audioElement: HTMLAudioElement;

  private onStatusUpdate?: PreloadStatusCallback;
  private onLoadingChange?: LoadingCallback;

  // 緩存管理
  private loadingQueue: Set<number> = new Set();
  private maxConcurrentLoads: number = 2;

  constructor(
    segments: TextSegment[],
    config: TTSApiConfig,
    audioElement: HTMLAudioElement,
    preloadCount: number = 3
  ) {
    this.segments = segments;
    this.config = config;
    this.audioElement = audioElement;
    this.preloadCount = preloadCount;
    this.currentIndex = 0;
    this.isPlaying = false;

    this.setupAudioListeners();
  }

  /**
   * 設置狀態更新回調
   */
  setStatusCallback(callback: PreloadStatusCallback): void {
    this.onStatusUpdate = callback;
  }

  /**
   * 設置加載狀態回調
   */
  setLoadingCallback(callback: LoadingCallback): void {
    this.onLoadingChange = callback;
  }

  /**
   * 設置音頻播放器事件監聽
   */
  private setupAudioListeners(): void {
    this.audioElement.addEventListener('ended', () => {
      this.playNext();
    });
  }

  /**
   * 開始播放（從指定索引）
   */
  async start(startIndex: number = 0): Promise<void> {
    this.currentIndex = startIndex;
    this.isPlaying = true;

    // 加載並播放當前段落
    await this.loadAndPlay(this.currentIndex);

    // 預加載後續段落
    this.preloadNext();
  }

  /**
   * 暫停播放
   */
  pause(): void {
    this.isPlaying = false;
    this.audioElement.pause();
  }

  /**
   * 繼續播放
   */
  resume(): void {
    this.isPlaying = true;
    this.audioElement.play();
  }

  /**
   * 停止播放
   */
  stop(): void {
    this.isPlaying = false;
    this.audioElement.pause();
    this.audioElement.src = '';
    this.currentIndex = 0;
  }

  /**
   * 跳轉到指定段落播放
   */
  async jumpTo(index: number): Promise<void> {
    if (index < 0 || index >= this.segments.length) {
      throw new Error('段落索引超出範圍');
    }

    this.currentIndex = index;
    await this.loadAndPlay(index);

    // 預加載後續段落
    this.preloadNext();
  }

  /**
   * 播放下一段
   */
  private async playNext(): Promise<void> {
    if (!this.isPlaying) return;

    this.currentIndex++;

    if (this.currentIndex >= this.segments.length) {
      // 播放完成
      this.isPlaying = false;
      this.notifyStatusUpdate();
      return;
    }

    await this.loadAndPlay(this.currentIndex);

    // 預加載後續段落
    this.preloadNext();
  }

  /**
   * 加載並播放指定段落
   */
  private async loadAndPlay(index: number): Promise<void> {
    const segment = this.segments[index];

    if (!segment) {
      throw new Error(`段落 ${index} 不存在`);
    }

    try {
      // 如果未加載，先加載
      if (!segment.isLoaded || !segment.audioPath) {
        this.notifyLoadingChange(true, index);
        await this.loadSegment(index);
        this.notifyLoadingChange(false, index);
      }

      // 設置音頻源並播放
      if (segment.audioPath) {
        const audioData = await window.ttsPluginAPI.getAudioData(segment.audioPath);
        this.audioElement.src = audioData;
        await this.audioElement.play();
      }

      this.notifyStatusUpdate();
    } catch (error) {
      console.error(`加載段落 ${index} 失敗:`, error);
      this.notifyLoadingChange(false, index);
      throw error;
    }
  }

  /**
   * 加載指定段落的音頻
   */
  private async loadSegment(index: number): Promise<void> {
    const segment = this.segments[index];

    // 如果段落不存在，直接返回
    if (!segment) {
      return;
    }

    // 如果已经加载且有音频路径，直接返回
    if (segment.isLoaded && segment.audioPath) {
      return;
    }

    // 防止重複加載
    if (this.loadingQueue.has(index)) {
      // 等待加載完成
      await this.waitForSegmentLoad(index);
      return;
    }

    this.loadingQueue.add(index);

    try {
      // 再次检查是否已加载（可能在等待期间被其他调用加载了）
      if (segment.isLoaded && segment.audioPath) {
        return;
      }

      // 調用 TTS API 生成音頻
      const audioPath = await window.ttsPluginAPI.generateSpeech(
        segment.content,
        this.config
      );

      segment.audioPath = audioPath;
      segment.isLoaded = true;

      this.notifyStatusUpdate();
    } catch (error) {
      console.error(`生成段落 ${index} 音頻失敗:`, error);
      throw error;
    } finally {
      this.loadingQueue.delete(index);
    }
  }

  /**
   * 等待段落加載完成
   */
  private async waitForSegmentLoad(index: number): Promise<void> {
    const maxWaitTime = 30000; // 最多等待30秒
    const checkInterval = 100;
    let elapsed = 0;

    return new Promise((resolve, reject) => {
      const timer = setInterval(() => {
        const segment = this.segments[index];

        if (segment?.isLoaded) {
          clearInterval(timer);
          resolve();
        } else if (elapsed >= maxWaitTime) {
          clearInterval(timer);
          reject(new Error(`等待段落 ${index} 加載超時`));
        }

        elapsed += checkInterval;
      }, checkInterval);
    });
  }

  /**
   * 預加載後續段落
   */
  private async preloadNext(): Promise<void> {
    const startIndex = this.currentIndex + 1;
    const endIndex = Math.min(startIndex + this.preloadCount, this.segments.length);

    const loadPromises: Promise<void>[] = [];

    for (let i = startIndex; i < endIndex; i++) {
      const segment = this.segments[i];

      if (!segment.isLoaded && !this.loadingQueue.has(i)) {
        // 限制並發加載數
        if (this.loadingQueue.size < this.maxConcurrentLoads) {
          loadPromises.push(
            this.loadSegment(i).catch(error => {
              console.warn(`預加載段落 ${i} 失敗:`, error);
            })
          );
        }
      }
    }

    // 不等待預加載完成
    if (loadPromises.length > 0) {
      Promise.all(loadPromises).then(() => {
        this.notifyStatusUpdate();
      });
    }
  }

  /**
   * 通知狀態更新
   */
  private notifyStatusUpdate(): void {
    if (!this.onStatusUpdate) return;

    const status: PreloadStatus = {
      totalSegments: this.segments.length,
      loadedCount: this.segments.filter(s => s.isLoaded).length,
      preloadedCount: this.getPreloadedCount(),
      currentIndex: this.currentIndex
    };

    this.onStatusUpdate(status);
  }

  /**
   * 通知加載狀態變化
   */
  private notifyLoadingChange(isLoading: boolean, segmentIndex: number): void {
    if (!this.onLoadingChange) return;
    this.onLoadingChange(isLoading, segmentIndex);
  }

  /**
   * 獲取已預加載的段落數
   */
  private getPreloadedCount(): number {
    const startIndex = this.currentIndex + 1;
    const endIndex = Math.min(startIndex + this.preloadCount, this.segments.length);

    let count = 0;
    for (let i = startIndex; i < endIndex; i++) {
      if (this.segments[i]?.isLoaded) {
        count++;
      }
    }

    return count;
  }

  /**
   * 獲取當前狀態
   */
  getStatus(): PreloadStatus {
    return {
      totalSegments: this.segments.length,
      loadedCount: this.segments.filter(s => s.isLoaded).length,
      preloadedCount: this.getPreloadedCount(),
      currentIndex: this.currentIndex
    };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<TTSApiConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 獲取段落列表
   */
  getSegments(): TextSegment[] {
    return this.segments;
  }

  /**
   * 獲取當前播放索引
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * 是否正在播放
   */
  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }
}



