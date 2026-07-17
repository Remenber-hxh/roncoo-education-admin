<template>
  <div class="app-container">
    <div class="page_head">
      <div class="search_bar clearfix">
        <el-form :model="query" inline>
          <el-form-item label="关键词">
            <el-input v-model="query.keyword" clearable placeholder="试卷名称" style="width: 200px" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
            <el-button @click="resetQuery()">重置</el-button>
            <el-button type="primary" @click="openFormModal()">添加试卷</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
    <el-table v-loading="page.loading" :data="page.list">
      <el-table-column label="试卷名称" min-width="220" prop="paperName" />
      <el-table-column :width="100" align="center" label="课程ID" prop="courseId" />
      <el-table-column :width="70" align="center" label="总分" prop="totalScore" />
      <el-table-column :width="70" align="center" label="及格" prop="passScore" />
      <el-table-column :width="90" align="center" label="时长(分)" prop="durationMinutes" />
      <el-table-column :width="90" align="center" label="补考次数" prop="retakeLimit" />
      <el-table-column :width="90" align="center" label="状态">
        <template #default="scope">
          <el-tag :type="scope.row.statusId === 1 ? 'success' : 'danger'" size="small">{{ scope.row.statusId === 1 ? '正常' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :width="160" fixed="right" label="操作">
        <template #default="scope">
          <el-button text type="primary" @click="openFormModal(scope.row)">编辑</el-button>
          <el-divider direction="vertical" />
          <el-button text type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-model:current-page="page.pageCurrent" v-model:page-size="page.pageSize" :total="page.totalCount" @pagination="handlePage" />
    <paper-form ref="formRef" @refresh="handlePage" />
  </div>
</template>
<script setup>
  import useTable from '@/utils/table'
  import { ref } from 'vue'
  import { examApi } from '@/api/exam'
  import Pagination from '@/components/Pagination/index.vue'
  import PaperForm from './PaperForm.vue'

  const formRef = ref()
  const openFormModal = (item = null) => {
    formRef.value.onOpen(item)
  }

  const { page, handlePage, handleQuery, query, resetQuery, handleDelete } = useTable({
    page: examApi.paperPage,
    delete: examApi.paperDelete
  })
</script>
