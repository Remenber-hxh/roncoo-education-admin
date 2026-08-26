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
      <!-- href 不能写 "/"，那指向后台自己。门户是独立应用，地址见 utils/portal.js -->
      <a class="icon-btn" :href="portalUrl" target="_blank" rel="noopener" title="打开员工端">
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
  import { getPortalUrl } from '@/utils/portal'

  const appStore = useAppStore()
  const collapsed = computed(() => appStore.sidebarCollapsed)

  // 站点信息是异步拉的，用 computed 让域名到位后链接自动更新
  const portalUrl = computed(() => getPortalUrl())

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
