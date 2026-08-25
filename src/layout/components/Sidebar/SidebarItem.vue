<template>
  <!-- 有子菜单：渲染可展开的分组 -->
  <el-sub-menu v-if="hasChildren" :index="String(item.id)">
    <template #title>
      <icon v-if="item.menuIcon" :name="item.menuIcon" class="menu-icon" />
      <span>{{ item.menuName }}</span>
    </template>
    <sidebar-item v-for="child in visibleChildren" :key="child.id" :item="child" />
  </el-sub-menu>

  <!-- 叶子菜单 -->
  <el-menu-item v-else :index="item.path">
    <icon v-if="item.menuIcon" :name="item.menuIcon" class="menu-icon" />
    <template #title>{{ item.menuName }}</template>
  </el-menu-item>
</template>

<script setup>
  import { computed } from 'vue'
  import Icon from '@/components/Icon/index.vue'

  const props = defineProps({
    item: { type: Object, required: true }
  })

  // 按钮权限(menu_type=3)和 is_show=0 的详情页路由，
  // 后端 SysUserCommonBiz.filters() 组装菜单树时已经排除，下发的
  // AdminSysMenuUserResp 里连 isShow 字段都没有，前端不必再过滤一次。
  // 这里只做空值兜底：没有子节点时后端返回的是 null 而不是空数组。
  const visibleChildren = computed(() => props.item.children || [])

  const hasChildren = computed(() => visibleChildren.value.length > 0)
</script>

<style lang="scss" scoped>
  .menu-icon {
    width: 18px;
    height: 18px;
    margin-right: 10px;
    flex-shrink: 0;
  }
</style>
