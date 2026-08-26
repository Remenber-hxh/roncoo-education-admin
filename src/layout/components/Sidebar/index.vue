<template>
  <el-aside class="app-sidebar" :class="{ 'is-collapsed': collapsed }">
    <div class="sidebar-brand">
      <!-- 站点名称和 Logo 都取自「参数配置」，不能写死。
           改版时我把这里写成了固定的「内部培训平台」，
           结果后台把网站名称改成别的，侧栏还是老样子。 -->
      <img v-if="websiteLogo" class="brand-logo" :src="websiteLogo" :alt="websiteName" />
      <el-icon v-else class="brand-icon" :size="22"><reading /></el-icon>
      <span v-show="!collapsed" class="brand-text">{{ websiteName }}</span>
    </div>
    <el-scrollbar class="sidebar-scroll">
      <el-menu
        :default-active="activePath"
        :collapse="collapsed"
        :collapse-transition="false"
        unique-opened
        router
        background-color="var(--t-sidebar-bg)"
        text-color="var(--t-sidebar-text)"
        active-text-color="var(--t-sidebar-text-active)"
      >
        <sidebar-item v-for="item in menuList" :key="item.id" :item="item" />
      </el-menu>
    </el-scrollbar>
  </el-aside>
</template>

<script setup>
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'
  import { useUserStore } from '@/store/modules/user'
  import { useAppStore } from '@/store/modules/app'
  import { useWebsiteStore } from '@/store/modules/website.js'
  import SidebarItem from './SidebarItem.vue'
  import { Reading } from '@element-plus/icons-vue'

  // 菜单仍然来自 sys_menu（接口下发），这里只换渲染方式：
  // 原来是鼠标悬停展开第二列，改成标准的可折叠嵌套菜单。
  const menuList = computed(() => useUserStore().getMenuList)
  const collapsed = computed(() => useAppStore().sidebarCollapsed)

  // 站点信息由 layout/index.vue 在挂载时调 useWebsiteStore().init() 拉取
  const websiteName = computed(() => useWebsiteStore().getInfo?.websiteName || '培训平台')
  const websiteLogo = computed(() => useWebsiteStore().getInfo?.websiteLogo || '')

  const route = useRoute()
  // 用路径而不是路由名做高亮：详情页这类没挂菜单的路由，
  // 靠 activeMenu 元信息回指到父菜单
  const activePath = computed(() => route.meta?.activeMenu || route.path)
</script>

<style lang="scss" scoped>
  // 宽度用类名切换，且不加 transition。
  //
  // 踩过两个坑，都表现为「点了折叠按钮，状态变了但宽度纹丝不动」：
  //   1. 走 el-aside 的 :width 属性 —— 那只是改 --el-aside-width 变量，
  //      width 的声明值始终是 var(--el-aside-width) 没变，浏览器不认为
  //      值发生了变化。
  //   2. 改成类名切换后，只要 width 上还声明着 transition，浏览器就会把
  //      由 var() 求值得到的宽度冻在旧值上（实测禁用 transition 的瞬间
  //      宽度立刻从 64px 跳回 210px）。
  // 结论：宽度取自 CSS 变量时不要给它加过渡。折叠改为瞬时，
  // 换来的是行为确定，且变量仍是唯一的数据源。
  .app-sidebar {
    width: var(--t-sidebar-width);
    background: var(--t-sidebar-bg);
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    &.is-collapsed {
      width: var(--t-sidebar-width-collapsed);
    }
  }

  .sidebar-brand {
    height: var(--t-header-h);
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 16px;
    color: #fff;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);

    .brand-icon {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }

    .brand-logo {
      height: 26px;
      width: auto;
      max-width: 32px;
      object-fit: contain;
      flex-shrink: 0;
    }

    .brand-text {
      font-size: 15px;
      font-weight: 600;
      white-space: nowrap;
    }
  }

  .sidebar-scroll {
    flex: 1;
    min-height: 0;
  }

  :deep(.el-menu) {
    border-right: none;
  }

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    height: 44px;
    line-height: 44px;

    &:hover {
      background-color: var(--t-sidebar-hover) !important;
      color: var(--t-sidebar-text-active) !important;
    }
  }

  :deep(.el-menu-item.is-active) {
    background-color: var(--t-sidebar-active) !important;
    color: var(--t-sidebar-text-active) !important;
  }

  // 折叠时弹出的子菜单也要跟着深色，否则是一块白底很跳
  :deep(.el-menu--collapse) .el-sub-menu__title span {
    display: none;
  }
</style>
