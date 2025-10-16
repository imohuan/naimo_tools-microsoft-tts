/// <reference path="../typings/naimo.d.ts" />

import './style.css';

// ==================== 热重载 ====================
if (import.meta.hot) {
  import.meta.hot.on('preload-changed', async (data) => {
    console.log('📝 检测到 preload 变化:', data);
    console.log('🔨 正在触发 preload 构建...');
    try {
      const response = await fetch('/__preload_build');
      const result = await response.json();
      if (result.success) {
        console.log('✅ Preload 构建完成');
        await window.naimo.hot()
        console.log('🔄 Preload 热重载完成');
        location.reload()
      } else {
        console.error('❌ Preload 构建失败');
      }
    } catch (error) {
      console.error('❌ 触发 preload 构建失败:', error);
    }
  })
}

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

// ==================== 全局变量 ====================

let currentAudioPath: string | null = null;
let isPlaying = false;

// ==================== DOM 元素 ====================

const textInput = document.getElementById('textInput') as HTMLTextAreaElement;
const textDisplay = document.getElementById('textDisplay') as HTMLDivElement;
const textSegments = document.getElementById('textSegments') as HTMLDivElement;
const generateBtn = document.getElementById('generateBtn') as HTMLButtonElement;
const playBtn = document.getElementById('playBtn') as HTMLButtonElement;
const pauseBtn = document.getElementById('pauseBtn') as HTMLButtonElement;
const downloadBtn = document.getElementById('downloadBtn') as HTMLButtonElement;
const statusMsg = document.getElementById('statusMsg') as HTMLDivElement;
const audioPlayer = document.getElementById('audioPlayer') as HTMLAudioElement;

// 配置元素
const langSelect = document.getElementById('langSelect') as HTMLSelectElement;
const voiceSelect = document.getElementById('voiceSelect') as HTMLSelectElement;
const formatSelect = document.getElementById('formatSelect') as HTMLSelectElement;
const rateSlider = document.getElementById('rateSlider') as HTMLInputElement;
const rateValue = document.getElementById('rateValue') as HTMLSpanElement;
const pitchSlider = document.getElementById('pitchSlider') as HTMLInputElement;
const pitchValue = document.getElementById('pitchValue') as HTMLSpanElement;
const volumeSlider = document.getElementById('volumeSlider') as HTMLInputElement;
const volumeValue = document.getElementById('volumeValue') as HTMLSpanElement;
const timeoutInput = document.getElementById('timeoutInput') as HTMLInputElement;

// ==================== 工具函数 ====================

/**
 * 页面内通知系统
 */
function showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
  // 创建通知容器（如果不存在）
  let container = document.getElementById('notificationContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notificationContainer';
    container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
    document.body.appendChild(container);
  }

  // 创建通知元素
  const notification = document.createElement('div');
  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  notification.className = `${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-[280px] max-w-[400px] animate-slide-in`;

  // 图标
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';

  notification.innerHTML = `
    <span class="text-lg font-bold">${icon}</span>
    <span class="flex-1 text-sm">${message}</span>
  `;

  container.appendChild(notification);

  // 3秒后自动移除
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    notification.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      container?.removeChild(notification);
      // 如果容器为空，移除容器
      if (container && container.children.length === 0) {
        document.body.removeChild(container);
      }
    }, 300);
  }, 3000);
}

/**
 * 更新状态消息
 */
function updateStatus(message: string, type: 'info' | 'success' | 'error' = 'info') {
  statusMsg.textContent = message;
  statusMsg.className = `ml-auto text-xs ${type === 'success' ? 'text-green-600' :
    type === 'error' ? 'text-red-600' :
      'text-gray-500'
    }`;
}

/**
 * 获取当前配置
 */
function getCurrentConfig(): TTSConfig {
  return {
    voice: voiceSelect.value,
    lang: langSelect.value,
    outputFormat: formatSelect.value,
    pitch: `${pitchSlider.value}%`,
    rate: `${rateSlider.value}%`,
    volume: `${volumeSlider.value}%`,
    timeout: parseInt(timeoutInput.value) * 1000
  };
}

/**
 * 分割文本为段落
 */
function splitTextIntoSegments(text: string): string[] {
  // 按句号、问号、感叹号、换行等分割
  const segments = text
    .split(/([。！？\n]+)/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  // 合并标点符号与前面的文本
  const result: string[] = [];
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (/^[。！？\n]+$/.test(segment) && result.length > 0) {
      result[result.length - 1] += segment;
    } else {
      result.push(segment);
    }
  }

  return result.filter(s => s.length > 0);
}

/**
 * 渲染文本段落
 */
function renderTextSegments(segments: string[]) {
  textSegments.innerHTML = segments
    .map((segment, index) => `
      <div class="segment p-2 text-sm rounded bg-white border border-gray-200 transition-colors" data-index="${index}">
        ${segment}
      </div>
    `)
    .join('');
}

/**
 * 高亮指定段落
 */
function highlightSegment(index: number) {
  const segments = textSegments.querySelectorAll('.segment');
  segments.forEach((seg, i) => {
    if (i === index) {
      seg.classList.add('bg-yellow-100', 'border-yellow-400');
      seg.classList.remove('bg-white', 'border-gray-200');
    } else {
      seg.classList.remove('bg-yellow-100', 'border-yellow-400');
      seg.classList.add('bg-white', 'border-gray-200');
    }
  });
}

/**
 * 清除所有高亮
 */
function clearHighlight() {
  const segments = textSegments.querySelectorAll('.segment');
  segments.forEach(seg => {
    seg.classList.remove('bg-yellow-100', 'border-yellow-400');
    seg.classList.add('bg-white', 'border-gray-200');
  });
}

// ==================== 主要功能 ====================

/**
 * 生成语音
 */
async function generateSpeech() {
  const text = textInput.value.trim();

  if (!text) {
    showNotification('请输入要转换的文本', 'error');
    return;
  }

  // 检查 API 是否可用
  if (!window.ttsPluginAPI) {
    console.error('ttsPluginAPI 未定义');
    showNotification('TTS API 未初始化，请刷新页面', 'error');
    return;
  }

  try {
    // 禁用按钮
    generateBtn.disabled = true;
    updateStatus('正在生成语音...', 'info');

    // 获取配置
    const config = getCurrentConfig();

    // 调用 TTS API
    const audioPath = await window.ttsPluginAPI.generateSpeech(text, config);

    currentAudioPath = audioPath;

    // 获取音频数据并设置播放器
    const audioData = await window.ttsPluginAPI.getAudioData(audioPath);
    audioPlayer.src = audioData;

    // 启用播放和下载按钮
    playBtn.disabled = false;
    downloadBtn.disabled = false;

    updateStatus('语音生成成功！', 'success');
    showNotification('语音生成成功！', 'success');
    naimo.log.info('语音生成成功', { audioPath });

  } catch (error: any) {
    console.error('生成语音失败:', error);
    updateStatus('就绪', 'info');
    showNotification(`生成失败: ${error.message}`, 'error');
    naimo.log.error('生成语音失败', error);
  } finally {
    generateBtn.disabled = false;
  }
}

/**
 * 播放语音
 */
function playSpeech() {
  if (!currentAudioPath) return;

  if (isPlaying) {
    // 暂停
    audioPlayer.pause();
    isPlaying = false;
    playBtn.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg><span>播放</span>';
    pauseBtn.classList.add('hidden');
    updateStatus('已暂停', 'info');
    clearHighlight();
  } else {
    // 播放
    audioPlayer.play();
    isPlaying = true;
    playBtn.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V4z"/></svg><span>暂停</span>';
    pauseBtn.classList.remove('hidden');
    updateStatus('正在播放...', 'info');

    // 显示文本段落
    const text = textInput.value.trim();
    const segments = splitTextIntoSegments(text);
    renderTextSegments(segments);
    textInput.parentElement!.classList.add('hidden');
    textDisplay.classList.remove('hidden');

    // 模拟逐段高亮（简化版）
    simulateHighlight(segments);
  }
}

/**
 * 模拟文本高亮（简化版）
 */
function simulateHighlight(segments: string[]) {
  if (segments.length === 0) return;

  const duration = audioPlayer.duration * 1000;
  const segmentDuration = duration / segments.length;

  let currentIndex = 0;
  highlightSegment(currentIndex);

  const interval = setInterval(() => {
    if (!isPlaying || currentIndex >= segments.length - 1) {
      clearInterval(interval);
      return;
    }
    currentIndex++;
    highlightSegment(currentIndex);
  }, segmentDuration);

  audioPlayer.addEventListener('ended', () => {
    clearInterval(interval);
  }, { once: true });
}

/**
 * 下载音频
 */
async function downloadAudio() {
  if (!currentAudioPath) return;

  try {
    updateStatus('正在保存文件...', 'info');

    // 使用 Naimo 的文件选择对话框
    const filePath = await naimo.dialog.showSave({
      title: '保存音频文件',
      defaultPath: `tts_${Date.now()}.mp3`,
      filters: [
        { name: 'MP3 音频', extensions: ['mp3'] }
      ]
    });

    if (!filePath) {
      updateStatus('已取消保存', 'info');
      return;
    }

    // 保存文件
    await window.ttsPluginAPI.saveAudioFile(currentAudioPath, filePath);

    updateStatus('文件保存成功！', 'success');
    showNotification('文件保存成功！', 'success');
    naimo.log.info('文件保存成功', { filePath });

  } catch (error: any) {
    console.error('保存文件失败:', error);
    updateStatus('就绪', 'success');
    showNotification(`保存失败: ${error.message}`, 'error');
    naimo.log.error('保存文件失败', error);
  }
}

// ==================== 事件监听 ====================

/**
 * 配置变化事件
 */
function initConfigListeners() {
  // 语速
  rateSlider.addEventListener('input', () => {
    rateValue.textContent = `${rateSlider.value}%`;
  });

  // 音调
  pitchSlider.addEventListener('input', () => {
    pitchValue.textContent = `${pitchSlider.value}%`;
  });

  // 音量
  volumeSlider.addEventListener('input', () => {
    volumeValue.textContent = `${volumeSlider.value}%`;
  });

  // 语言变化时更新声音选项
  langSelect.addEventListener('change', () => {
    updateVoiceOptions();
  });
}

/**
 * 更新声音选项
 */
function updateVoiceOptions() {
  const lang = langSelect.value;
  const voiceOptions: { [key: string]: { value: string; label: string }[] } = {
    'zh-CN': [
      { value: 'zh-CN-XiaoxiaoNeural', label: '晓晓（女声）' },
      { value: 'zh-CN-YunxiNeural', label: '云希（男声）' },
      { value: 'zh-CN-YunyangNeural', label: '云扬（男声）' },
      { value: 'zh-CN-XiaoyiNeural', label: '晓伊（女声）' }
    ],
    'zh-TW': [
      { value: 'zh-TW-HsiaoChenNeural', label: '晓辰（女声）' },
      { value: 'zh-TW-YunJheNeural', label: '云哲（男声）' }
    ],
    'en-US': [
      { value: 'en-US-AriaNeural', label: 'Aria (Female)' },
      { value: 'en-US-GuyNeural', label: 'Guy (Male)' },
      { value: 'en-US-JennyNeural', label: 'Jenny (Female)' }
    ],
    'en-GB': [
      { value: 'en-GB-SoniaNeural', label: 'Sonia (Female)' },
      { value: 'en-GB-RyanNeural', label: 'Ryan (Male)' }
    ],
    'ja-JP': [
      { value: 'ja-JP-NanamiNeural', label: 'Nanami (Female)' },
      { value: 'ja-JP-KeitaNeural', label: 'Keita (Male)' }
    ],
    'ko-KR': [
      { value: 'ko-KR-SunHiNeural', label: 'SunHi (Female)' },
      { value: 'ko-KR-InJoonNeural', label: 'InJoon (Male)' }
    ],
    'fr-FR': [
      { value: 'fr-FR-DeniseNeural', label: 'Denise (Female)' },
      { value: 'fr-FR-HenriNeural', label: 'Henri (Male)' }
    ],
    'de-DE': [
      { value: 'de-DE-KatjaNeural', label: 'Katja (Female)' },
      { value: 'de-DE-ConradNeural', label: 'Conrad (Male)' }
    ],
    'es-ES': [
      { value: 'es-ES-ElviraNeural', label: 'Elvira (Female)' },
      { value: 'es-ES-AlvaroNeural', label: 'Alvaro (Male)' }
    ]
  };

  const options = voiceOptions[lang] || voiceOptions['zh-CN'];
  voiceSelect.innerHTML = options
    .map(opt => `<option value="${opt.value}">${opt.label}</option>`)
    .join('');
}

/**
 * 音频播放器事件
 */
function initAudioListeners() {
  audioPlayer.onended = () => {
    isPlaying = false;
    playBtn.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg><span>播放</span>';
    pauseBtn.classList.add('hidden');
    updateStatus('播放完成', 'success');

    // 恢复文本输入显示
    textInput.parentElement!.classList.remove('hidden');
    textDisplay.classList.add('hidden');
    clearHighlight();
  };

  audioPlayer.onerror = (error) => {
    console.error('音频播放错误:', error);
    updateStatus('就绪', 'info');
    showNotification('音频播放出错', 'error');
    isPlaying = false;
    playBtn.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg><span>播放</span>';
    pauseBtn.classList.add('hidden');
  };
}

// ==================== 应用初始化 ====================

async function initApp() {
  console.log('TTS 应用初始化...');
  console.log('检查 window.ttsPluginAPI:', window.ttsPluginAPI);

  // 检查 API 是否可用
  if (!window.ttsPluginAPI) {
    console.error('❌ ttsPluginAPI 未定义，可能 preload 脚本未正确加载');
    showNotification('TTS API 初始化失败', 'error');
  } else {
    console.log('✅ ttsPluginAPI 可用');
  }

  // 初始化配置监听
  initConfigListeners();
  initAudioListeners();

  // 绑定按钮事件
  generateBtn.addEventListener('click', generateSpeech);
  playBtn.addEventListener('click', playSpeech);
  pauseBtn.addEventListener('click', playSpeech);
  downloadBtn.addEventListener('click', downloadAudio);

  // 监听 Enter 事件
  naimo.onEnter(async (params: any) => {
    console.log('收到参数:', params);

    // 如果有剪贴板内容，自动填充
    try {
      const clipboardText = await naimo.clipboard.readText();
      if (clipboardText && clipboardText.trim()) {
        textInput.value = clipboardText;
        updateStatus('已从剪贴板加载文本', 'info');
      }
    } catch (error) {
      console.error('读取剪贴板失败:', error);
    }
  });

  naimo.log.info('TTS 应用初始化完成');
  updateStatus('就绪', 'success');
}

// ==================== 入口 ====================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
