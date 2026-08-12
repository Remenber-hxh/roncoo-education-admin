<template>
  <el-card class="info">
    <template #header>数据统计</template>
    <el-row>
      <el-col :span="12">
        <router-link to="/users/list">
          <el-statistic title="员工总数" :value="statData.userSum" />
        </router-link>
      </el-col>
      <el-col :span="12">
        <router-link to="/course/list">
          <el-statistic title="课程总数" :value="statData.courseSum" />
        </router-link>
      </el-col>
    </el-row>
  </el-card>
</template>

<script setup>
  import { onMounted, ref } from 'vue'
  import { statApi } from '@/api/dashboard.js'

  const statData = ref({})
  onMounted(() => {
    statApi.data().then((res) => {
      statData.value = res
    })
  })
</script>
<style lang="scss" scoped>
  .info {
    padding: 15px;
    border-radius: 5px;
    font-size: 16px;
  }
</style>
