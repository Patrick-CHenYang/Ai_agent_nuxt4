import type { Skill } from '../skills/baseSkill';
import { webSearchSkill } from '../skills/webSearchSkill';

// 技能存储
let skills: Map<string, Skill> = new Map();

// 初始化技能
function initSkills() {
  skills.set('webSearch', webSearchSkill);
  // 注册更多skill
}

// 注册技能
export function registerSkill(skill: Skill) {
  skills.set(skill.name, skill);
}

// 获取技能
export function getSkill(name: string): Skill | undefined {
  return skills.get(name);
}

// 获取所有技能
export function getAllSkills(): Skill[] {
  return Array.from(skills.values());
}

// 初始化技能
initSkills();

// 导出所有函数
export const skillService = {
  registerSkill,
  getSkill,
  getAllSkills
};
