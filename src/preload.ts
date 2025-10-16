/// <reference path="../typings/naimo.d.ts" />

import { contextBridge } from 'electron';
import { EdgeTTS } from 'node-edge-tts';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ==================== 类型定义 ====================

interface TTSConfig {
  voice: string;
  lang: string;
  outputFormat: string;
  pitch?: string;
  rate?: string;
  volume?: string;
  timeout?: number;
}

interface TTSProgress {
  type: 'progress' | 'complete' | 'error';
  message: string;
  data?: any;
}

// ==================== TTS 功能 ====================

/**
 * 生成音频文件
 */
async function generateSpeech(
  text: string,
  config: TTSConfig,
  onProgress?: (progress: TTSProgress) => void
): Promise<string> {
  try {
    if (!text || !text.trim()) {
      throw new Error('文本不能为空');
    }

    onProgress?.({ type: 'progress', message: '正在初始化 TTS...' });

    const tts = new EdgeTTS({
      voice: config.voice,
      lang: config.lang,
      outputFormat: config.outputFormat,
      pitch: config.pitch || '0%',
      rate: config.rate || '0%',
      volume: config.volume || '0%',
      timeout: config.timeout || 10000
    });

    onProgress?.({ type: 'progress', message: '正在生成语音...' });

    // 生成临时文件路径
    const tempDir = os.tmpdir();
    const timestamp = Date.now();
    const filename = `tts_${timestamp}.mp3`;
    const outputPath = path.join(tempDir, filename);

    // 生成音频
    await tts.ttsPromise(text, outputPath);

    onProgress?.({ type: 'complete', message: '语音生成成功！', data: { path: outputPath } });

    return outputPath;
  } catch (error: any) {
    const errorMessage = error.message || '语音生成失败';
    onProgress?.({ type: 'error', message: errorMessage });
    throw error;
  }
}

/**
 * 保存音频文件
 */
async function saveAudioFile(sourcePath: string, targetPath: string): Promise<void> {
  try {
    // 读取临时文件
    const data = fs.readFileSync(sourcePath);
    // 写入目标路径
    fs.writeFileSync(targetPath, data);
    // 删除临时文件
    fs.unlinkSync(sourcePath);
  } catch (error: any) {
    throw new Error(`保存文件失败: ${error.message}`);
  }
}

/**
 * 获取音频数据（Base64）
 */
async function getAudioData(filePath: string): Promise<string> {
  try {
    const data = fs.readFileSync(filePath);
    return `data:audio/mpeg;base64,${data.toString('base64')}`;
  } catch (error: any) {
    throw new Error(`读取音频失败: ${error.message}`);
  }
}

// ==================== 暴露插件 API ====================

const ttsPluginAPI = {
  generateSpeech: async (text: string, config: TTSConfig, onProgress?: (progress: TTSProgress) => void) => {
    console.log('ttsPluginAPI.generateSpeech 被调用', { text, config });
    return await generateSpeech(text, config, onProgress);
  },
  saveAudioFile: async (sourcePath: string, targetPath: string) => {
    console.log('ttsPluginAPI.saveAudioFile 被调用', { sourcePath, targetPath });
    return await saveAudioFile(sourcePath, targetPath);
  },
  getAudioData: async (filePath: string) => {
    console.log('ttsPluginAPI.getAudioData 被调用', { filePath });
    return await getAudioData(filePath);
  }
};

try {
  contextBridge.exposeInMainWorld('ttsPluginAPI', ttsPluginAPI);
  console.log('✅ ttsPluginAPI 已成功暴露到主世界');
} catch (error) {
  console.error('❌ 暴露 ttsPluginAPI 失败:', error);
}

// ==================== 功能处理器导出 ====================

const handlers = {
  tts: {
    onEnter: async (params: any) => {
      console.log('TTS 功能被触发', params);
      if (typeof window !== 'undefined' && (window as any).naimo) {
        naimo.log.info('TTS 插件已加载', { params });
      }
    }
  }
};

// 使用 CommonJS 导出（Electron 环境）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = handlers;
}

// ==================== 初始化 ====================

console.log('🚀 TTS Preload 脚本开始执行');

window.addEventListener('DOMContentLoaded', () => {
  console.log('✅ TTS Preload 脚本 DOMContentLoaded 事件触发');
  console.log('检查 window.ttsPluginAPI:', window.ttsPluginAPI);
});

// ==================== 类型扩展 ====================

declare global {
  interface Window {
    ttsPluginAPI: {
      generateSpeech: typeof generateSpeech;
      saveAudioFile: typeof saveAudioFile;
      getAudioData: typeof getAudioData;
    };
  }
}
