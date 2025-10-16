/// <reference path="../typings/naimo.d.ts" />

import { createApp } from 'vue';
import App from './App.vue';
import './style.css';

// ==================== 熱重載 ====================
if (import.meta.hot) {
  import.meta.hot.on('preload-changed', async (data) => {
    console.log('📝 檢測到 preload 變化:', data);
    console.log('🔨 正在觸發 preload 構建...');
    try {
      const response = await fetch('/__preload_build');
      const result = await response.json();
      if (result.success) {
        console.log('✅ Preload 構建完成');
        await window.naimo.hot();
        console.log('🔄 Preload 熱重載完成');
        location.reload();
      } else {
        console.error('❌ Preload 構建失敗');
      }
    } catch (error) {
      console.error('❌ 觸發 preload 構建失敗:', error);
    }
  });
}

// ==================== 應用初始化 ====================

const app = createApp(App);

app.mount('#app');

console.log('✅ Vue 應用已掛載');
