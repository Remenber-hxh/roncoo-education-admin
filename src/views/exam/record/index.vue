<template>
  <div class="app-container">
    <div class="page_head">
      <div class="search_bar clearfix">
        <el-form :model="query" inline>
          <el-form-item label="用户ID">
            <el-input v-model="query.userId" clearable style="width: 160px" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="结果">
            <el-select v-model="query.isPass" clearable placeholder="全部" style="width: 110px">
              <el-option :value="1" label="通过" />
              <el-option :value="0" label="未过" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
            <el-button @click="resetQuery()">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
    <el-table v-loading="page.loading" :data="page.list">
      <el-table-column :width="180" align="center" label="用户ID" prop="userId" />
      <el-table-column :width="180" align="center" label="试卷ID" prop="paperId" />
      <el-table-column :width="80" align="center" label="场次">
        <template #default="scope">{{ scope.row.attemptNo === 1 ? '正考' : '补考' + (scope.row.attemptNo - 1) }}</template>
      </el-table-column>
      <el-table-column :width="80" align="center" label="得分">
        <template #default="scope">{{ scope.row.score == null ? '—' : scope.row.score }}</template>
      </el-table-column>
      <el-table-column :width="90" align="center" label="结果">
        <template #default="scope">
          <el-tag v-if="scope.row.examStatus === 1" size="small" type="warning">进行中</el-tag>
          <el-tag v-else :type="scope.row.isPass === 1 ? 'success' : 'danger'" size="small">{{ scope.row.isPass === 1 ? '通过' : '未过' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :width="90" align="center" label="交卷方式">
        <template #default="scope">{{ { 1: '—', 2: '正常', 3: '超时' }[scope.row.examStatus] }}</template>
      </el-table-column>
      <el-table-column :width="170" align="center" label="开考时间" prop="startTime" />
      <el-table-column :width="170" align="center" label="交卷时间">
        <template #default="scope">{{ scope.row.submitTime || '—' }}</template>
      </el-table-column>
    </el-table>
    <pagination v-model:current-page="page.pageCurrent" v-model:page-size="page.pageSize" :total="page.totalCount" @pagination="handlePage" />
  </div>
</template>
<script setup>
  import useTable from '@/utils/table'
  import { examApi } from '@/api/exam'
  import Pagination from '@/components/Pagination/index.vue'

  const { page, handlePage, handleQuery, query, resetQuery } = useTable({
    page: examApi.recordPage
  })
</script>
