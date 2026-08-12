<template>
  <div class="app-container">
    <div class="container-header">
      <div class="header-info">
        <img :src="currentCourseInfo.courseLogo" :alt="currentCourseInfo.courseName" style="height: 120px; width: auto; border-radius: 10px" />
        <div class="info">
          <div class="info-title">{{ currentCourseInfo.courseName }}</div>
          <div class="info-name">讲师：{{ currentCourseInfo.lecturerName }}</div>
        </div>
      </div>
    </div>
    <div style="height: 20px"></div>
    <el-tabs v-model="activeName" @tab-click="handleClick">
      <el-tab-pane label="学习记录" name="course">
        <record-course v-if="activeName === 'course'" />
      </el-tab-pane>
      <el-tab-pane label="评论记录" name="comment">
        <record-comment v-if="activeName === 'comment'" />
      </el-tab-pane>
      <el-tab-pane label="收藏记录" name="collect">
        <record-collect v-if="activeName === 'collect'" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<script setup>
  import RecordComment from './Comment.vue'
  import RecordCollect from './Collect.vue'
  import RecordCourse from './Course.vue'
  import { onMounted, ref } from 'vue'
  import { courseApi } from '@/api/course.js'
  import { useRoute } from 'vue-router'
  import { ElMessage } from 'element-plus'
  const route = useRoute()

  const activeName = ref('course')

  onMounted(() => {
    // 本页是详情页，必须带 courseId（由课程列表的「数据」按钮跳转过来）。
    // 缺参数时不发请求，否则会把字符串 "undefined" 传给后端导致报错。
    if (!route.query.courseId) {
      ElMessage.warning('请从「课程列表」中选择课程后查看数据')
      return
    }
    // 课程信息
    handleCourseInfo()
  })

  // 课程信息
  const currentCourseInfo = ref({})
  const handleCourseInfo = async () => {
    currentCourseInfo.value = await courseApi.courseView({ id: route.query.courseId })
  }

  // 切换
  const handleClick = (target) => {
    activeName.value = target.props.name
  }
</script>
<style lang="scss" scoped>
  .container-header {
    display: flex;
    justify-content: space-between;
    .header-info {
      display: flex;
      .info {
        margin-left: 20px;
        line-height: 30px;
        .info-name {
          color: #999;
        }
      }
    }

    .header-button {
      float: right;
    }
  }
</style>
