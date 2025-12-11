import { createApp } from 'vue'
import Index from './Index.vue'
import './style.css'

const app = createApp(Index)

// 全局消息提示（用于 DetailView 中的复制功能）
app.config.globalProperties.$message = {
  success: (msg: string) => {
    console.log('✅', msg)
    // 可以接入 Naive UI 的 message 组件
  },
  error: (msg: string) => {
    console.error('❌', msg)
  },
  warning: (msg: string) => {
    console.warn('⚠️', msg)
  }
}

app.mount('#app')

