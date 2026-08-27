<template>
  <div class="app-container">
    <div class="page_head">
      <div class="search_bar clearfix">
        <el-form :model="query" inline label-width="80px">
          <el-form-item>
            <el-input v-model="query.mobile" placeholder="请输入手机号码" prefix-icon="Search" clearable @keyup.enter="handleQuery()" />
          </el-form-item>
          <el-form-item>
            <el-input v-model="query.empNo" placeholder="请输入工号" prefix-icon="Search" clearable style="width: 140px" @keyup.enter="handleQuery()" />
          </el-form-item>
          <el-form-item>
            <el-select v-model="query.teamId" placeholder="班组" clearable style="width: 150px">
              <el-option v-for="t in teamList" :key="t.id" :label="t.teamName" :value="t.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="query.projectGroupId" placeholder="项目组" clearable style="width: 180px">
              <el-option v-for="g in groupList" :key="g.id" :label="g.groupName" :value="g.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery()"> 查询</el-button>
            <el-button @click="resetQuery()">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div class="button_bar">
        <el-button v-permission="'user:edit'" type="primary" @click="openImportModal()">批量导入</el-button>
      </div>
    </div>
    <el-table v-loading="page.loading" :data="page.list">
      <!--
        原来 11 列平铺，且 min-width 写的是 30/40/60 这种值——
        Element Plus 把它当像素用，结果「状态」只有 36px、「工号」54px，
        挤成一团。这里把关联信息并列显示，只留真正需要横向对比的字段。
      -->
      <el-table-column label="员工" min-width="200">
        <template #default="scope">
          <div class="cell-user">
            <user-avatar :url="scope.row.userHead" :name="scope.row.nickname" :size="36" />
            <div class="cell-user-text">
              <div class="name">
                {{ scope.row.nickname || '未命名' }}
                <el-tag v-if="scope.row.statusId === 0" size="small" type="danger">已禁用</el-tag>
              </div>
              <div class="sub">
                工号 {{ scope.row.empNo || '—' }}
                <span class="dot">·</span>
                {{ scope.row.mobile }}
              </div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="归属" min-width="170">
        <template #default="scope">
          <div>
            <el-tag v-if="scope.row.teamName" size="small">{{ scope.row.teamName }}</el-tag>
            <el-tag v-else size="small" type="warning">未分班组</el-tag>
          </div>
          <div class="mt4">
            <el-tag v-if="scope.row.projectGroupName" size="small" type="info">{{ scope.row.projectGroupName }}</el-tag>
            <el-tag v-else size="small" type="warning">未分项目组</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="岗位职务" min-width="140" prop="position" show-overflow-tooltip>
        <template #default="scope">{{ scope.row.position || '—' }}</template>
      </el-table-column>
      <el-table-column label="入职日期" width="120" align="center">
        <template #default="scope">{{ scope.row.hireDate || '—' }}</template>
      </el-table-column>
      <el-table-column :width="280" fixed="right" label="操作" prop="address">
        <template #default="scope">
          <el-button v-permission="'user:edit'" text type="primary" @click="openProfileModal(scope.row)">档案</el-button>
          <el-divider direction="vertical" />
          <el-button v-permission="'user:record'" text type="primary" @click="toUserRecord(scope.row, 'order')">数据</el-button>
          <el-divider direction="vertical" />
          <el-dropdown>
            <el-button text type="primary"
              >更多操作
              <el-icon class="el-icon--right">
                <arrow-down />
              </el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>
                  <el-button v-permission="'user:edit'" text type="primary" @click="openFormModal(scope.row)">编辑</el-button>
                </el-dropdown-item>
                <el-dropdown-item @click="handleStatus(scope.row)">
                  <el-button v-if="scope.row.statusId == 0" v-permission="'user:edit'" text type="primary">启用</el-button>
                  <el-button v-if="scope.row.statusId == 1" v-permission="'user:edit'" text type="primary">禁用</el-button>
                </el-dropdown-item>
                <el-dropdown-item>
                  <el-button v-permission="'user:edit'" text type="primary" @click="handleResetPsw(scope.row)">重置密码</el-button>
                </el-dropdown-item>
                <el-dropdown-item divided>
                  <el-button v-permission="'user:delete'" text type="danger" @click="handleDeleteUser(scope.row)">删除</el-button>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-model:current-page="page.pageCurrent" v-model:page-size="page.pageSize" :total="page.totalCount" @pagination="handlePage" />
    <users-form ref="formRef" @refresh="handlePage" />
    <profile-form ref="profileRef" @refresh="handlePage" />
    <import-dialog ref="importRef" @refresh="handlePage" />
  </div>
</template>
<script setup>
  import useTable from '@/utils/table'
  import { onMounted, ref } from 'vue'
  import { usersApi } from '@/api/users'
  import { useRouter } from 'vue-router'
  import { ElMessageBox } from 'element-plus'
  import Pagination from '@/components/Pagination/index.vue'
  import UsersForm from './UsersForm.vue'
  import ProfileForm from './ProfileForm.vue'
  import ImportDialog from './ImportDialog.vue'
  import UserAvatar from '@/components/Avatar/index.vue'

  // 批量导入
  const importRef = ref()
  const openImportModal = () => {
    importRef.value.onOpen()
  }

  // 添加/修改
  const formRef = ref()
  const openFormModal = (item) => {
    formRef.value.onOpen(item)
  }

  // 员工档案
  const profileRef = ref()
  const openProfileModal = (item) => {
    profileRef.value.onOpen(item)
  }

  // 筛选用的两个下拉
  const teamList = ref([])
  const groupList = ref([])
  onMounted(() => {
    usersApi.teamList().then((res) => {
      teamList.value = res || []
    })
    usersApi.projectGroupList().then((res) => {
      groupList.value = res || []
    })
  })

  // 查看数据
  const router = useRouter()
  const toUserRecord = function (row, tabName) {
    router.push({ path: '/users/record', query: { userId: row.id, activeName: tabName } })
  }

  // 基础功能
  const { page, handlePage, query, handleQuery, resetQuery, handleStatus, handleDelete } = useTable({
    page: usersApi.usersPage,
    delete: usersApi.usersDelete,
    status: usersApi.usersEdit
  })

  // 删除是硬删除：只删 users 一行，不动关联数据。
  // 库里有 14 张表挂着 user_id，其中考试成绩、学习时长、协议签署记录
  // 都是培训合规凭证，删了人这些会变成查不到归属的孤儿数据。
  // 所以确认框里点名说清楚删的是谁、会失去什么，并指出「禁用」通常更合适。
  // 姓名等字段来自库里的用户数据，拼进 HTML 前先转义，避免带尖括号的内容破坏弹窗结构
  const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

  // 密码是加盐哈希存的，管理员看不到也找不回，只能重置。
  // 重置成手机号后 6 位，与批量导入建号时的规则一致；
  // 新密码要显示出来，管理员得能转告员工。
  const handleResetPsw = (row) => {
    const who = escapeHtml([row.nickname, row.empNo ? '工号 ' + row.empNo : ''].filter(Boolean).join(' / '))
    ElMessageBox.confirm(`确认重置 <b>${who}</b> 的登录密码？<br/>将重置为其手机号后 6 位。`, '重置密码', {
      type: 'warning',
      dangerouslyUseHTMLString: true,
      cancelButtonText: '取消',
      confirmButtonText: '确认重置'
    }).then(async () => {
      const newPsw = await usersApi.usersResetPsw({ id: row.id })
      ElMessageBox.alert(`新密码：<b style="font-size:18px">${escapeHtml(newPsw)}</b><br/>请转告员工，并提醒其登录后自行修改。`, '重置成功', {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '知道了'
      })
    })
  }

  const handleDeleteUser = (row) => {
    const who = [row.nickname, row.empNo ? '工号 ' + row.empNo : '', row.mobile].filter(Boolean).map(escapeHtml).join(' / ')
    const tip =
      `<div style="line-height:1.7">确认删除 <b>${who}</b> ？<br/>` +
      '<span style="color:#e34d59">该员工的学习记录、考试成绩、协议签署记录会失去归属，且无法恢复。</span><br/>' +
      '若只是员工离职、不希望其再登录，用「禁用」即可，记录会完整保留。</div>'
    handleDelete(row, tip, { dangerouslyUseHTMLString: true, confirmButtonClass: 'el-button--danger' })
  }
</script>

<style lang="scss" scoped>
  // 头像 + 姓名 + 工号/手机号 并成一列，比原来平铺三列省一半横向空间
  .cell-user {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .cell-user-text {
    min-width: 0;

    .name {
      font-weight: 500;
      line-height: 20px;
    }

    .sub {
      color: #909399;
      font-size: 12px;
      line-height: 18px;
    }

    .dot {
      margin: 0 4px;
    }
  }

  .mt4 {
    margin-top: 4px;
  }
</style>
