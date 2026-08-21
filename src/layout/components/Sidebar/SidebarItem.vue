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

  // menu_type=3 是按钮权限，不该出现在导航里；
  // is_show=0 的是详情页那类挂了路由但不进菜单的，也要滤掉
  // （之前「用户记录」「课程编辑」露在侧栏里点了报错，就是这个原因）
  const visibleChildren = computed(() => (props.item.children || []).filter((c) => c.menuType !== 3 && c.isShow !== 0))

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
