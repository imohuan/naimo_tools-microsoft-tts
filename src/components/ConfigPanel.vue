<template>
  <div class="w-72 flex flex-col bg-gray-50">
    <!-- 標題欄 -->
    <div
      class="px-3 py-2 border-b border-gray-200 flex items-center gap-1.5 bg-white"
      style="height: 42px"
    >
      <svg
        class="w-4 h-4 text-gray-700"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fill-rule="evenodd"
          d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
          clip-rule="evenodd"
        />
      </svg>
      <h2 class="text-sm font-semibold text-gray-700">配置选项</h2>
    </div>

    <!-- 配置选项（可滚动） -->
    <div class="flex-1 p-3 overflow-auto space-y-3">
      <!-- 语言选择 -->
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1.5"
          >语言</label
        >
        <select
          :value="config.lang"
          @change="handleLangChange"
          class="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="zh-CN">中文（简体）</option>
          <option value="zh-TW">中文（繁体）</option>
          <option value="en-US">英语（美国）</option>
          <option value="en-GB">英语（英国）</option>
          <option value="ja-JP">日语</option>
          <option value="ko-KR">韩语</option>
          <option value="fr-FR">法语</option>
          <option value="de-DE">德语</option>
          <option value="es-ES">西班牙语</option>
        </select>
      </div>

      <!-- 声音选择 -->
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1.5"
          >声音</label
        >
        <select
          :value="config.voice"
          @change="
            $emit('update:config', {
              ...config,
              voice: ($event.target as HTMLSelectElement).value,
            })
          "
          class="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option
            v-for="voice in availableVoices"
            :key="voice.value"
            :value="voice.value"
          >
            {{ voice.label }}
          </option>
        </select>
      </div>

      <!-- 音频格式 -->
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1.5"
          >音频格式</label
        >
        <select
          :value="config.outputFormat"
          @change="
            $emit('update:config', {
              ...config,
              outputFormat: ($event.target as HTMLSelectElement).value,
            })
          "
          class="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="audio-24khz-96kbitrate-mono-mp3">
            MP3 (24kHz 96kbps)
          </option>
          <option value="audio-24khz-48kbitrate-mono-mp3">
            MP3 (24kHz 48kbps)
          </option>
          <option value="audio-16khz-32kbitrate-mono-mp3">
            MP3 (16kHz 32kbps)
          </option>
        </select>
      </div>

      <!-- 语速 -->
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">
          语速：<span class="font-normal">{{ config.rate }}%</span>
        </label>
        <input
          :value="config.rate"
          @input="
            $emit('update:config', {
              ...config,
              rate: Number(($event.target as HTMLInputElement).value),
            })
          "
          type="range"
          min="-50"
          max="100"
          step="10"
          class="w-full"
        />
        <div class="flex justify-between text-xs text-gray-400 mt-0.5">
          <span>慢</span>
          <span>正常</span>
          <span>快</span>
        </div>
      </div>

      <!-- 音调 -->
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">
          音调：<span class="font-normal">{{ config.pitch }}%</span>
        </label>
        <input
          :value="config.pitch"
          @input="
            $emit('update:config', {
              ...config,
              pitch: Number(($event.target as HTMLInputElement).value),
            })
          "
          type="range"
          min="-50"
          max="50"
          step="10"
          class="w-full"
        />
        <div class="flex justify-between text-xs text-gray-400 mt-0.5">
          <span>低</span>
          <span>正常</span>
          <span>高</span>
        </div>
      </div>

      <!-- 音量 -->
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">
          音量：<span class="font-normal">{{ config.volume }}%</span>
        </label>
        <input
          :value="config.volume"
          @input="
            $emit('update:config', {
              ...config,
              volume: Number(($event.target as HTMLInputElement).value),
            })
          "
          type="range"
          min="-50"
          max="50"
          step="10"
          class="w-full"
        />
        <div class="flex justify-between text-xs text-gray-400 mt-0.5">
          <span>小</span>
          <span>正常</span>
          <span>大</span>
        </div>
      </div>

      <!-- 超时时间 -->
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1.5"
          >超时时间（秒）</label
        >
        <input
          :value="config.timeout"
          @input="
            $emit('update:config', {
              ...config,
              timeout: Number(($event.target as HTMLInputElement).value),
            })
          "
          type="number"
          min="5"
          max="60"
          class="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <!-- 分段字符数（仅在朗读模式下显示） -->
      <div v-show="!isReadingMode">
        <label class="block text-xs font-medium text-gray-700 mb-1.5"
          >分段字符数</label
        >
        <input
          :value="config.maxChars"
          @input="
            $emit('update:config', {
              ...config,
              maxChars: Number(($event.target as HTMLInputElement).value),
            })
          "
          type="number"
          min="50"
          max="500"
          step="50"
          class="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <div class="text-xs text-gray-400 mt-0.5">每段最大字符数（50-500）</div>
      </div>

      <!-- 预加载数量（仅在朗读模式下显示） -->
      <div v-show="!isReadingMode">
        <label class="block text-xs font-medium text-gray-700 mb-1.5"
          >预加载数量</label
        >
        <input
          :value="config.preloadCount"
          @input="
            $emit('update:config', {
              ...config,
              preloadCount: Number(($event.target as HTMLInputElement).value),
            })
          "
          type="number"
          min="1"
          max="10"
          class="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <div class="text-xs text-gray-400 mt-0.5">
          提前加载的音频段数（1-10）
        </div>
      </div>
    </div>

    <!-- 音频播放器（固定） -->
    <div v-show="showAudioPlayer" class="border-t border-gray-200 bg-white p-2">
      <audio
        ref="audioPlayerControl"
        controls
        class="w-full"
        style="height: 48px"
      >
        您的浏览器不支持音频播放。
      </audio>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { TTSConfig, LanguageCode } from "../typings";
import { VOICE_OPTIONS } from "../constants/voices";

interface Props {
  config: TTSConfig;
  showAudioPlayer: boolean;
  isReadingMode: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:config": [config: TTSConfig];
  voiceUpdate: [];
}>();

const availableVoices = computed(() => {
  return (
    VOICE_OPTIONS[props.config.lang as LanguageCode] || VOICE_OPTIONS["zh-CN"]
  );
});

function handleLangChange(event: Event) {
  const newLang = (event.target as HTMLSelectElement).value as LanguageCode;
  const voices = VOICE_OPTIONS[newLang] || VOICE_OPTIONS["zh-CN"];
  emit("update:config", {
    ...props.config,
    lang: newLang,
    voice: voices[0].value,
  });
  emit("voiceUpdate");
}

const audioPlayerControl = ref<HTMLAudioElement | null>(null);

defineExpose({
  audioPlayerControl,
});
</script>
