<template>
  <div
    class="px-3 py-2 border-b border-gray-200 flex items-center gap-1.5"
    style="height: 42px"
  >
    <!-- 退出朗读按钮 -->
    <button
      v-show="isReadingMode"
      @click="$emit('exitReading')"
      class="px-3 py-1.5 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors flex items-center gap-1.5"
    >
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clip-rule="evenodd"
        />
      </svg>
      <span>退出朗读</span>
    </button>

    <!-- 朗读按钮 -->
    <button
      v-show="!isReadingMode"
      @click="$emit('read')"
      :disabled="!hasText"
      class="px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"
        />
      </svg>
      <span>朗读</span>
    </button>

    <!-- 试听按钮 -->
    <button
      v-show="!isReadingMode"
      @click="$emit('preview')"
      :disabled="!hasText"
      class="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        <path
          fill-rule="evenodd"
          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
          clip-rule="evenodd"
        />
      </svg>
      <span>试听</span>
    </button>

    <!-- 生成音频按钮 -->
    <button
      v-show="!isReadingMode"
      @click="$emit('generate')"
      :disabled="!hasText"
      class="px-3 py-1.5 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"
        />
      </svg>
      <span>生成音频</span>
    </button>

    <!-- 下载按钮 -->
    <button
      v-show="!isReadingMode"
      @click="$emit('download')"
      :disabled="!hasAudio"
      class="px-3 py-1.5 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
          clip-rule="evenodd"
        />
      </svg>
      <span>下载</span>
    </button>

    <!-- 播放控制按钮 -->
    <button
      v-show="isReadingMode"
      @click="$emit('playControl')"
      :disabled="playControlDisabled"
      :class="playControlClass"
    >
      <svg
        v-show="playState === 'stopped' || playState === 'paused'"
        class="w-4 h-4"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"
        />
      </svg>
      <svg
        v-show="playState === 'playing'"
        class="w-4 h-4"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
          clip-rule="evenodd"
        />
      </svg>
      <span>{{ playControlText }}</span>
    </button>

    <!-- 右側狀態區 -->
    <div class="ml-auto flex items-center gap-2">
      <!-- 加載狀態指示器 -->
      <div
        v-show="loadingSegments.size > 0"
        class="px-2 py-1 text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded flex items-center gap-1.5"
      >
        <svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span>正在加載 {{ loadingSegments.size }} 個段落</span>
      </div>

      <!-- 预加载状态显示 -->
      <div
        v-show="showPreloadStatus"
        class="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded flex items-center gap-1"
      >
        <svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span>{{ preloadStatusText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PlayState } from "../typings";

interface Props {
  hasText: boolean;
  hasAudio: boolean;
  isReadingMode: boolean;
  playState: PlayState;
  playControlDisabled: boolean;
  showPreloadStatus: boolean;
  preloadStatusText: string;
  loadingSegments: Set<number>;
}

const props = defineProps<Props>();

defineEmits<{
  preview: [];
  read: [];
  generate: [];
  download: [];
  exitReading: [];
  playControl: [];
}>();

const playControlText = computed(() => {
  switch (props.playState) {
    case "stopped":
      return "开始播放";
    case "playing":
      return "暂停";
    case "paused":
      return "继续";
    default:
      return "开始播放";
  }
});

const playControlClass = computed(() => {
  const baseClass =
    "px-3 py-1.5 text-sm text-white rounded transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed";
  switch (props.playState) {
    case "stopped":
      return `${baseClass} bg-green-500 hover:bg-green-600`;
    case "playing":
      return `${baseClass} bg-yellow-500 hover:bg-yellow-600`;
    case "paused":
      return `${baseClass} bg-blue-500 hover:bg-blue-600`;
    default:
      return `${baseClass} bg-green-500 hover:bg-green-600`;
  }
});
</script>
