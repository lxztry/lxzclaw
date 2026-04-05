/**
 * 多学科教师技能
 * 专为小学教育场景设计的 AI 助手技能，支持不同学科
 */

export default {
  skill: {
    name: 'teacher',
    description: '小学教师助手 - 支持多学科，用生动有趣的方式讲解知识',
    version: '1.1.0',
    author: 'LxzClaw',
    tags: ['education', 'teacher', 'primary-school'],
    dependencies: {},
  },

  /**
   * 学科角色定义
   */
  subjects: {
    chinese: {
      name: '语文老师',
      persona: (grade: number) => `你是一位小学${grade}年级语文老师，语言优美生动，喜欢用成语故事、诗词歌赋引导学生感受中文之美。讲解时要声情并茂，善于引导学生对文字产生兴趣。`,
      features: ['生字教学', '阅读理解', '作文指导', '诗词背诵'],
      tips: ['多举例说明', '引导想象', '鼓励表达', '培养语感'],
    },
    math: {
      name: '数学老师',
      persona: (grade: number) => `你是一位小学${grade}年级数学老师，逻辑清晰，善于用生活化的例子解释数学概念。喜欢用游戏、实物演示让数学变得有趣。`,
      features: ['计算训练', '应用题讲解', '图形认识', '逻辑思维'],
      tips: ['循序渐进', '多练多思', '联系生活', '鼓励尝试'],
    },
    english: {
      name: '英语老师',
      persona: (grade: number) => `你是一位小学${grade}年级英语老师，发音标准，富有活力。喜欢用歌曲、游戏、角色扮演让英语学习变得轻松有趣。`,
      features: ['单词记忆', '口语练习', '简单对话', '儿歌教学'],
      tips: ['多听多说', '游戏互动', '情境模拟', '鼓励开口'],
    },
    science: {
      name: '科学老师',
      persona: (grade: number) => `你是一位小学${grade}年级科学老师，好奇心强，喜欢做实验、观察自然。引导学生在实践中发现科学的奥秘。`,
      features: ['自然认知', '简单实验', '植物观察', '天气知识'],
      tips: ['动手实践', '观察探索', '安全第一', '记录发现'],
    },
    music: {
      name: '音乐老师',
      persona: (grade: number) => `你是一位小学${grade}年级音乐老师，活泼开朗，多才多艺。喜欢用音乐、节奏、律动让学生感受音乐的魅力。`,
      features: ['歌曲学唱', '节奏练习', '简单乐器', '音乐欣赏'],
      tips: ['多听多唱', '节奏游戏', '鼓励表现', '培养兴趣'],
    },
    art: {
      name: '美术老师',
      persona: (grade: number) => `你是一位小学${grade}年级美术老师，想象力丰富，善于启发创意。喜欢用各种材料和方式让学生感受创造的乐趣。`,
      features: ['绘画基础', '手工制作', '色彩认识', '创意表达'],
      tips: ['自由创作', '鼓励想象', '材料多样', '肯定创意'],
    },
    pe: {
      name: '体育老师',
      persona: (grade: number) => `你是一位小学${grade}年级体育老师，体魄强健，富有活力。喜欢通过游戏、比赛培养学生的运动兴趣和团队精神。`,
      features: ['基本动作', '游戏活动', '简单规则', '体能训练'],
      tips: ['安全第一', '循序渐进', '团队合作', '享受运动'],
    },
  },

  /**
   * 获取学科角色
   */
  getSubjectPersona: (subject: string, grade: number = 3): string => {
    const subjects = this.subjects;
    const target = subjects[subject as keyof typeof subjects];
    if (!target) {
      return `你是一位小学${grade}年级老师，用生动有趣的方式教学。`;
    }
    return target.persona(grade);
  },

  /**
   * 获取学科信息
   */
  getSubjectInfo: (subject: string) => {
    const subjects = this.subjects;
    return subjects[subject as keyof typeof subjects] || null;
  },

  /**
   * 列出所有学科
   */
  listSubjects: (): string[] => {
    return Object.keys(this.subjects);
  },

  /**
   * 知识点讲解
   */
  explain: (subject: string, concept: string, grade: number = 3) => {
    const subjectInfo = this.getSubjectInfo(subject);
    return {
      subject: subjectInfo?.name || '通用',
      concept,
      grade,
      teachingMethod: grade <= 2 ? '故事法/游戏法' : grade <= 4 ? '互动法/演示法' : '引导法/实践法',
      features: subjectInfo?.features || [],
      tips: subjectInfo?.tips || [],
    };
  },

  /**
   * 生成练习题
   */
  generateExercise: (subject: string, topic: string, grade: number = 3, count: number = 5): string[] => {
    const exercises: string[] = [];
    for (let i = 1; i <= count; i++) {
      exercises.push(`${i}. ${topic} - 第${i}题`);
    }
    return exercises;
  },

  /**
   * 课堂活动建议
   */
  suggestActivity: (subject: string, duration: number = 30): string => {
    const activities: Record<string, string[]> = {
      chinese: ['成语接龙', '朗读比赛', '角色扮演', '续写故事'],
      math: ['口算比赛', '数学游戏', '实物计数', '图形拼搭'],
      english: ['单词卡片游戏', '情景对话', '歌曲学唱', '看图说话'],
      science: ['小实验', '观察记录', '科学小制作', '户外观察'],
      music: ['节奏游戏', '歌曲学唱', '简单打击乐', '音乐欣赏'],
      art: ['绘画创作', '手工制作', '剪纸活动', '色彩游戏'],
      pe: ['体育游戏', '跳绳练习', '简单球类', '体能训练'],
    };
    const subjectActivities = activities[subject] || ['互动教学'];
    const randomActivity = subjectActivities[Math.floor(Math.random() * subjectActivities.length)];
    return `建议活动：${randomActivity} (约${duration}分钟)`;
  },

  async execute(input: unknown) {
    const { action, data } = input as { action: string; data?: unknown };
    const d = data as Record<string, unknown>;

    switch (action) {
      case 'persona':
        return this.getSubjectPersona((d.subject as string) || 'chinese', (d.grade as number) || 3);
      case 'info':
        return this.getSubjectInfo(d.subject as string);
      case 'list':
        return this.listSubjects();
      case 'explain':
        return this.explain(d.subject as string, d.concept as string, d.grade as number);
      case 'exercise':
        return this.generateExercise(d.subject as string, d.topic as string, d.grade as number, d.count as number);
      case 'activity':
        return this.suggestActivity(d.subject as string, d.duration as number);
      default:
        return { message: '未知操作', available: ['persona', 'info', 'list', 'explain', 'exercise', 'activity'] };
    }
  },

  onLoad: async () => {
    console.log('✅ 多学科教师技能已加载');
    console.log('📚 支持学科:', this.listSubjects().join(', '));
  },

  onUnload: async () => {
    console.log('🅑 多学科教师技能已卸载');
  },
};
