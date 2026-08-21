import { defineStore } from 'pinia'

const COLLAPSE_KEY = 'admin_sidebar_collapsed'
const TABS_KEY = 'admin_visited_tabs'

/**
 * 界面状态（二开）：侧栏折叠 + 多页签。
 * 两者都落 sessionStorage——刷新页面后还是原样，
 * 但关掉浏览器就重置，不会把上周开的一堆页签带回来。
 */
export const useAppStore = defineStore({
  id: 'app',
  state: () => ({
    sidebarCollapsed: sessionStorage.getItem(COLLAPSE_KEY) === '1',
    // 每项：{ path, title, closable }
    visitedTabs: JSON.parse(sessionStorage.getItem(TABS_KEY) || '[]')
  }),
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
      sessionStorage.setItem(COLLAPSE_KEY, this.sidebarCollapsed ? '1' : '0')
    },

    persistTabs() {
      sessionStorage.setItem(TABS_KEY, JSON.stringify(this.visitedTabs))
    },

    addTab(tab) {
      if (!tab.path || tab.path === '/login') {
        return
      }
      const exist = this.visitedTabs.find((t) => t.path === tab.path)
      if (exist) {
        // 标题可能随数据变化（比如详情页带了名字），每次进来刷新一下
        exist.title = tab.title || exist.title
      } else {
        this.visitedTabs.push({ path: tab.path, title: tab.title || tab.path, closable: tab.closable !== false })
      }
      this.persistTabs()
    },

    removeTab(path) {
      const idx = this.visitedTabs.findIndex((t) => t.path === path)
      if (idx < 0) {
        return null
      }
      this.visitedTabs.splice(idx, 1)
      this.persistTabs()
      // 关掉当前页签后该跳去哪：优先右边，没有就左边
      const next = this.visitedTabs[idx] || this.visitedTabs[idx - 1]
      return next ? next.path : null
    },

    removeOtherTabs(path) {
      this.visitedTabs = this.visitedTabs.filter((t) => t.path === path || t.closable === false)
      this.persistTabs()
    },

    removeAllTabs() {
      this.visitedTabs = this.visitedTabs.filter((t) => t.closable === false)
      this.persistTabs()
      return this.visitedTabs.length ? this.visitedTabs[0].path : null
    },

    clearTabs() {
      this.visitedTabs = []
      sessionStorage.removeItem(TABS_KEY)
    }
  }
})
