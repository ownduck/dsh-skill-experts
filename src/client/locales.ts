/** Locale strings for the skill-experts sidebar. */

export const NS = 'skill-experts' as const

export type ExpertsKey =
  | 'panel'
  | 'title'
  | 'loading'
  | 'empty'
  | 'new'
  | 'edit'
  | 'delete'
  | 'save'
  | 'cancel'
  | 'name'
  | 'avatar'
  | 'persona'
  | 'skills'
  | 'skillName'
  | 'skillDescription'
  | 'skillNote'
  | 'skillPrompt'
  | 'skillPath'
  | 'skillFiles'
  | 'addSkill'
  | 'importZip'
  | 'noSkills'
  | 'confirmDelete'
  | 'error'

export const zh: Record<ExpertsKey, string> = {
  panel: '技能专家',
  title: '技能专家',
  loading: '加载中…',
  empty: '暂无专家',
  new: '新建',
  edit: '编辑',
  delete: '删除',
  save: '保存',
  cancel: '取消',
  name: '名称',
  avatar: '头像',
  persona: '人格',
  skills: '技能',
  skillName: '名称',
  skillDescription: '描述',
  skillNote: '简介',
  skillPrompt: '正文',
  skillPath: '路径',
  skillFiles: '其他文件',
  addSkill: '新增技能',
  importZip: '导入 zip',
  noSkills: '暂无技能',
  confirmDelete: '确认删除？',
  error: '操作失败',
}

export const en: Record<ExpertsKey, string> = {
  panel: 'Skill experts',
  title: 'Skill experts',
  loading: 'Loading…',
  empty: 'No experts yet',
  new: 'New',
  edit: 'Edit',
  delete: 'Delete',
  save: 'Save',
  cancel: 'Cancel',
  name: 'Name',
  avatar: 'Avatar',
  persona: 'Persona',
  skills: 'Skills',
  skillName: 'Name',
  skillDescription: 'Description',
  skillNote: 'Note',
  skillPrompt: 'Prompt',
  skillPath: 'Path',
  skillFiles: 'Other files',
  addSkill: 'Add skill',
  importZip: 'Import zip',
  noSkills: 'No skills',
  confirmDelete: 'Delete this item?',
  error: 'Request failed',
}
