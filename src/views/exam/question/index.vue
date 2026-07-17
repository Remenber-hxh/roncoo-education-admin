<template>
  <div class="app-container">
    <div class="page_head">
      <div class="search_bar clearfix">
        <el-form :model="query" inline>
          <el-form-item label="题型">
            <el-select v-model="query.questionType" clearable placeholder="全部" style="width: 120px">
              <el-option :value="1" label="单选" />
              <el-option :value="2" label="多选" />
              <el-option :value="3" label="判断" />
            </el-select>
          </el-form-item>
          <el-form-item label="关键词">
            <el-input v-model="query.keyword" clearable placeholder="题干关键词" style="width: 200px" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
            <el-button @click="resetQuery()">重置</el-button>
            <el-button type="primary" @click="openFormModal()">添加题目</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
    <el-table v-loading="page.loading" :data="page.list">
      <el-table-column label="题干" min-width="300" prop="questionTitle" show-overflow-tooltip />
      <el-table-column :width="80" align="center" label="题型">
        <template #default="scope">
          <el-tag size="small">{{ { 1: '单选', 2: '多选', 3: '判断' }[scope.row.questionType] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :width="100" align="center" label="正确答案" prop="correctAnswer" />
      <el-table-column :width="80" align="center" label="难度">
        <template #default="scope">{{ { 1: '易', 2: '中', 3: '难' }[scope.row.difficulty] || '易' }}</template>
      </el-table-column>
      <el-table-column :width="90" align="center" label="状态">
        <template #default="scope">
          <el-tag :type="scope.row.statusId === 1 ? 'success' : 'danger'" size="small">{{ scope.row.statusId === 1 ? '正常' : '禁用' }}</el-tag>
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
    <question-form ref="formRef" @refresh="handlePage" />
  </div>
</template>
<script setup>
  import useTable from '@/utils/table'
  import { ref } from 'vue'
  import { examApi } from '@/api/exam'
  import Pagination from '@/components/Pagination/index.vue'
  import QuestionForm from './QuestionForm.vue'

  const formRef = ref()
  const openFormModal = (item = null) => {
    formRef.value.onOpen(item)
  }

  const { page, handlePage, handleQuery, query, resetQuery, handleDelete } = useTable({
    page: examApi.questionPage,
    delete: examApi.questionDelete
  })
</script>
