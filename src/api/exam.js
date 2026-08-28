import { deleteRequest, getRequest, postRequest, putRequest, uploadRequest } from '@/utils/request'

export const examApi = {
  // ===== 题库 =====
  questionPage: (data) => {
    return postRequest('/course/admin/exam/question/page', data)
  },
  questionSave: (data) => {
    return postRequest('/course/admin/exam/question/save', data)
  },
  questionUpdate: (data) => {
    return putRequest('/course/admin/exam/question/update', data)
  },
  questionDelete: (data) => {
    return deleteRequest('/course/admin/exam/question/delete?id=' + data.id)
  },
  questionView: (id) => {
    return getRequest('/course/admin/exam/question/view?id=' + id)
  },
  // 按章节统计题量：出题时看哪一章还缺题，组卷前判断够不够抽
  questionCountByChapter: (courseId) => {
    return getRequest('/course/admin/exam/question/count/chapter?courseId=' + courseId)
  },
  questionImport: (formData) => {
    return uploadRequest('/course/admin/exam/question/import', formData)
  },

  // ===== 试卷 =====
  paperPage: (data) => {
    return postRequest('/course/admin/exam/paper/page', data)
  },
  paperSave: (data) => {
    return postRequest('/course/admin/exam/paper/save', data)
  },
  paperUpdate: (data) => {
    return putRequest('/course/admin/exam/paper/update', data)
  },
  paperDelete: (data) => {
    return deleteRequest('/course/admin/exam/paper/delete?id=' + data.id)
  },
  paperView: (id) => {
    return getRequest('/course/admin/exam/paper/view?id=' + id)
  },

  // ===== 考试记录 =====
  recordPage: (data) => {
    return postRequest('/course/admin/exam/record/page', data)
  },

  // ===== 课程指派 =====
  assignBatch: (data) => {
    return postRequest('/course/admin/exam/assign/batch', data)
  },
  assignPage: (data) => {
    return postRequest('/course/admin/exam/assign/page', data)
  },
  assignDelete: (data) => {
    return deleteRequest('/course/admin/exam/assign/delete?id=' + data.id)
  }
}
