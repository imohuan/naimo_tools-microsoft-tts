/// <reference path="../typings/naimo.d.ts" />

/**
 * TTS 配置接口
 */
export interface TTSConfig {
  voice: string;
  lang: string;
  outputFormat: string;
  pitch: number;
  rate: number;
  volume: number;
  timeout: number;
  maxChars: number;
  preloadCount: number;
}

/**
 * TTS API 配置接口（用于调用 API）
 */
export interface TTSApiConfig {
  voice: string;
  lang: string;
  outputFormat: string;
  pitch: string;
  rate: string;
  volume: string;
  timeout: number;
}

/**
 * 语音选项
 */
export interface VoiceOption {
  value: string;
  label: string;
}

/**
 * 播放状态
 */
export type PlayState = 'stopped' | 'playing' | 'paused';

/**
 * 通知类型
 */
export type NotificationType = 'success' | 'error' | 'info';

/**
 * 语言代码
 */
export type LanguageCode = 'zh-CN' | 'zh-TW' | 'en-US' | 'en-GB' | 'ja-JP' | 'ko-KR' | 'fr-FR' | 'de-DE' | 'es-ES';

/**
 * 语音选项映射
 */
export type VoiceOptionsMap = Record<LanguageCode, VoiceOption[]>;

