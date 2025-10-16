<template>
  <div class="flex-1 overflow-y-auto overflow-x-hidden p-3">
    <div class="space-y-1.5">
      <div
        v-for="segment in segments"
        :key="segment.index"
        :class="[
          'segment p-2 text-sm rounded bg-white border border-gray-200 transition-colors cursor-pointer relative',
          { playing: segment.index === currentPlayingIndex },
          { loaded: segment.isLoaded },
          { loading: loadingSegments.has(segment.index) },
        ]"
        @click="$emit('jumpToSegment', segment.index)"
      >
        <!-- 加載指示器 -->
        <div
          v-if="loadingSegments.has(segment.index)"
          class="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-80 rounded"
        >
          <div class="flex items-center gap-2">
            <svg
              class="animate-spin h-5 w-5 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
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
            <span class="text-xs text-blue-600 font-medium">加載中...</span>
          </div>
        </div>
        <span :class="{ 'opacity-30': loadingSegments.has(segment.index) }">
          {{ segment.content }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TextSegment } from "../utils/TextSplitter";

interface Props {
  segments: TextSegment[];
  currentPlayingIndex: number;
  loadingSegments: Set<number>;
}

defineProps<Props>();

defineEmits<{
  jumpToSegment: [index: number];
}>();
</script>

<style scoped>
.segment.playing {
  background-color: #dbeafe;
  border-color: #3b82f6;
}

.segment.loaded {
  opacity: 1;
}

.segment.loading {
  border-color: #3b82f6;
  border-width: 2px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
