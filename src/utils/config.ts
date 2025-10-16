import type { TTSConfig, TTSApiConfig } from '../typings';

/**
 * 將配置轉換為 API 配置格式
 */
export function convertToApiConfig(config: TTSConfig): TTSApiConfig {
  return {
    voice: config.voice,
    lang: config.lang,
    outputFormat: config.outputFormat,
    pitch: `${config.pitch}%`,
    rate: `${config.rate}%`,
    volume: `${config.volume}%`,
    timeout: config.timeout * 1000,
  };
}

