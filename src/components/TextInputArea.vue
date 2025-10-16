<template>
  <div class="flex-1 p-3 overflow-hidden">
    <textarea
      :value="modelValue"
      @input="
        $emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)
      "
      class="w-full h-full p-2.5 text-sm border border-gray-300 rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
      placeholder="在此输入要转换为语音的文本..."
    ></textarea>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string;
}

defineProps<Props>();

defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>
