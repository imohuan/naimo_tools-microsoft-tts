<template>
  <div class="w-full h-full bg-white flex">
    <!-- 左侧文本区域 -->
    <div class="flex-1 flex flex-col border-r border-gray-200">
      <!-- 工具栏 -->
      <ToolBar
        :has-text="!!textInput.trim()"
        :has-audio="!!currentAudioPath"
        :is-reading-mode="isReadingMode"
        :play-state="playState"
        :play-control-disabled="playControlBtnDisabled"
        :show-preload-status="showPreloadStatus"
        :preload-status-text="preloadStatusText"
        :loading-segments="loadingSegments"
        @preview="previewSpeech"
        @read="readFullText"
        @generate="generateSpeech"
        @download="downloadAudio"
        @exit-reading="exitReadingMode"
        @play-control="handlePlayControl"
      />

      <!-- 文本输入区 -->
      <TextInputArea v-show="!isReadingMode" v-model="textInput" />

      <!-- 文本显示区（朗读时高亮） -->
      <TextDisplayArea
        v-show="isReadingMode"
        :segments="displaySegments"
        :current-playing-index="currentPlayingIndex"
        :loading-segments="loadingSegments"
        @jump-to-segment="jumpToSegment"
      />
    </div>

    <!-- 右侧配置区域 -->
    <ConfigPanel
      ref="configPanelRef"
      :config="config"
      :show-audio-player="showAudioPlayer"
      :is-reading-mode="isReadingMode"
      @update:config="handleConfigUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import ToolBar from "./components/ToolBar.vue";
import TextInputArea from "./components/TextInputArea.vue";
import TextDisplayArea from "./components/TextDisplayArea.vue";
import ConfigPanel from "./components/ConfigPanel.vue";
import { TextSplitter, type TextSegment } from "./utils/TextSplitter";
import { AudioPreloader, type PreloadStatus } from "./utils/AudioPreloader";
import { showNotification } from "./utils/notification";
import { convertToApiConfig } from "./utils/config";
import type { TTSConfig, PlayState } from "./typings";

// ==================== 状态管理 ====================

const textInput = ref("");
const isReadingMode = ref(false);
const currentAudioPath = ref<string | null>(null);
const showAudioPlayer = ref(false);
const displaySegments = ref<TextSegment[]>([]);
const currentPlayingIndex = ref(-1);
const playState = ref<PlayState>("stopped");
const playControlBtnDisabled = ref(false);
const showPreloadStatus = ref(false);
const preloadStatusText = ref("");
const loadingSegments = ref<Set<number>>(new Set()); // 正在加載的段落索引

// 引用
const configPanelRef = ref<InstanceType<typeof ConfigPanel> | null>(null);

// 獲取音頻播放器元素的輔助函數
function getAudioPlayer(): HTMLAudioElement | null {
  return configPanelRef.value?.audioPlayerControl || null;
}

// 配置
const config = reactive<TTSConfig>({
  voice: "zh-CN-XiaoxiaoNeural",
  lang: "zh-CN",
  outputFormat: "audio-24khz-96kbitrate-mono-mp3",
  pitch: 0,
  rate: 0,
  volume: 0,
  timeout: 10,
  maxChars: 100,
  preloadCount: 3,
});

// 工具类实例
let textSplitter: TextSplitter | null = null;
let audioPreloader: AudioPreloader | null = null;

// ==================== 配置更新處理 ====================

function handleConfigUpdate(newConfig: TTSConfig) {
  const oldMaxChars = config.maxChars;
  Object.assign(config, newConfig);

  // 如果在朗讀模式下且 maxChars 改變了，則重新分段
  if (isReadingMode.value && oldMaxChars !== newConfig.maxChars) {
    resegmentText();
  }
}

function resegmentText() {
  const text = textInput.value.trim();
  if (!text) return;

  try {
    // 如果正在播放，先停止
    const wasPlaying = playState.value !== "stopped";
    if (wasPlaying && audioPreloader) {
      audioPreloader.stop();
      audioPreloader = null;
      playState.value = "stopped";
      currentPlayingIndex.value = -1;
      showPreloadStatus.value = false;
    }

    // 更新分割器的最大字符數
    if (!textSplitter) {
      textSplitter = new TextSplitter(config.maxChars);
    } else {
      textSplitter.setMaxChars(config.maxChars);
    }

    // 重新分割文本
    const segments = textSplitter.split(text);

    if (segments.length === 0) {
      showNotification("文本分割失败", "error");
      return;
    }

    displaySegments.value = segments;
    showNotification(`已重新分段，共 ${segments.length} 個段落`, "info");
    naimo.log.info("重新分段", {
      segmentCount: segments.length,
      maxChars: config.maxChars,
    });
  } catch (error: any) {
    console.error("重新分段失败:", error);
    showNotification(`重新分段失败: ${error.message}`, "error");
  }
}

// ==================== 主要功能 ====================

async function previewSpeech() {
  const text = textInput.value.trim();

  if (!text) {
    showNotification("请输入要转换的文本", "error");
    return;
  }

  if (!window.ttsPluginAPI) {
    showNotification("TTS API 未初始化，请刷新页面", "error");
    return;
  }

  try {
    const previewText = text.substring(0, 10);
    const apiConfig = convertToApiConfig(config);
    const audioPath = await window.ttsPluginAPI.generateSpeech(
      previewText,
      apiConfig
    );
    const audioData = await window.ttsPluginAPI.getAudioData(audioPath);

    const audioControl = getAudioPlayer();
    if (audioControl) {
      audioControl.src = audioData;
      showAudioPlayer.value = true;
      audioControl.play();
    }

    showNotification(
      `试听前 ${previewText.length} 个字：${previewText}`,
      "success"
    );
    naimo.log.info("试听成功", { previewText });
  } catch (error: any) {
    console.error("试听失败:", error);
    showNotification(`试听失败: ${error.message}`, "error");
    naimo.log.error("试听失败", error);
  }
}

async function readFullText() {
  const text = textInput.value.trim();

  if (!text) {
    showNotification("请输入要转换的文本", "error");
    return;
  }

  try {
    isReadingMode.value = true;
    showAudioPlayer.value = true; // 進入朗讀模式時顯示音頻播放器

    // 初始化文本分割器
    if (!textSplitter) {
      textSplitter = new TextSplitter(config.maxChars);
    } else {
      textSplitter.setMaxChars(config.maxChars);
    }

    // 分割文本
    const segments = textSplitter.split(text);

    if (segments.length === 0) {
      throw new Error("文本分割失败，未找到有效段落");
    }

    displaySegments.value = segments;
    playState.value = "stopped";

    // showNotification(
    //   `已准备 ${segments.length} 个段落，点击"开始播放"开始朗读`,
    //   "info"
    // );
    naimo.log.info("进入朗读模式", { segmentCount: segments.length });
  } catch (error: any) {
    console.error("进入朗读模式失败:", error);
    showNotification(`进入朗读模式失败: ${error.message}`, "error");
    naimo.log.error("进入朗读模式失败", error);
    exitReadingMode();
  }
}

function exitReadingMode() {
  if (audioPreloader) {
    audioPreloader.stop();
    audioPreloader = null;
  }

  isReadingMode.value = false;
  playState.value = "stopped";
  displaySegments.value = [];
  currentPlayingIndex.value = -1;
  showPreloadStatus.value = false;
  loadingSegments.value = new Set();

  // 清除音頻播放器
  const audioControl = getAudioPlayer();
  if (audioControl) {
    audioControl.src = "";
  }
  showAudioPlayer.value = false;
}

async function generateSpeech() {
  const text = textInput.value.trim();

  if (!text) {
    showNotification("请输入要转换的文本", "error");
    return;
  }

  if (!window.ttsPluginAPI) {
    showNotification("TTS API 未初始化，请刷新页面", "error");
    return;
  }

  try {
    const apiConfig = convertToApiConfig(config);
    const audioPath = await window.ttsPluginAPI.generateSpeech(text, apiConfig);
    currentAudioPath.value = audioPath;

    const audioData = await window.ttsPluginAPI.getAudioData(audioPath);

    const audioControl = getAudioPlayer();
    if (audioControl) {
      audioControl.src = audioData;
      showAudioPlayer.value = true;
    }

    showNotification("音频生成成功！", "success");
    naimo.log.info("音频生成成功", { audioPath });
  } catch (error: any) {
    console.error("生成音频失败:", error);
    showNotification(`生成失败: ${error.message}`, "error");
    naimo.log.error("生成音频失败", error);
  }
}

async function downloadAudio() {
  if (!currentAudioPath.value) return;

  try {
    const filePath = await naimo.dialog.showSave({
      title: "保存音频文件",
      defaultPath: `tts_${Date.now()}.mp3`,
      filters: [{ name: "MP3 音頻", extensions: ["mp3"] }],
    });

    if (!filePath) return;

    await window.ttsPluginAPI.saveAudioFile(currentAudioPath.value, filePath);

    showNotification("文件保存成功！", "success");
    naimo.log.info("文件保存成功", { filePath });
  } catch (error: any) {
    console.error("保存文件失败:", error);
    showNotification(`保存失败: ${error.message}`, "error");
    naimo.log.error("保存文件失败", error);
  }
}

// ==================== 播放控制 ====================

async function handlePlayControl() {
  if (playState.value === "stopped") {
    await startPlay();
  } else if (playState.value === "playing") {
    pausePlay();
  } else {
    resumePlay();
  }
}

async function startPlay(startIndex: number = 0) {
  const audioPlayer = getAudioPlayer();
  if (!isReadingMode.value || !audioPlayer) {
    if (!audioPlayer) {
      showNotification("音頻播放器未初始化", "error");
    }
    return;
  }

  if (!window.ttsPluginAPI) {
    showNotification("TTS API 未初始化，请刷新页面", "error");
    return;
  }

  try {
    playControlBtnDisabled.value = true;

    // 使用最新的 displaySegments.value（確保使用重新分段後的內容）
    const apiConfig = convertToApiConfig(config);
    audioPreloader = new AudioPreloader(
      displaySegments.value,
      apiConfig,
      audioPlayer,
      config.preloadCount
    );

    audioPreloader.setStatusCallback((status: PreloadStatus) => {
      updatePreloadStatus(status);
      currentPlayingIndex.value = status.currentIndex;
    });

    // 設置加載狀態回調
    audioPreloader.setLoadingCallback(
      (isLoading: boolean, segmentIndex: number) => {
        if (isLoading) {
          loadingSegments.value.add(segmentIndex);
        } else {
          loadingSegments.value.delete(segmentIndex);
        }
        // 觸發響應式更新
        loadingSegments.value = new Set(loadingSegments.value);
      }
    );

    // 监听播放结束
    audioPlayer.addEventListener("ended", () => {
      if (
        audioPreloader &&
        audioPreloader.getCurrentIndex() >= displaySegments.value.length - 1
      ) {
        showNotification("朗读完成", "success");
        showPreloadStatus.value = false;
        playState.value = "stopped";
      }
    });

    // 從指定的段落開始播放
    await audioPreloader.start(startIndex);
    playState.value = "playing";

    naimo.log.info("开始播放", {
      segmentCount: displaySegments.value.length,
      startIndex,
    });
  } catch (error: any) {
    console.error("播放失败:", error);
    showNotification(`播放失败: ${error.message}`, "error");
    naimo.log.error("播放失败", error);
  } finally {
    playControlBtnDisabled.value = false;
  }
}

function pausePlay() {
  if (audioPreloader) {
    audioPreloader.pause();
    playState.value = "paused";
  }
}

function resumePlay() {
  if (audioPreloader) {
    audioPreloader.resume();
    playState.value = "playing";
  }
}

async function jumpToSegment(index: number) {
  // 如果正在播放，則跳轉到指定段落
  if (audioPreloader && audioPreloader.isCurrentlyPlaying()) {
    try {
      await audioPreloader.jumpTo(index);
    } catch (error: any) {
      showNotification(`跳转失败: ${error.message}`, "error");
    }
    return;
  }

  // 如果沒有播放，則從指定段落開始播放
  if (playState.value === "stopped") {
    try {
      await startPlay(index);
    } catch (error: any) {
      showNotification(`播放失败: ${error.message}`, "error");
    }
  }
}

function updatePreloadStatus(status: PreloadStatus) {
  const { totalSegments, currentIndex } = status;

  if (!audioPreloader) return;

  const segments = audioPreloader.getSegments();
  const maxPreload = config.preloadCount;
  const startIndex = currentIndex + 1;
  const endIndex = Math.min(startIndex + maxPreload, totalSegments);

  let loadingCount = 0;
  for (let i = startIndex; i < endIndex; i++) {
    if (!segments[i]?.isLoaded) {
      loadingCount++;
    }
  }

  showPreloadStatus.value = true;
  if (loadingCount > 0) {
    preloadStatusText.value = `正在加载: ${loadingCount}/${maxPreload} | 播放 ${
      currentIndex + 1
    }/${totalSegments}`;
  } else {
    preloadStatusText.value = `播放 ${currentIndex + 1}/${totalSegments}`;
  }
}

// ==================== 生命周期 ====================

onMounted(async () => {
  console.log("TTS 應用初始化...");
  console.log("檢查 window.ttsPluginAPI:", window.ttsPluginAPI);

  if (!window.ttsPluginAPI) {
    console.error("❌ ttsPluginAPI 未定義，可能 preload 腳本未正確加載");
    showNotification("TTS API 初始化失败", "error");
  } else {
    console.log("✅ ttsPluginAPI 可用");
  }

  // 监听 Enter 事件
  naimo.onEnter(async (params: any) => {
    console.log("收到參數:", params);

    try {
      const clipboardText = await naimo.clipboard.readText();
      if (clipboardText && clipboardText.trim()) {
        textInput.value = clipboardText;
        showNotification("已从剪贴板加载文本", "info");
      }
    } catch (error) {
      console.error("读取剪贴板失败:", error);
    }
  });

  naimo.log.info("TTS 應用初始化完成");
});
</script>

<style>
@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in {
  animation: slide-in 0.3s ease;
}
</style>
