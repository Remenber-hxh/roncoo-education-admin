<template>
  <div v-loading="loading" class="app-container stat-page">
    <div class="stat-head">
      <el-radio-group v-model="days" @change="load">
        <el-radio-button :label="7">近 7 天</el-radio-button>
        <el-radio-button :label="30">近 30 天</el-radio-button>
        <el-radio-button :label="90">近 90 天</el-radio-button>
      </el-radio-group>
      <el-button :loading="loading" @click="load">刷新</el-button>
    </div>

    <!-- KPI -->
    <el-row :gutter="16" class="kpi-row">
      <el-col :xs="12" :sm="12" :md="6">
        <div class="kpi">
          <div class="kpi-label">在册员工</div>
          <div class="kpi-value">{{ data.employeeCount }}<span class="unit">人</span></div>
          <div class="kpi-sub">其中 {{ data.assignedUserCount }} 人有必修任务</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6">
        <div class="kpi">
          <div class="kpi-label">必修完成率</div>
          <div class="kpi-value" :class="rateClass(requiredRate)">{{ requiredRate }}<span class="unit">%</span></div>
          <div class="kpi-sub">{{ data.requiredDone }} / {{ data.requiredTotal }} 人次</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6">
        <div class="kpi">
          <div class="kpi-label">逾期未完成</div>
          <div class="kpi-value" :class="data.overdueCount > 0 ? 'bad' : 'good'">
            {{ data.overdueCount }}<span class="unit">人次</span>
          </div>
          <div class="kpi-sub">已过截止日期仍未学完</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6">
        <div class="kpi">
          <div class="kpi-label">近 {{ data.days }} 天学习</div>
          <div class="kpi-value">{{ studyValue }}<span class="unit">{{ studyUnit }}</span></div>
          <div class="kpi-sub">{{ data.activeUserCount }} 人有学习记录</div>
        </div>
      </el-col>
    </el-row>

    <el-card class="block">
      <template #header>
        <span>学习时长趋势</span>
        <span class="card-tip">按天统计，无人学习的日期显示为 0</span>
      </template>
      <div v-show="hasStudy" ref="trendRef" class="chart chart-trend" />
      <el-empty v-if="!hasStudy" description="所选区间内还没有学习记录" :image-size="80" />
    </el-card>

    <el-row :gutter="16">
      <el-col :md="12">
        <el-card class="block">
          <template #header>
            <span>各班组必修完成率</span>
          </template>
          <div v-show="hasAssign" ref="teamRef" class="chart chart-group" />
          <el-empty v-if="!hasAssign" description="还没有指派必修课程" :image-size="80" />
        </el-card>
      </el-col>
      <el-col :md="12">
        <el-card class="block">
          <template #header>
            <span>各项目组必修完成率</span>
          </template>
          <div v-show="hasAssign" ref="groupRef" class="chart chart-group" />
          <el-empty v-if="!hasAssign" description="还没有指派必修课程" :image-size="80" />
        </el-card>
      </el-col>
    </el-row>

    <el-card class="block">
      <template #header>
        <span>各课程完成情况</span>
        <span class="card-tip">含必修与选修，完成率低的排在前面</span>
      </template>
      <div v-show="data.courseStats.length" ref="courseRef" class="chart chart-course" />
      <el-empty v-if="!data.courseStats.length" description="还没有指派任何课程" :image-size="80" />
    </el-card>

    <el-card class="block">
      <template #header>
        <span>逾期未完成名单</span>
        <span v-if="data.overdueList.length" class="card-tip">共 {{ data.overdueCount }} 人次，按逾期天数排序</span>
      </template>
      <el-table v-if="data.overdueList.length" :data="data.overdueList" size="small" max-height="420">
        <el-table-column label="工号" prop="empNo" width="80" />
        <el-table-column label="姓名" prop="nickname" width="100" />
        <el-table-column label="班组" width="110">
          <template #default="scope">{{ scope.row.teamName || '—' }}</template>
        </el-table-column>
        <el-table-column label="项目组" width="140">
          <template #default="scope">{{ scope.row.groupName || '—' }}</template>
        </el-table-column>
        <el-table-column label="课程" prop="courseName" min-width="160" show-overflow-tooltip />
        <el-table-column label="截止日期" prop="deadline" width="110" align="center" />
        <el-table-column label="已逾期" width="90" align="center">
          <template #default="scope">
            <el-tag type="danger" size="small">{{ scope.row.overdueDays }} 天</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="当前进度" width="140">
          <template #default="scope">
            <el-progress :percentage="scope.row.progress" :stroke-width="10" />
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="没有逾期未完成的任务" :image-size="80" />
    </el-card>
  </div>
</template>

<script setup>
  import * as echarts from 'echarts'
  import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
  import { learnStatApi } from '@/api/stat'

  const COLOR = {
    finished: '#67c23a',
    learning: '#e6a23c',
    notStarted: '#dcdfe6',
    overdue: '#f56c6c',
    duration: '#409eff'
  }

  const emptyData = () => ({
    days: 30,
    employeeCount: 0,
    assignedUserCount: 0,
    requiredTotal: 0,
    requiredDone: 0,
    overdueCount: 0,
    studySeconds: 0,
    activeUserCount: 0,
    trend: [],
    teamStats: [],
    projectGroupStats: [],
    courseStats: [],
    overdueList: []
  })

  const days = ref(30)
  const loading = ref(false)
  const data = ref(emptyData())

  const trendRef = ref()
  const teamRef = ref()
  const groupRef = ref()
  const courseRef = ref()
  const charts = {}

  const requiredRate = computed(() => {
    const t = data.value.requiredTotal
    return t === 0 ? 0 : Math.round((data.value.requiredDone * 100) / t)
  })

  // 不足一小时的按分钟显示。固定用小时的话，刚上线那阵子累计只有几分钟，
  // 卡片上永远是「0.0 小时」，看着像功能没生效，其实是有人在学的。
  // 后端返回秒也是同一个道理：在后端换算成分钟会把不足半分钟的活动抹成 0
  // 拆成两个 computed 而不是返回 {value, unit}：模板里写 xx.value
  // 会和 ref 的自动解包撞车，渲染时直接报 undefined
  const studyValue = computed(() => {
    const sec = Number(data.value.studySeconds || 0)
    if (sec >= 3600) return (sec / 3600).toFixed(1)
    if (sec >= 60) return Math.round(sec / 60)
    return sec
  })
  const studyUnit = computed(() => {
    const sec = Number(data.value.studySeconds || 0)
    if (sec >= 3600) return '小时'
    if (sec >= 60) return '分钟'
    return '秒'
  })

  const hasStudy = computed(() => data.value.trend.some((t) => Number(t.seconds) > 0))
  const hasAssign = computed(() => data.value.requiredTotal > 0)

  const rateClass = (rate) => {
    if (rate >= 90) return 'good'
    if (rate >= 60) return 'warn'
    return 'bad'
  }

  const load = async () => {
    loading.value = true
    try {
      const res = await learnStatApi.overview(days.value)
      data.value = { ...emptyData(), ...res }
      // 图表容器可能刚从 v-show 里显示出来，此时宽度还是 0，
      // 直接 init 会画出一个 0 宽的图。等 DOM 更新完再画
      await nextTick()
      renderAll()
    } finally {
      loading.value = false
    }
  }

  const use = (key, el) => {
    if (!el) return null
    if (!charts[key]) {
      charts[key] = echarts.init(el)
    }
    return charts[key]
  }

  const renderAll = () => {
    renderTrend()
    renderGroup('team', teamRef.value, data.value.teamStats)
    renderGroup('group', groupRef.value, data.value.projectGroupStats)
    renderCourse()
  }

  const renderTrend = () => {
    const c = use('trend', trendRef.value)
    if (!c) return
    const t = data.value.trend
    c.setOption(
      {
        tooltip: {
          trigger: 'axis',
          formatter: (params) => {
            const p = params[0]
            const minutes = (Number(p.value) / 60).toFixed(1)
            const users = t[p.dataIndex]?.userCount || 0
            return `${p.name}<br/>学习时长 ${minutes} 分钟<br/>学习人数 ${users} 人`
          }
        },
        grid: { left: 50, right: 20, top: 30, bottom: 50 },
        xAxis: {
          type: 'category',
          // 日期只显示 月-日，带年份在 90 天区间会挤成一团
          data: t.map((x) => x.date.slice(5)),
          axisLabel: { rotate: t.length > 40 ? 45 : 0 }
        },
        yAxis: {
          type: 'value',
          name: '分钟',
          axisLabel: { formatter: (v) => (v / 60).toFixed(0) }
        },
        series: [
          {
            name: '学习时长',
            type: 'bar',
            data: t.map((x) => Number(x.seconds)),
            itemStyle: { color: COLOR.duration }
          }
        ]
      },
      true
    )
  }

  const renderGroup = (key, el, list) => {
    const c = use(key, el)
    if (!c) return
    // 只画有必修任务的组。没派任务的组完成率是 0，
    // 但那是「没派」不是「没学」，混在一起会把图读歪
    const rows = (list || []).filter((g) => g.total > 0)
    // 横向条形图从下往上画，反转一次让完成率低的落在最上面
    const items = [...rows].reverse()
    c.setOption(
      {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: (params) => {
            const g = items[params[0].dataIndex]
            return (
              `${g.name}（${g.userCount} 人）<br/>` +
              `完成 ${g.done} / ${g.total} 人次 = ${g.rate}%<br/>` +
              (g.overdue > 0 ? `<span style="color:${COLOR.overdue}">逾期 ${g.overdue} 人次</span>` : '无逾期')
            )
          }
        },
        grid: { left: 90, right: 50, top: 20, bottom: 30 },
        xAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
        yAxis: { type: 'category', data: items.map((g) => g.name) },
        series: [
          {
            type: 'bar',
            data: items.map((g) => ({
              value: g.rate,
              // 有逾期的组标红，一眼能看出该找谁
              itemStyle: { color: g.overdue > 0 ? COLOR.overdue : COLOR.finished }
            })),
            barMaxWidth: 22,
            label: { show: true, position: 'right', formatter: '{c}%' }
          }
        ]
      },
      true
    )
  }

  const renderCourse = () => {
    const c = use('course', courseRef.value)
    if (!c) return
    const rows = data.value.courseStats
    const items = [...rows].reverse()
    c.setOption(
      {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { data: ['已学完', '学习中', '未开始'] },
        grid: { left: 120, right: 40, top: 40, bottom: 30 },
        xAxis: { type: 'value', minInterval: 1 },
        yAxis: {
          type: 'category',
          data: items.map((x) => x.courseName),
          axisLabel: {
            width: 110,
            overflow: 'truncate'
          }
        },
        series: [
          { name: '已学完', type: 'bar', stack: 'total', data: items.map((x) => x.finished), itemStyle: { color: COLOR.finished }, barMaxWidth: 24 },
          { name: '学习中', type: 'bar', stack: 'total', data: items.map((x) => x.learning), itemStyle: { color: COLOR.learning } },
          { name: '未开始', type: 'bar', stack: 'total', data: items.map((x) => x.notStarted), itemStyle: { color: COLOR.notStarted } }
        ]
      },
      true
    )
  }

  // 侧边栏折叠、窗口缩放都会改变容器宽度，不重算的话图会一直是旧宽度
  const onResize = () => {
    Object.values(charts).forEach((c) => c && c.resize())
  }

  onMounted(() => {
    window.addEventListener('resize', onResize)
    load()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', onResize)
    // 不 dispose 的话切走再切回来会重复 init 同一个容器，
    // echarts 会告警且旧实例的事件监听不会被回收
    Object.keys(charts).forEach((k) => {
      charts[k]?.dispose()
      delete charts[k]
    })
  })
</script>

<style lang="scss" scoped>
  .stat-page {
    padding-bottom: 20px;
  }
  .stat-head {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  .kpi-row {
    margin-bottom: 4px;
  }
  .kpi {
    background: #fff;
    border: 1px solid var(--el-border-color-lighter, #ebeef5);
    border-radius: 6px;
    padding: 16px 18px;
    margin-bottom: 16px;
  }
  .kpi-label {
    font-size: 13px;
    color: #909399;
  }
  .kpi-value {
    font-size: 28px;
    font-weight: 600;
    line-height: 1.4;
    color: #303133;
    .unit {
      font-size: 13px;
      font-weight: 400;
      color: #909399;
      margin-left: 4px;
    }
    &.good {
      color: #67c23a;
    }
    &.warn {
      color: #e6a23c;
    }
    &.bad {
      color: #f56c6c;
    }
  }
  .kpi-sub {
    font-size: 12px;
    color: #909399;
  }
  .block {
    margin-bottom: 16px;
  }
  .card-tip {
    margin-left: 10px;
    font-size: 12px;
    color: #909399;
  }
  .chart {
    width: 100%;
  }
  .chart-trend {
    height: 300px;
  }
  .chart-group {
    height: 320px;
  }
  .chart-course {
    height: 340px;
  }
</style>
