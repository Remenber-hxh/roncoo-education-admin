<template>
  <div class="app-navbar">
    <div class="navbar-left">
      <!-- 折叠按钮：原来侧栏是悬停展开的，没有折叠概念，这里补上 -->
      <span class="icon-btn" :title="collapsed ? '展开菜单' : '收起菜单'" @click="appStore.toggleSidebar()">
        <el-icon :size="18">
          <expand v-if="collapsed" />
          <fold v-else />
        </el-icon>
      </span>
      <breadcrumb />
    </div>

    <div class="navbar-right">
      <a class="icon-btn" href="/" target="_blank" title="打开员工端">
        <el-icon :size="17"><monitor /></el-icon>
      </a>
      <span class="icon-btn" :title="isFullscreen ? '退出全屏' : '全屏'" @click="toggleFullscreen">
        <el-icon :size="17">
          <aim v-if="isFullscreen" />
          <full-screen v-else />
        </el-icon>
      </span>
      <user />
    </div>
  </div>
</template>

<script setup>
  import { computed, onMounted, onUnmounted, ref } from 'vue'
  import { Aim, Expand, Fold, FullScreen, Monitor } from '@element-plus/icons-vue'
  import Breadcrumb from './Breadcrumb.vue'
  import User from './User.vue'
  import { useAppStore } from '@/store/modules/app'

  const appStore = useAppStore()
  const collapsed = computed(() => appStore.sidebarCollapsed)

  const isFullscreen = ref(false)
  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen()
    }
  }
  // 用户按 Esc 退出全屏时也要同步图标，不能只在点击时改
  const syncFullscreen = () => (isFullscreen.value = !!document.fullscreenElement)
  onMounted(() => document.addEventListener('fullscreenchange', syncFullscreen))
  onUnmounted(() => document.removeEventListener('fullscreenchange', syncFullscreen))
</script>

<style lang="scss" scoped>
  .app-navbar {
    height: var(--t-header-h);
    background: var(--t-header-bg);
    border-bottom: 1px solid var(--t-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px 0 8px;
    flex-shrink: 0;
  }

  .navbar-left,
  .navbar-right {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .icon-btn {
    width: 34px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--t-radius-sm);
    color: #5b6472;
    cursor: pointer;

    &:hover {
      background: #f2f4f8;
      color: var(--t-primary);
    }
  }
</style>
