<template>
  <div class="app-container">
    <div class="page_head">
      <div class="search_bar clearfix">
        <el-form :model="query" inline>
          <el-form-item label="课程">
            <course-select v-model="query.courseId" placeholder="全部课程" width="200px" @change="handleQuery" />
          </el-form-item>
          <el-form-item label="完成状态">
            <el-select v-model="query.finishStatus" clearable placeholder="全部" style="width: 130px">
              <el-option :value="0" label="未开始" />
              <el-option :value="1" label="学习中" />
              <el-option :value="2" label="已学完" />
              <el-option :value="3" label="已通过考试" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
            <el-button @click="resetQuery()">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div class="button_bar">
        <el-button type="primary" @click="openBatch">批量指派</el-button>
      </div>
    </div>

    <el-table v-loading="page.loading" :data="page.list">
      <!-- 原来这两列直接显示 19 位雪花ID，看不出是谁、是哪门课 -->
      <el-table-column label="员工" min-width="160">
        <template #default="scope">
          <span v-if="userMap[scope.row.userId]">
            {{ userMap[scope.row.userId].nickname }}
            <span class="sub">工号 {{ userMap[scope.row.userId].empNo || '-' }}</span>
          </span>
          <span v-else class="sub">用户已删除（{{ scope.row.userId }}）</span>
        </template>
      </el-table-column>
      <el-table-column label="课程" min-width="180">
        <template #default="scope">
          {{ courseMap[scope.row.courseId] || '课程' + scope.row.courseId }}
        </template>
      </el-table-column>
      <el-table-column :width="80" align="center" label="类型">
        <template #default="scope">
          <el-tag :type="scope.row.assignType === 1 ? 'danger' : 'info'" size="small">{{ scope.row.assignType === 1 ? '必修' : '选修' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :width="120" align="center" label="完成期限">
        <template #default="scope">{{ scope.row.deadline ? scope.row.deadline.slice(0, 10) : '—' }}</template>
      </el-table-column>
      <el-table-column :width="110" align="center" label="完成状态">
        <template #default="scope">
          <el-tag :type="{ 0: 'info', 1: 'warning', 2: 'primary', 3: 'success' }[scope.row.finishStatus]" size="small">
            {{ { 0: '未开始', 1: '学习中', 2: '已学完', 3: '已通过考试' }[scope.row.finishStatus] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :width="170" align="center" label="完成时间" prop="finishTime">
        <template #default="scope">{{ scope.row.finishTime || '—' }}</template>
      </el-table-column>
      <el-table-column :width="100" fixed="right" label="操作">
        <template #default="scope">
          <el-button text type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-model:current-page="page.pageCurrent" v-model:page-size="page.pageSize" :total="page.totalCount" @pagination="handlePage" />

    <el-dialog v-model="batchVisible" title="批量指派课程" width="min(640px, 94vw)" :close-on-click-modal="false">
      <el-form :model="batchForm" label-width="90px">
        <el-form-item label="课程" required>
          <course-select v-model="batchForm.courseId" placeholder="请选择课程" width="100%" />
        </el-form-item>
        <el-form-item label="指派给" required>
          <user-picker ref="pickerRef" @change="onPicked" />
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="batchForm.assignType">
            <el-radio :value="1">必修</el-radio>
            <el-radio :value="2">选修</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="完成期限">
          <el-date-picker v-model="batchForm.deadline" format="YYYY-MM-DD" placeholder="选填" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchVisible = false">取消</el-button>
        <el-button :loading="batchLoading" :disabled="!batchForm.courseId || picked.length === 0" type="primary" @click="onBatch">
          指派给 {{ picked.length }} 人
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
  import useTable from '@/utils/table'
  import { onMounted, reactive, ref } from 'vue'
  import { ElMessage } from 'element-plus'
  import { examApi } from '@/api/exam'
  import { usersApi } from '@/api/users'
  import { courseApi } from '@/api/course'
  import Pagination from '@/components/Pagination/index.vue'
  import CourseSelect from '@/components/Selector/CourseSelect/index.vue'
  import UserPicker from './UserPicker.vue'

  const { page, handlePage, handleQuery, query, resetQuery, handleDelete } = useTable({
    page: examApi.assignPage,
    delete: examApi.assignDelete
  })

  // 指派记录里只有 userId/courseId，要显示姓名和课程名得自己建映射
  const userMap = ref({})
  const courseMap = ref({})
  onMounted(async () => {
    const [users, courses] = await Promise.all([usersApi.usersPage({}, 1, 500), courseApi.coursePage({}, 1, 200)])
    const um = {}
    ;(users.list || []).forEach((u) => (um[String(u.id)] = u))
    userMap.value = um
    const cm = {}
    ;(courses.list || []).forEach((c) => (cm[String(c.id)] = c.courseName))
    courseMap.value = cm
  })

  const batchVisible = ref(false)
  const batchLoading = ref(false)
  const pickerRef = ref()
  const picked = ref([])
  const batchForm = reactive({ courseId: null, assignType: 1, deadline: '' })

  function openBatch() {
    batchForm.courseId = null
    batchForm.assignType = 1
    batchForm.deadline = ''
    picked.value = []
    batchVisible.value = true
    // 组件是 destroy-on-close 之外的常驻实例，重开时要手动复位
    setTimeout(() => pickerRef.value && pickerRef.value.reset(), 0)
  }

  function onPicked(list) {
    picked.value = list
  }

  async function onBatch() {
    if (!batchForm.courseId || picked.value.length === 0) {
      ElMessage.error('请选择课程和指派对象')
      return
    }
    batchLoading.value = true
    try {
      const res = await examApi.assignBatch({
        courseId: batchForm.courseId,
        userIds: picked.value.map((u) => u.id),
        assignType: batchForm.assignType,
        deadline: batchForm.deadline || null
      })
      ElMessage.success(res || '指派成功')
      batchVisible.value = false
      handlePage()
    } finally {
      batchLoading.value = false
    }
  }
</script>

<style lang="scss" scoped>
  .sub {
    color: #909399;
    font-size: 12px;
    margin-left: 6px;
  }
</style>
