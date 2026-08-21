import { deleteRequest, getRequest, postRequest, putRequest, uploadRequest } from '@/utils/request'

export const usersApi = {
  // 讲师分页
  lecturerPage: (params, pageCurrent = 1, pageSize = 20) => {
    return postRequest('/user/admin/lecturer/page', { pageCurrent, pageSize, ...params })
  },
  // 讲师查看
  lecturerView: (data) => {
    return getRequest('/user/admin/lecturer/view?id=' + data.id)
  },
  // 讲师修改
  lecturerEdit: (data) => {
    return putRequest('/user/admin/lecturer/edit', data)
  },
  // 讲师排序
  lecturerSort: (data) => {
    return putRequest('/user/admin/lecturer/sort', data)
  },

  // 讲师保存
  lecturerSave: (data) => {
    return postRequest('/user/admin/lecturer/save', data)
  },

  // 讲师删除
  lecturerDelete: (data) => {
    return deleteRequest('/user/admin/lecturer/delete?id=' + data.id)
  },

  // 用户分页
  usersPage: (params, pageCurrent = 1, pageSize = 20) => {
    return postRequest('/user/admin/users/page', { pageCurrent, pageSize, ...params })
  },

  // 用户修改
  usersEdit: (data) => {
    return putRequest('/user/admin/users/edit', data)
  },

  usersView(data) {
    return getRequest('/user/admin/users/view?id=' + data.id)
  },
  // 用户删除
  usersDelete: (data) => {
    return deleteRequest('/user/admin/users/delete?id=' + data.id)
  },

  // 登录日志
  logLoginPage: (params, pageCurrent = 1, pageSize = 20) => {
    return postRequest('/user/admin/users/log/page', { pageCurrent, pageSize, ...params })
  },

  // 用户课程分页
  userCoursePage: (params, pageCurrent = 1, pageSize = 20) => {
    return postRequest('/course/admin/user/course/page', { pageCurrent, pageSize, ...params })
  },

  // 员工批量导入
  usersImport: (formData) => {
    return uploadRequest('/user/admin/users/import', formData)
  },

  // 员工档案编辑（工号/班组/岗位/入职日期）
  usersProfileEdit: (data) => {
    return putRequest('/user/admin/users/profile/edit', data)
  },

  // 班组分页
  teamPage: (params, pageCurrent = 1, pageSize = 20) => {
    return postRequest('/user/admin/team/page', { pageCurrent, pageSize, ...params })
  },

  // 班组下拉列表（只含启用中的）
  teamList: () => {
    return getRequest('/user/admin/team/list')
  },

  // 班组查看
  teamView: (data) => {
    return getRequest('/user/admin/team/view?id=' + data.id)
  },

  // 班组添加
  teamSave: (data) => {
    return postRequest('/user/admin/team/save', data)
  },

  // 班组修改
  teamEdit: (data) => {
    return putRequest('/user/admin/team/edit', data)
  },

  // 班组删除
  teamDelete: (data) => {
    return deleteRequest('/user/admin/team/delete?id=' + data.id)
  },

  // 项目组分页
  projectGroupPage: (params, pageCurrent = 1, pageSize = 20) => {
    return postRequest('/user/admin/project/group/page', { pageCurrent, pageSize, ...params })
  },

  // 项目组下拉列表（只含启用中的）
  projectGroupList: () => {
    return getRequest('/user/admin/project/group/list')
  },

  // 项目组查看
  projectGroupView: (data) => {
    return getRequest('/user/admin/project/group/view?id=' + data.id)
  },

  // 项目组添加
  projectGroupSave: (data) => {
    return postRequest('/user/admin/project/group/save', data)
  },

  // 项目组修改
  projectGroupEdit: (data) => {
    return putRequest('/user/admin/project/group/edit', data)
  },

  // 项目组删除
  projectGroupDelete: (data) => {
    return deleteRequest('/user/admin/project/group/delete?id=' + data.id)
  }
}
