/**
 * 小学教师技能
 * 专为小学教育场景设计的 AI 助手技能
 */

export default {
  skill: {
    name: 'teacher',
    description: '小学教师助手 - 用生动有趣的方式讲解知识，适合6-12岁小学生',
    version: '1.0.0',
    author: 'LxzClaw',
    tags: ['education', 'teacher', 'primary-school'],
    dependencies: {},
  },

  /**
   * 个性化教学内容
   * 根据学生年级调整讲解方式
   */
  getPersona: (grade: number = 3): string => {
    const personas: Record<number, string> = {
      1: `你是一年级老师，用最简单的语言和比喻讲解，声音温柔亲切，喜欢用小动物举例。`,
      2: `你是二年级老师，语言简单但开始培养逻辑，用故事来解释概念。`,
      3: `你是三年级老师，开始引入简单知识点，用游戏互动的方式教学。`,
      4: `你是四年级老师，语言更完整，可以讲解稍微复杂的概念，鼓励学生思考。`,
      5: `你是五年级老师，可以讲解较深的内容，引导学生自主学习，培养逻辑思维。`,
      6: `你是六年级老师，准备小升初，语言准确严谨，同时保持趣味性。`,
    };
    return personas[grade] || personas[3];
  },

  /**
   * 知识点讲解
   * 将复杂概念转化为小学生能理解的内容
   */
  explain: async (concept: string, context?: { grade?: number; examples?: string[] }) => {
    const grade = context?.grade || 3;
    const examples = context?.examples || [];
    
    return {
      concept,
      grade,
      teachingMethod: grade <= 2 ? '故事法' : grade <= 4 ? '互动法' : '引导法',
      tips: [
        '用生活中常见的例子解释',
        '多提问让学生思考',
        '适当鼓励和表扬',
        '保持耐心和微笑',
      ],
      examples: examples.length > 0 ? examples : ['小明吃苹果的故事', '小动物分糖果'],
    };
  },

  /**
   * 生成练习题
   */
  generateExercise: (topic: string, grade: number = 3, count: number = 5): string[] => {
    const exercises: string[] = [];
    for (let i = 1; i <= count; i++) {
      exercises.push(`${i}. 关于 ${topic} 的第 ${i} 题`);
    }
    return exercises;
  },

  /**
   * 课堂互动游戏
   */
  createGame: (topic: string, gameType: 'quiz' | 'match' | 'fill'): string => {
    const templates = {
      quiz: `知识问答游戏：老师提问关于 ${topic} 的问题，举手最快的同学回答`,
      match: `连线游戏：将 ${topic} 的概念与对应的例子连线`,
      fill: `填空游戏：补充完整关于 ${topic} 的句子`,
    };
    return templates[gameType];
  },

  async execute(input: unknown) {
    const { action, data } = input as { action: string; data?: unknown };
    
    switch (action) {
      case 'persona':
        return this.getPersona((data as { grade?: number })?.grade || 3);
      case 'explain':
        return this.explain(data as string);
      case 'exercise':
        const { topic, grade, count } = data as { topic: string; grade?: number; count?: number };
        return this.generateExercise(topic, grade, count);
      case 'game':
        return this.createGame((data as { topic: string }).topic, (data as { type?: 'quiz' | 'match' | fill }).type || 'quiz');
      default:
        return { message: '未知操作，请指定 persona/explain/exercise/game' };
    }
  },

  onLoad: async () => {
    console.log('✅ 小学教师技能已加载');
  },

  onUnload: async () => {
    console.log('🅑 小学教师技能已卸载');
  },
};
