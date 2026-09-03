<template>
  <div class="app-container schedule-page">
    <el-card class="page-card">
      <template #header>
        <div class="head">
          <div>
            <span class="title">排课配置</span>
            <span class="tip">
              新员工入职后，系统每天凌晨按这里的设置自动派课。只对「自动排课生效起点」之后入职的员工生效，存量员工请在「课程指派」里手工派。
            </span>
          </div>
          <div class="head-btns">
            <el-button @click="load">重新加载</el-button>
            <el-button v-if="hasPermission('schedule:save')" type="primary" :loading="saving" :disabled="!dirtyCount" @click="save">
              保存{{ dirtyCount ? `（${dirtyCount} 项改动）` : '' }}
            </el-button>
          </div>
        </div>
      </template>

      <!-- 概览：一眼看出哪些课还没配、哪个班组没分到课 -->
      <div class="summary">
        <el-tag type="info">共 {{ rows.length }} 门课</el-tag>
        <el-tag :type="unconfigured ? 'warning' : 'success'">
          {{ unconfigured ? `${unconfigured} 门未配推送` : '全部已配推送' }}
        </el-tag>
        <el-tag v-if="noPeriod" type="danger">{{ noPeriod }} 门没有已发布课时</el-tag>
        <el-tag v-for="t in teamSummary" :key="t.id" :type="t.count ? 'info' : 'warning'">
          {{ t.name }} {{ t.count }} 门
        </el-tag>
      </div>

      <el-table v-loading="loading" :data="rows" size="small" border max-height="620" :row-class-name="rowClass">
        <el-table-column label="课程" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.courseName }}
            <el-tag v-if="row.isPutaway !== 1" type="info" size="small">未上架</el-tag>
            <el-tag v-if="!row.periodCount" type="danger" size="small">无课时</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="所属模块" width="130" show-overflow-tooltip>
          <template #default="{ row }">{{ row.categoryName || '—' }}</template>
        </el-table-column>

        <el-table-column label="入职第几天" width="130" align="center">
          <template #default="{ row }">
            <!-- 留空 = 不自动推送。用 el-input-number 而不是普通输入框，
                 避免有人填出「第 3.5 天」这种值 -->
            <el-input-number
              v-model="row.pushDay"
              :min="0"
              :max="365"
              :controls="false"
              placeholder="不推送"
              style="width: 100%"
              @change="markDirty(row)"
            />
          </template>
        </el-table-column>

        <el-table-column label="推送范围" width="130" align="center">
          <template #default="{ row }">
            <el-select v-model="row.pushScope" :disabled="row.pushDay === null || row.pushDay === undefined" @change="onScopeChange(row)">
              <el-option label="全员" :value="1" />
              <el-option label="指定班组" :value="2" />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="指定班组" min-width="220">
          <template #default="{ row }">
            <el-select
              v-if="row.pushScope === 2"
              v-model="row.teamIdList"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="请选择班组"
              style="width: 100%"
              @change="markDirty(row)"
            >
              <el-option v-for="t in teamOptions" :key="t.id" :label="t.teamName" :value="String(t.id)" />
            </el-select>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>

        <el-table-column label="完成期限" width="110" align="center">
          <template #default="{ row }">
            <el-input-number
              v-model="row.deadlineDays"
              :min="1"
              :max="365"
              :controls="false"
              style="width: 100%"
              @change="markDirty(row)"
            />
          </template>
        </el-table-column>

        <el-table-column label="闯关" width="80" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.needSequential" :active-value="1" :inactive-value="0" @change="markDirty(row)" />
          </template>
        </el-table-column>
      </el-table>

      <p class="foot-tip">
        「闯关」开启后，员工必须学完上一课时才能进入下一课时，跨章节同样连续。
        未配推送天数的课程排在最后，它们不会自动派出去，只能手工指派。
      </p>
    </el-card>
  </div>
</template>

<script setup>
  import { computed, onMounted, ref } from 'vue'
  import { ElMessage } from 'element-plus'
  import { scheduleApi } from '@/api/schedule'
  import { usersApi } from '@/api/users'
  import { hasPermission } from '@/utils/permission.js'

  const loading = ref(false)
  const saving = ref(false)
  const rows = ref([])
  const teamOptions = ref([])
  // 改动过的课程 ID。只提交这些行，避免把没动过的几十行也写一遍
  const dirty = ref(new Set())

  const dirtyCount = computed(() => dirty.value.size)
  const unconfigured = computed(() => rows.value.filter((r) => r.pushDay === null || r.pushDay === undefined).length)
  const noPeriod = computed(() => rows.value.filter((r) => !r.periodCount).length)

  // 每个班组被分到几门课。班组列在这里的意义是：
  // 哪个班组一门课都没有，散在几十个编辑页里根本发现不了
  const teamSummary = computed(() =>
    teamOptions.value.map((t) => ({
      id: t.id,
      name: t.teamName,
      count: rows.value.filter(
        (r) => r.pushDay !== null && r.pushDay !== undefined &&
          (r.pushScope === 1 || (r.pushScope === 2 && (r.teamIdList || []).includes(String(t.id))))
      ).length
    }))
  )

  const markDirty = (row) => dirty.value.add(row.courseId)

  const onScopeChange = (row) => {
    // 切回「全员」时清掉已选班组，否则再切回来会带出上次的选择
    if (row.pushScope !== 2) row.teamIdList = []
    markDirty(row)
  }

  const rowClass = ({ row }) => {
    if (!row.periodCount) return 'row-warn'
    if (row.pushDay === null || row.pushDay === undefined) return 'row-muted'
    return ''
  }

  const load = async () => {
    loading.value = true
    try {
      const [list, teams] = await Promise.all([scheduleApi.list(), usersApi.teamList()])
      teamOptions.value = teams || []
      rows.value = (list || []).map((r) => ({
        ...r,
        // 后端存逗号分隔的字符串，表格里用数组。
        // 班组 ID 是雪花号、按字符串下发，统一转字符串否则选项匹配不上
        teamIdList: r.pushTeamIds ? String(r.pushTeamIds).split(',').filter(Boolean).map(String) : []
      }))
      dirty.value = new Set()
    } finally {
      loading.value = false
    }
  }

  const save = async () => {
    const items = rows.value
      .filter((r) => dirty.value.has(r.courseId))
      .map((r) => ({
        courseId: r.courseId,
        pushDay: r.pushDay === undefined ? null : r.pushDay,
        pushScope: r.pushScope,
        pushTeamIds: r.pushScope === 2 ? (r.teamIdList || []).join(',') : '',
        deadlineDays: r.deadlineDays,
        needSequential: r.needSequential
      }))
    if (!items.length) return

    // 配了「指定班组」却没选班组的，派不出去任何人，保存前先拦住
    const bad = rows.value.filter(
      (r) => dirty.value.has(r.courseId) && r.pushDay !== null && r.pushDay !== undefined &&
        r.pushScope === 2 && !(r.teamIdList || []).length
    )
    if (bad.length) {
      ElMessage.warning(`「${bad[0].courseName}」选了指定班组但没选具体班组，不会推给任何人`)
      return
    }

    saving.value = true
    try {
      const msg = await scheduleApi.save(items)
      ElMessage.success(msg || '保存成功')
      dirty.value = new Set()
    } finally {
      saving.value = false
    }
  }

  onMounted(load)
</script>

<style lang="scss" scoped>
  .head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    flex-wrap: wrap;
  }

  .title {
    font-size: 16px;
    font-weight: 600;
    margin-right: 10px;
  }

  .tip {
    font-size: 12px;
    color: var(--t-text-weak);
  }

  .head-btns {
    flex: none;
  }

  .summary {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }

  .muted {
    color: var(--t-text-weak);
  }

  .foot-tip {
    margin: 12px 0 0;
    font-size: 12px;
    color: var(--t-text-weak);
    line-height: 1.8;
  }

  // 没有已发布课时的课程标红：派出去员工也学不了
  :deep(.row-warn) {
    background: #fef0f0;
  }

  // 未配推送的压暗，它们排在表格最后，正好是待办清单
  :deep(.row-muted) {
    color: var(--t-text-weak);
  }
</style>
