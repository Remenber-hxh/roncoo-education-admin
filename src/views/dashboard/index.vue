<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col v-if="hasPermission('stat:data')" :span="24">
        <stat-data />
      </el-col>
    </el-row>

    <div v-if="hasPermission('stat:login')">
      <stat-login />
    </div>
    <div v-if="hasPermission('stat:vod')">
      <stat-vod />
    </div>
  </div>
</template>
<script setup>
  import StatVod from './StatVod.vue'
  import StatLogin from './StatLogin.vue'
  import StatData from './StatData.vue'
  import { hasPermission } from '@/utils/permission.js'
</script>
<style lang="scss" scoped></style>
