/**
 * Preload 构建配置
 * 专门用于配置 preload.ts 的构建选项
 */

import { defineConfig } from 'vite';
import { resolve } from 'path';
import { builtinModules } from 'module';

/**
 * Preload 构建配置
 */
export default defineConfig({
  base: './',
  build: {
    lib: {
      entry: resolve(__dirname, './src/preload.ts'),
      formats: ['cjs'],
      fileName: () => 'preload.js'
    },
    outDir: resolve(__dirname, './dist'),
    emptyOutDir: false,
    sourcemap: false,
    minify: false, // 不压缩，便于调试
    commonjsOptions: {
      // 配置 CommonJS 转换选项，确保正确处理 ws 等模块
      transformMixedEsModules: true,
      ignoreDynamicRequires: false,
    },
    rollupOptions: {
      external: [
        'electron',
        // ws 的可选依赖（不安装也可以工作）
        'bufferutil',
        'utf-8-validate',
        // 只将 Node.js 内置模块标记为 external
        // node-edge-tts 需要被打包进来
        ...builtinModules.flatMap(m => [m, `node:${m}`])
      ],
      output: {
        format: 'cjs',
        exports: 'auto',
        // 确保 preload 是单个文件，不分块
        inlineDynamicImports: true,
        // 保持内置模块的引用格式
        paths: (id: string) => {
          if (builtinModules.includes(id)) {
            return id;
          }
          return id;
        },
        // 确保 default export 正确处理
        interop: 'auto',
        // 处理外部模块的引用
        externalLiveBindings: false
      }
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    },
    // 强制使用 Node.js 环境的条件导出，而不是浏览器环境
    conditions: ['node', 'require'],
    // 优先使用 main 字段而不是 browser 字段
    mainFields: ['main', 'module']
  },
  optimizeDeps: {
    // 排除 node-edge-tts 的优化，在 build 时处理
    exclude: ['node-edge-tts', 'ws']
  }
})

