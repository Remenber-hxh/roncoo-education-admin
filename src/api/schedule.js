import { getRequest, postRequest } from '@/utils/request'

// 排课配置（二开）。集中维护每门课的推送时机、范围、期限与顺序解锁
export const scheduleApi = {
  // 不分页：这张表的价值就是一屏看完所有课的分发规则
  list: () => {
    return getRequest('/course/admin/schedule/list')
  },

  // 整表提交，只传改动过的行
  save: (items) => {
    return postRequest('/course/admin/schedule/save', { items })
  }
}
