// vite.config.ts
/*
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
*/

// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    // Vite 3.5 的正确配置方式
    assetsInclude: (file: string) => {
      return file.endsWith('.txt') // 显式类型声明
    },
    rollupOptions: {
      output: {
        assetFileNames: ({ name }) => {
          if (name?.endsWith('.txt')) {
            return 'config/[name][extname]'
          }
          return 'assets/[name].[hash][extname]'
        }
      }
    }
  }
})

