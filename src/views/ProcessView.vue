<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NCard, NButton, NUpload, NUploadDragger, NIcon, NText, NFlex,
  NScrollbar, NEmpty, NBadge, NTag, NSplit, NList, NListItem, type UploadFileInfo
} from 'naive-ui'
import { CloudUploadOutlined, FolderOpenOutlined } from '@vicons/antd'
import NodeCard from '../components/NodeCard.vue'
import type { TaskInfo, NodeInfo } from '../types'
import type { LogParser } from '../utils/logParser'
import { isTauri, openLogFileDialog } from '../utils/fileDialog'
import { formatDuration } from '../utils/formatDuration'

const props = defineProps<{
  tasks: TaskInfo[]
  selectedTask: TaskInfo | null
  loading: boolean
  parser: LogParser
  detailViewCollapsed?: boolean
  onExpandDetailView?: () => void
}>()

const emit = defineEmits<{
  'select-task': [task: TaskInfo]
  'upload-file': [file: File]
  'upload-content': [content: string]
  'select-node': [node: NodeInfo]
  'select-recognition': [node: NodeInfo, attemptIndex: number]
  'select-nested': [node: NodeInfo, attemptIndex: number, nestedIndex: number]
}>()

// 当前选中的任务索引
const activeTaskIndex = ref(0)

// 是否在 Tauri 环境
const isInTauri = ref(isTauri())

// 任务列表折叠状态
const taskListCollapsed = ref(false)
const taskListSize = ref(0.25)
const taskListSavedSize = ref(0.25)

// 切换任务列表折叠状态
const toggleTaskList = () => {
  if (taskListCollapsed.value) {
    // 展开：恢复保存的大小
    taskListSize.value = taskListSavedSize.value
    taskListCollapsed.value = false
  } else {
    // 折叠：保存当前大小，然后完全隐藏
    taskListSavedSize.value = taskListSize.value
    taskListSize.value = 0
    taskListCollapsed.value = true
  }
}

// 当前任务的节点列表
const currentNodes = computed<NodeInfo[]>(() => {
  if (!props.selectedTask) return []
  return props.selectedTask.nodes || []
})

// 切换任务
const handleTabChange = (index: number) => {
  activeTaskIndex.value = index
  if (props.tasks[index]) {
    emit('select-task', props.tasks[index])
  }
}

// 处理文件上传（Web）
const handleFileChange = (options: { fileList: UploadFileInfo[] }) => {
  const file = options.fileList[0]?.file
  if (file) {
    emit('upload-file', file as File)
  }
}

// 使用 Tauri 打开文件
const handleTauriOpen = async () => {
  const content = await openLogFileDialog()
  if (content) {
    emit('upload-content', content)
  }
}

// 选择节点
const handleNodeClick = (node: NodeInfo) => {
  emit('select-node', node)
}

// 选择识别尝试
const handleRecognitionClick = (node: NodeInfo, attemptIndex: number) => {
  emit('select-recognition', node, attemptIndex)
}

// 选择嵌套节点
const handleNestedClick = (node: NodeInfo, attemptIndex: number, nestedIndex: number) => {
  emit('select-nested', node, attemptIndex, nestedIndex)
}
</script>

<template>
  <n-card
    title="MAA 日志分析器"
    style="height: 100%"
    content-style="display: flex; flex-direction: column; gap: 16px; min-height: 0"
  >
    <!-- 标题右侧：主题切换按钮 -->
    <!-- 文件上传区域 -->
    <div v-if="tasks.length === 0">
      <!-- Tauri 环境：使用原生文件对话框 -->
      <div v-if="isInTauri" style="text-align: center; padding: 40px 20px">
        <n-icon size="48" :depth="3" style="margin-bottom: 16px">
          <folder-open-outlined />
        </n-icon>
        <div style="margin-bottom: 20px">
          <n-text style="font-size: 16px; display: block; margin-bottom: 8px">
            使用原生文件选择器
          </n-text>
          <n-text depth="3" style="font-size: 14px; display: block; margin-bottom: 8px">
            支持 maa.log 格式
          </n-text>
          <n-badge value="Tauri" type="success" style="margin-top: 4px" />
        </div>
        <n-button type="primary" size="large" @click="handleTauriOpen">
          <template #icon>
            <n-icon><folder-open-outlined /></n-icon>
          </template>
          选择日志文件
        </n-button>
      </div>
      
      <!-- Web 环境：使用拖拽上传 -->
      <n-upload
        v-else
        :show-file-list="false"
        :custom-request="() => {}"
        @change="handleFileChange"
      >
        <n-upload-dragger>
          <div style="padding: 20px">
            <n-icon size="48" :depth="3">
              <cloud-upload-outlined />
            </n-icon>
            <n-text style="font-size: 16px">
              点击或拖拽上传日志文件
            </n-text>
            <n-text depth="3" style="font-size: 14px">
              支持 maa.log 格式
            </n-text>
          </div>
        </n-upload-dragger>
      </n-upload>
    </div>

    <!-- 任务列表 -->
    <template v-else>
      <!-- 操作按钮 -->
      <n-flex>
        <!-- Tauri 环境 -->
        <n-button v-if="isInTauri" @click="handleTauriOpen">
          <template #icon>
            <n-icon><folder-open-outlined /></n-icon>
          </template>
          重新打开
        </n-button>

        <!-- Web 环境 -->
        <n-upload
          v-else
          :show-file-list="false"
          :custom-request="() => {}"
          @change="handleFileChange"
        >
          <n-button>
            <template #icon>
              <n-icon><cloud-upload-outlined /></n-icon>
            </template>
            重新上传
          </n-button>
        </n-upload>
      </n-flex>

      <!-- 左右分栏布局 -->
      <n-split
        direction="horizontal"
        v-model:size="taskListSize"
        :min="0"
        :max="0.4"
        style="flex: 1; min-height: 0"
      >
        <!-- 左侧：任务列表 -->
        <template #1>
          <n-card size="small" title="任务列表" style="height: 100%; display: flex; flex-direction: column; position: relative" content-style="padding: 0; flex: 1; min-height: 0; overflow: hidden">
            <!-- 折叠按钮 - 右边缘中间 -->
            <n-button
              circle
              size="small"
              @click="toggleTaskList"
              style="position: absolute; right: -12px; top: 50%; transform: translateY(-50%); z-index: 100; box-shadow: 0 2px 8px rgba(0,0,0,0.15)"
            >
              <template #icon>
                <n-icon>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <!-- 展开时显示向左箭头，表示点击后向左折叠 -->
                    <path fill="currentColor" d="M15.41 7.41L14 6l-6 6l6 6l1.41-1.41L10.83 12z"/>
                  </svg>
                </n-icon>
              </template>
            </n-button>
            <n-scrollbar style="height: 100%; max-height: 100%">
              <n-list hoverable clickable>
                <n-list-item
                  v-for="(task, index) in tasks"
                  :key="index"
                  @click="handleTabChange(index)"
                  :style="{
                    backgroundColor: activeTaskIndex === index ? 'var(--n-color-target)' : 'transparent',
                    cursor: 'pointer',
                    padding: '12px 16px'
                  }"
                >
                  <n-flex vertical style="gap: 8px">
                    <!-- 任务入口名称 -->
                    <n-flex align="center" justify="space-between">
                      <n-text strong style="font-size: 15px">{{ task.entry }}</n-text>
                      <n-tag size="small" :type="task.status === 'succeeded' ? 'success' : task.status === 'failed' ? 'error' : 'warning'">
                        #{{ index + 1 }}
                      </n-tag>
                    </n-flex>

                    <!-- 任务详情 -->
                    <n-flex vertical style="gap: 4px">
                      <n-text depth="3" style="font-size: 12px">
                        状态:
                        <n-text :type="task.status === 'succeeded' ? 'success' : task.status === 'failed' ? 'error' : 'warning'">
                          {{ task.status === 'succeeded' ? '成功' : task.status === 'failed' ? '失败' : '运行中' }}
                        </n-text>
                      </n-text>
                      <n-text depth="3" style="font-size: 12px">
                        节点: {{ task.nodes.length }} 个
                      </n-text>
                      <n-text depth="3" style="font-size: 12px" v-if="task.duration">
                        耗时: {{ formatDuration(task.duration) }}
                      </n-text>
                    </n-flex>
                  </n-flex>
                </n-list-item>
              </n-list>
            </n-scrollbar>
          </n-card>
        </template>

        <!-- 右侧：节点详情 -->
        <template #2>
          <n-card size="small" title="节点时间线" style="height: 100%; display: flex; flex-direction: column; position: relative" content-style="padding: 0; flex: 1; min-height: 0; overflow: hidden">
            <!-- 展开任务列表按钮（仅在任务列表折叠时显示） -->
            <n-button
              v-if="taskListCollapsed"
              circle
              size="small"
              @click="toggleTaskList"
              style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); z-index: 100; box-shadow: 0 2px 8px rgba(0,0,0,0.15)"
            >
              <template #icon>
                <n-icon>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <!-- 折叠时显示向右箭头，表示点击后从左侧展开 -->
                    <path fill="currentColor" d="M8.59 16.59L10 18l6-6l-6-6l-1.41 1.41L13.17 12z"/>
                  </svg>
                </n-icon>
              </template>
            </n-button>

            <!-- 展开节点详情按钮（仅在节点详情折叠时显示） -->
            <n-button
              v-if="detailViewCollapsed && onExpandDetailView"
              circle
              size="small"
              @click="onExpandDetailView"
              style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); z-index: 100; box-shadow: 0 2px 8px rgba(0,0,0,0.15)"
            >
              <template #icon>
                <n-icon>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <!-- 折叠时显示向左箭头，表示点击后从右侧展开 -->
                    <path fill="currentColor" d="M15.41 7.41L14 6l-6 6l6 6l1.41-1.41L10.83 12z"/>
                  </svg>
                </n-icon>
              </template>
            </n-button>

            <n-scrollbar style="height: 100%; max-height: 100%">
              <div v-if="currentNodes.length === 0" style="padding: 40px 0">
                <n-empty description="暂无节点数据" />
              </div>
              <n-flex vertical v-else style="gap: 16px; padding: 12px">
                <node-card
                  v-for="node in currentNodes"
                  :key="`${node.task_id}-${node.node_id}`"
                  :node="node"
                  @select-node="handleNodeClick"
                  @select-recognition="handleRecognitionClick"
                  @select-nested="handleNestedClick"
                />
              </n-flex>
            </n-scrollbar>
          </n-card>
        </template>
      </n-split>
    </template>
  </n-card>
</template>

<style scoped>
/* Fix Naive UI scrollbar container background in light mode */
:deep(.n-scrollbar-container) {
  background-color: transparent !important;
}

:deep(.n-scrollbar-content) {
  background-color: transparent !important;
}

:deep(.n-card__content) {
  background-color: transparent !important;
}
</style>