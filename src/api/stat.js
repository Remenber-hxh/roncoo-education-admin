import { getRequest, postRequest } from '@/utils/request'

export const learnStatApi = {
  // 学习统计看板。days 为统计区间天数，后端限制在 7~365
  overview: (days) => {
    return getRequest('/course/admin/stat/overview?days=' + days)
  },

  // 批量催办。传 { all: true } 催全部逾期（后端重算，不受名单 100 条上限影响），
  // 或传 { items: [{ userId, courseId }] } 催选中的几条
  remind: (data) => {
    return postRequest('/course/admin/stat/remind', data)
  }
}
