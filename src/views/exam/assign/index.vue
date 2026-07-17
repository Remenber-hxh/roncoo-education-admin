<template>
  <div class="app-container">
    <div class="page_head">
      <div class="search_bar clearfix">
        <el-form :model="query" inline>
          <el-form-item label="课程ID">
            <el-input v-model="query.courseId" clearable style="width: 160px" @keyup.enter="handleQuery" />
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
            <el-button type="primary" @click="batchVisible = true">批量指派</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
    <el-table v-loading="page.loading" :data="page.list">
      <el-table-column :width="180" align="center" label="用户ID" prop="userId" />
      <el-table-column :width="180" align="center" label="课程ID" prop="courseId" />
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

    <el-dialog v-model="batchVisible" title="批量指派课程" width="520px">
      <el-form :model="batchForm" label-width="90px">
        <el-form-item label="课程ID" required>
          <el-input v-model="batchForm.courseId" placeholder="课程ID" style="width: 240px" />
        </el-form-item>
        <el-form-item label="用户ID" required>
          <el-input v-model="batchForm.userIdsText" :rows="3" placeholder="多个用逗号或换行分隔，如: 1,2,3" type="textarea" />
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="batchForm.assignType">
            <el-radio :label="1">必修</el-radio>
            <el-radio :label="2">选修</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="完成期限">
          <el-date-picker v-model="batchForm.deadline" format="YYYY-MM-DD" placeholder="选填" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchVisible = false">取消</el-button>
        <el-button :loading="batchLoading" type="primary" @click="onBatch">指派</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
  import useTable from '@/utils/table'
  import { reactive, ref } from 'vue'
  import { ElMessage } from 'element-plus'
  import { examApi } from '@/api/exam'
  import Pagination from '@/components/Pagination/index.vue'

  const { page, handlePage, handleQuery, query, resetQuery, handleDelete } = useTable({
    page: examApi.assignPage,
    delete: examApi.assignDelete
  })

  const batchVisible = ref(false)
  const batchLoading = ref(false)
  const batchForm = reactive({ courseId: '', userIdsText: '', assignType: 1, deadline: '' })

  async function onBatch() {
    const userIds = batchForm.userIdsText
      .split(/[,，\n\s]+/)
      .map((s) => s.trim())
      .filter((s) => s)
    if (!batchForm.courseId || userIds.length === 0) {
      ElMessage.error('课程ID和用户ID不能为空')
      return
    }
    batchLoading.value = true
    try {
      const res = await examApi.assignBatch({ courseId: batchForm.courseId, userIds, assignType: batchForm.assignType, deadline: batchForm.deadline || null })
      ElMessage.success(res || '指派成功')
      batchVisible.value = false
      handlePage()
    } finally {
      batchLoading.value = false
    }
  }
</script>
