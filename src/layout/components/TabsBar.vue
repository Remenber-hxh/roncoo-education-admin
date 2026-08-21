<template>
  <div class="tabs-bar">
    <el-scrollbar class="tabs-scroll">
      <div class="tabs-inner">
        <div
          v-for="tab in tabs"
          :key="tab.path"
          class="tab-item"
          :class="{ active: tab.path === activePath }"
          @click="goTab(tab)"
          @contextmenu.prevent="openMenu(tab, $event)"
        >
          <span class="tab-title">{{ tab.title }}</span>
          <el-icon v-if="tab.closable !== false" class="tab-close" @click.stop="closeTab(tab)">
            <close />
          </el-icon>
        </div>
      </div>
    </el-scrollbar>

    <el-dropdown trigger="click" @command="onCommand">
      <span class="tabs-more">
        <el-icon><arrow-down /></el-icon>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="refresh">刷新当前</el-dropdown-item>
          <el-dropdown-item command="others" divided>关闭其他</el-dropdown-item>
          <el-dropdown-item command="all">关闭全部</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- 右键菜单 -->
    <ul v-show="ctx.visible" :style="{ left: ctx.x + 'px', top: ctx.y + 'px' }" class="ctx-menu">
      <li @click="onCommand('refresh')">刷新当前</li>
      <li v-if="ctx.tab && ctx.tab.closable !== false" @click="closeTab(ctx.tab)">关闭</li>
      <li @click="onCommand('others')">关闭其他</li>
      <li @click="onCommand('all')">关闭全部</li>
    </ul>
  </div>
</template>

<script setup>
  import { computed, onMounted, onUnmounted, reactive, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { ArrowDown, Close } from '@element-plus/icons-vue'
  import { useAppStore } from '@/store/modules/app'
  import { useUserStore } from '@/store/modules/user'

  const appStore = useAppStore()
  const route = useRoute()
  const router = useRouter()

  const tabs = computed(() => appStore.visitedTabs)
  const activePath = computed(() => route.path)

  const emit = defineEmits(['refresh'])

  // 页签标题优先用面包屑里的名字，取不到再退回路由 meta 或路径
  function titleOf(r) {
    const crumbs = useUserStore().getBreadcrumbMap.get(r.name)
    if (crumbs && crumbs.length) {
      return crumbs[crumbs.length - 1].title
    }
    return r.meta?.title || r.name || r.path
  }

  function syncTab() {
    if (route.path === '/login' || route.path === '/404') {
      return
    }
    appStore.addTab({ path: route.path, title: titleOf(route) })
  }

  watch(() => route.path, syncTab, { immediate: true })

  function goTab(tab) {
    if (tab.path !== route.path) {
      router.push(tab.path)
    }
  }

  function closeTab(tab) {
    const next = appStore.removeTab(tab.path)
    ctx.visible = false
    // 关的是当前页才需要跳转，关别的页签不该把人带走
    if (tab.path === route.path) {
      router.push(next || '/')
    }
  }

  function onCommand(cmd) {
    ctx.visible = false
    if (cmd === 'refresh') {
      emit('refresh')
    } else if (cmd === 'others') {
      appStore.removeOtherTabs(route.path)
    } else if (cmd === 'all') {
      const next = appStore.removeAllTabs()
      router.push(next || '/')
    }
  }

  // 右键菜单
  const ctx = reactive({ visible: false, x: 0, y: 0, tab: null })
  function openMenu(tab, e) {
    ctx.tab = tab
    ctx.x = e.clientX
    ctx.y = e.clientY
    ctx.visible = true
  }
  const closeCtx = () => (ctx.visible = false)
  onMounted(() => document.addEventListener('click', closeCtx))
  onUnmounted(() => document.removeEventListener('click', closeCtx))
</script>

<style lang="scss" scoped>
  .tabs-bar {
    height: var(--t-tabs-h);
    background: var(--t-header-bg);
    border-bottom: 1px solid var(--t-border);
    display: flex;
    align-items: center;
    padding: 0 8px;
    flex-shrink: 0;
  }

  .tabs-scroll {
    flex: 1;
    min-width: 0;
  }

  .tabs-inner {
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }

  .tab-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    padding: 0 10px;
    font-size: 13px;
    color: #5b6472;
    background: #f2f4f8;
    border-radius: var(--t-radius-sm);
    cursor: pointer;
    user-select: none;

    &:hover {
      color: var(--t-primary);
    }

    &.active {
      background: var(--t-primary);
      color: #fff;
    }

    .tab-close {
      font-size: 12px;
      border-radius: 50%;

      &:hover {
        background: rgba(0, 0, 0, 0.15);
      }
    }
  }

  .tabs-more {
    padding: 0 8px;
    color: #8a94a6;
    cursor: pointer;
    display: flex;
    align-items: center;
  }

  .ctx-menu {
    position: fixed;
    z-index: 3000;
    margin: 0;
    padding: 4px 0;
    list-style: none;
    background: #fff;
    border-radius: var(--t-radius-sm);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
    font-size: 13px;

    li {
      padding: 6px 16px;
      cursor: pointer;

      &:hover {
        background: var(--t-primary-light);
        color: var(--t-primary);
      }
    }
  }
</style>
