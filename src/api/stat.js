import { getRequest } from '@/utils/request'

export const learnStatApi = {
  // 学习统计看板。days 为统计区间天数，后端限制在 7~365
  overview: (days) => {
    return getRequest('/course/admin/stat/overview?days=' + days)
  }
}
