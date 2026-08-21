<template>
  <el-aside class="app-sidebar" :width="collapsed ? 'var(--t-sidebar-width-collapsed)' : 'var(--t-sidebar-width)'">
    <div class="sidebar-brand">
      <!-- svg 图标库里没有 logo，用 Element Plus 的图标当标记 -->
      <el-icon class="brand-icon" :size="22"><reading /></el-icon>
      <span v-show="!collapsed" class="brand-text">内部培训平台</span>
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
  import SidebarItem from './SidebarItem.vue'
  import { Reading } from '@element-plus/icons-vue'

  // 菜单仍然来自 sys_menu（接口下发），这里只换渲染方式：
  // 原来是鼠标悬停展开第二列，改成标准的可折叠嵌套菜单。
  const menuList = computed(() => useUserStore().getMenuList)
  const collapsed = computed(() => useAppStore().sidebarCollapsed)

  const route = useRoute()
  // 用路径而不是路由名做高亮：详情页这类没挂菜单的路由，
  // 靠 activeMenu 元信息回指到父菜单
  const activePath = computed(() => route.meta?.activeMenu || route.path)
</script>

<style lang="scss" scoped>
  .app-sidebar {
    background: var(--t-sidebar-bg);
    height: 100vh;
    overflow: hidden;
    transition: width 0.25s;
    display: flex;
    flex-direction: column;
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
