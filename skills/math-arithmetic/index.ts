/**
 * 小学数学 - 算术专项技能
 * 支持：整数运算、分数、小数、四则运算、口算训练
 */

export default {
  skill: {
    name: 'math-arithmetic',
    description: '小学数学算术专项 - 整数、分数、小数运算，循序渐进的计算训练',
    version: '1.0.0',
    author: 'LxzClaw',
    tags: ['education', 'math', 'arithmetic', 'primary-school'],
    dependencies: {},
  },

  /**
   * 年级知识点映射
   */
  gradeContent: {
    1: {
      topics: ['10以内加减法', '20以内加减法', '认识数字0-20', '比大小', '序数'],
      difficulty: '游戏化、生活化、用手指和实物辅助',
    },
    2: {
      topics: ['100以内加减法', '乘法初步（2-5的乘法口诀）', '除法初步', '认识人民币', '认识时间'],
      difficulty: '游戏闯关、多练习、及时鼓励',
    },
    3: {
      topics: ['万以内加减法', '6-9乘法口诀', '有余数除法', '分数初步', '测量单位'],
      difficulty: '理解算理、多做题、联系生活',
    },
    4: {
      topics: ['大数读写', '三位数乘两位数', '除数是两位数的除法', '小数初步', '运算定律'],
      difficulty: '规范书写、验算习惯、错题整理',
    },
    5: {
      topics: ['小数加减乘除', '分数加减法', '体积容积', '复式统计图', '因数倍数'],
      difficulty: '综合运用、数学思想、举一反三',
    },
    6: {
      topics: ['分数乘除法', '百分数', '比例', '圆柱圆锥', '总复习综合'],
      difficulty: '系统梳理、查漏补缺、综合应用',
    },
  },

  /**
   * 计算类型定义
   */
  operationTypes: {
    addition: { symbol: '+', name: '加法', keywords: ['一共', '增加', '合计', '比...多'] },
    subtraction: { symbol: '-', name: '减法', keywords: ['还剩', '减少', '相差', '比...少'] },
    multiplication: { symbol: '×', name: '乘法', keywords: ['总共', '几倍', '每...', '份'] },
    division: { symbol: '÷', name: '除法', keywords: ['平均', '每份', '包含', '几分之一'] },
  },

  /**
   * 生成口算题
   */
  generateOralMath: (operation: string, grade: number, count: number = 10) => {
    const exercises: string[] = [];
    const ops = ['addition', 'subtraction', 'multiplication', 'division'];
    const selectedOps = operation === 'mixed' ? ops : [operation];

    for (let i = 0; i < count; i++) {
      const op = selectedOps[Math.floor(Math.random() * selectedOps.length)];
      const opInfo = {
        addition: () => {
          const max = grade <= 1 ? 20 : grade <= 2 ? 100 : grade <= 3 ? 1000 : 10000;
          const a = Math.floor(Math.random() * max) + 1;
          const b = Math.floor(Math.random() * Math.min(max, a * 2)) + 1;
          return `${a} + ${b} = ?`;
        },
        subtraction: () => {
          const max = grade <= 1 ? 20 : grade <= 2 ? 100 : grade <= 3 ? 1000 : 10000;
          const b = Math.floor(Math.random() * max) + 1;
          const a = b + Math.floor(Math.random() * Math.min(max, 20)) + 1;
          return `${a} - ${b} = ?`;
        },
        multiplication: () => {
          const max = grade <= 2 ? 5 : grade <= 3 ? 9 : 12;
          const a = Math.floor(Math.random() * max) + 2;
          const b = Math.floor(Math.random() * 9) + 2;
          return `${a} × ${b} = ?`;
        },
        division: () => {
          const max = grade <= 2 ? 5 : grade <= 3 ? 9 : 12;
          const b = Math.floor(Math.random() * max) + 2;
          const quotient = Math.floor(Math.random() * 9) + 2;
          const a = b * quotient;
          return `${a} ÷ ${b} = ?`;
        },
      };
      exercises.push(`${i + 1}. ${opInfo[op as keyof typeof opInfo]()}`);
    }
    return exercises;
  },

  /**
   * 生成分数运算题
   */
  generateFractionProblems: (operation: 'addition' | 'subtraction' | 'multiplication' | 'division', grade: number, count: number = 5) => {
    const exercises: string[] = [];
    for (let i = 0; i < count; i++) {
      const denominators = grade >= 6 ? [2, 3, 4, 5, 6, 8, 10, 12] : [2, 3, 4, 5, 6, 8];
      const d1 = denominators[Math.floor(Math.random() * denominators.length)];
      const d2 = denominators[Math.floor(Math.random() * denominators.length)];
      const n1 = Math.floor(Math.random() * (d1 - 1)) + 1;
      const n2 = Math.floor(Math.random() * (d2 - 1)) + 1;
      const opSymbol = { addition: '+', subtraction: '-', multiplication: '×', division: '÷' }[operation];

      if (operation === 'division') {
        exercises.push(`${i + 1}. ${n1}/${d1} ${opSymbol} ${n2}/${d2} = ?`);
      } else {
        exercises.push(`${i + 1}. ${n1}/${d1} ${opSymbol} ${n2}/${d2} = ?`);
      }
    }
    return exercises;
  },

  /**
   * 生成小数运算题
   */
  generateDecimalProblems: (operation: string, grade: number, count: number = 5) => {
    const exercises: string[] = [];
    const decimalPlaces = grade <= 4 ? 1 : 2;
    const ops = operation === 'mixed' ? ['+', '-', '×', '÷'] : [operation];

    for (let i = 0; i < count; i++) {
      const op = ops[Math.floor(Math.random() * ops.length)];
      const max = grade <= 4 ? 100 : 1000;
      const a = Math.round(Math.random() * max * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
      const b = Math.round(Math.random() * Math.min(max, a) * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
      exercises.push(`${i + 1}. ${a} ${op} ${b} = ?`);
    }
    return exercises;
  },

  /**
   * 解释算理
   */
  explainArithmetic: (operation: string, a: number, b: number) => {
    const explanations: Record<string, string> = {
      addition: `计算 ${a} + ${b}：可以这样想：先算 ${a}，再加上 ${b}。也可以用凑十法：把 ${b} 拆成和 ${a} 凑成10的部分加上剩余部分。`,
      subtraction: `计算 ${a} - ${b}：可以这样想：从 ${a} 里去掉 ${b}。如果 ${b} 接近 ${a}，可以用 ${a} 减去一个比 ${b} 稍大的数，再加上多减的部分。`,
      multiplication: `计算 ${a} × ${b}：可以理解为 ${a} 个 ${b} 相加，或者 ${b} 个 ${a} 相加。也可以用分配律：${a} × ${b} = ${a} × (${b - 1}) + ${a}。`,
      division: `计算 ${a} ÷ ${b}：可以这样想：${a} 里面有几个 ${b}。也可以用乘法逆运算：想 ${b} × ? = ${a}。`,
    };
    return explanations[operation] || '请选择正确的运算类型';
  },

  /**
   * 获取知识点
   */
  getTopics: (grade: number) => {
    const content = gradeContent[grade as keyof typeof gradeContent] || gradeContent[3];
    return content.topics;
  },

  /**
   * 获取教学建议
   */
  getTeachingTips: (grade: number) => {
    const content = gradeContent[grade as keyof typeof gradeContent] || gradeContent[3];
    return {
      topics: content.topics,
      difficulty: content.difficulty,
      tips: [
        '理解算理比机械计算更重要',
        '每天坚持10-15分钟口算训练',
        '建立错题本，定期回顾',
        '用生活实例帮助理解',
        '适时引入游戏化学习',
      ],
    };
  },

  /**
   * 四则运算混合练习
   */
  generateMixedProblems: (grade: number, count: number = 10) => {
    const operations = ['addition', 'subtraction', 'multiplication', 'division'];
    const problems: { problem: string; answer: number; type: string }[] = [];

    for (let i = 0; i < count; i++) {
      const op = operations[Math.floor(Math.random() * operations.length)];
      const max = grade <= 2 ? 20 : grade <= 3 ? 50 : grade <= 4 ? 100 : 500;
      let problem = '';
      let answer = 0;

      if (op === 'addition') {
        const a = Math.floor(Math.random() * max) + 1;
        const b = Math.floor(Math.random() * max) + 1;
        problem = `${a} + ${b}`;
        answer = a + b;
      } else if (op === 'subtraction') {
        const b = Math.floor(Math.random() * Math.min(max, 50)) + 1;
        const a = b + Math.floor(Math.random() * Math.min(max, 50)) + 1;
        problem = `${a} - ${b}`;
        answer = a - b;
      } else if (op === 'multiplication') {
        const multMax = grade <= 2 ? 5 : grade <= 3 ? 9 : 12;
        const a = Math.floor(Math.random() * multMax) + 2;
        const b = Math.floor(Math.random() * 9) + 2;
        problem = `${a} × ${b}`;
        answer = a * b;
      } else {
        const multMax = grade <= 2 ? 5 : grade <= 3 ? 9 : 12;
        const b = Math.floor(Math.random() * multMax) + 2;
        const quotient = Math.floor(Math.random() * 9) + 2;
        const a = b * quotient;
        problem = `${a} ÷ ${b}`;
        answer = quotient;
      }

      problems.push({
        problem: `${i + 1}. ${problem} = ?`,
        answer,
        type: op,
      });
    }
    return problems;
  },

  async execute(input: unknown) {
    const { action, data } = input as { action: string; data?: Record<string, unknown> };
    const d = data || {};

    switch (action) {
      case 'oral':
        return { exercises: generateOralMath(d.operation as string || 'mixed', d.grade as number || 3, d.count as number || 10) };

      case 'fraction':
        return { exercises: generateFractionProblems(d.operation as 'addition' | 'subtraction' | 'multiplication' | 'division' || 'addition', d.grade as number || 5, d.count as number || 5) };

      case 'decimal':
        return { exercises: generateDecimalProblems(d.operation as string || 'mixed', d.grade as number || 4, d.count as number || 5) };

      case 'explain':
        return { explanation: explainArithmetic(d.operation as string, d.a as number, d.b as number) };

      case 'topics':
        return getTopics(d.grade as number || 3);

      case 'tips':
        return getTeachingTips(d.grade as number || 3);

      case 'mixed':
        return { problems: generateMixedProblems(d.grade as number || 3, d.count as number || 10) };

      default:
        return {
          message: '算术技能支持以下操作：',
          actions: ['oral', 'fraction', 'decimal', 'explain', 'topics', 'tips', 'mixed'],
          examples: {
            oral: '{ action: "oral", data: { operation: "addition", grade: 3, count: 10 } }',
            fraction: '{ action: "fraction", data: { operation: "addition", grade: 5, count: 5 } }',
            explain: '{ action: "explain", data: { operation: "addition", a: 23, b: 45 } }',
          },
        };
    }
  },

  onLoad: async () => {
    console.log('✅ 小学数学-算术技能已加载');
    console.log('📐 支持：口算训练 | 分数运算 | 小数运算 | 四则混合 | 算理讲解');
  },

  onUnload: async () => {
    console.log('🅑 小学数学-算术技能已卸载');
  },
};

// Helper functions need to be defined before use
function generateOralMath(operation: string, grade: number, count: number): string[] {
  const exercises: string[] = [];
  const ops = ['addition', 'subtraction', 'multiplication', 'division'];
  const selectedOps = operation === 'mixed' ? ops : [operation];

  for (let i = 0; i < count; i++) {
    const op = selectedOps[Math.floor(Math.random() * selectedOps.length)];

    if (op === 'addition') {
      const max = grade <= 1 ? 20 : grade <= 2 ? 100 : grade <= 3 ? 1000 : 10000;
      const a = Math.floor(Math.random() * max) + 1;
      const b = Math.floor(Math.random() * Math.min(max, a * 2)) + 1;
      exercises.push(`${i + 1}. ${a} + ${b} = ?`);
    } else if (op === 'subtraction') {
      const max = grade <= 1 ? 20 : grade <= 2 ? 100 : grade <= 3 ? 1000 : 10000;
      const b = Math.floor(Math.random() * max) + 1;
      const a = b + Math.floor(Math.random() * Math.min(max, 20)) + 1;
      exercises.push(`${i + 1}. ${a} - ${b} = ?`);
    } else if (op === 'multiplication') {
      const max = grade <= 2 ? 5 : grade <= 3 ? 9 : 12;
      const a = Math.floor(Math.random() * max) + 2;
      const b = Math.floor(Math.random() * 9) + 2;
      exercises.push(`${i + 1}. ${a} × ${b} = ?`);
    } else {
      const max = grade <= 2 ? 5 : grade <= 3 ? 9 : 12;
      const b = Math.floor(Math.random() * max) + 2;
      const quotient = Math.floor(Math.random() * 9) + 2;
      const a = b * quotient;
      exercises.push(`${i + 1}. ${a} ÷ ${b} = ?`);
    }
  }
  return exercises;
}

function generateFractionProblems(operation: 'addition' | 'subtraction' | 'multiplication' | 'division', grade: number, count: number): string[] {
  const exercises: string[] = [];
  const denominators = grade >= 6 ? [2, 3, 4, 5, 6, 8, 10, 12] : [2, 3, 4, 5, 6, 8];

  for (let i = 0; i < count; i++) {
    const d1 = denominators[Math.floor(Math.random() * denominators.length)];
    const d2 = denominators[Math.floor(Math.random() * denominators.length)];
    const n1 = Math.floor(Math.random() * (d1 - 1)) + 1;
    const n2 = Math.floor(Math.random() * (d2 - 1)) + 1;
    const opSymbol = { addition: '+', subtraction: '-', multiplication: '×', division: '÷' }[operation];
    exercises.push(`${i + 1}. ${n1}/${d1} ${opSymbol} ${n2}/${d2} = ?`);
  }
  return exercises;
}

function generateDecimalProblems(operation: string, grade: number, count: number): string[] {
  const exercises: string[] = [];
  const decimalPlaces = grade <= 4 ? 1 : 2;
  const ops = operation === 'mixed' ? ['+', '-', '×', '÷'] : [operation];

  for (let i = 0; i < count; i++) {
    const op = ops[Math.floor(Math.random() * ops.length)];
    const max = grade <= 4 ? 100 : 1000;
    const a = Math.round(Math.random() * max * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
    const b = Math.round(Math.random() * Math.min(max, a) * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
    exercises.push(`${i + 1}. ${a} ${op} ${b} = ?`);
  }
  return exercises;
}

function explainArithmetic(operation: string, a: number, b: number): string {
  const explanations: Record<string, string> = {
    addition: `计算 ${a} + ${b}：可以这样想：先算 ${a}，再加上 ${b}。也可以用凑十法：把 ${b} 拆成和 ${a} 凑成10的部分加上剩余部分。`,
    subtraction: `计算 ${a} - ${b}：可以这样想：从 ${a} 里去掉 ${b}。如果 ${b} 接近 ${a}，可以用 ${a} 减去一个比 ${b} 稍大的数，再加上多减的部分。`,
    multiplication: `计算 ${a} × ${b}：可以理解为 ${a} 个 ${b} 相加，或者 ${b} 个 ${a} 相加。也可以用分配律：${a} × ${b} = ${a} × (${b - 1}) + ${a}。`,
    division: `计算 ${a} ÷ ${b}：可以这样想：${a} 里面有几个 ${b}。也可以用乘法逆运算：想 ${b} × ? = ${a}。`,
  };
  return explanations[operation] || '请选择正确的运算类型';
}

const gradeContent = {
  1: { topics: ['10以内加减法', '20以内加减法', '认识数字0-20', '比大小', '序数'], difficulty: '游戏化、生活化、用手指和实物辅助' },
  2: { topics: ['100以内加减法', '乘法初步（2-5的乘法口诀）', '除法初步', '认识人民币', '认识时间'], difficulty: '游戏闯关、多练习、及时鼓励' },
  3: { topics: ['万以内加减法', '6-9乘法口诀', '有余数除法', '分数初步', '测量单位'], difficulty: '理解算理、多做题、联系生活' },
  4: { topics: ['大数读写', '三位数乘两位数', '除数是两位数的除法', '小数初步', '运算定律'], difficulty: '规范书写、验算习惯、错题整理' },
  5: { topics: ['小数加减乘除', '分数加减法', '体积容积', '复式统计图', '因数倍数'], difficulty: '综合运用、数学思想、举一反三' },
  6: { topics: ['分数乘除法', '百分数', '比例', '圆柱圆锥', '总复习综合'], difficulty: '系统梳理、查漏补缺、综合应用' },
};

function getTopics(grade: number): string[] {
  const content = gradeContent[grade as keyof typeof gradeContent] || gradeContent[3];
  return content.topics;
}

function getTeachingTips(grade: number) {
  const content = gradeContent[grade as keyof typeof gradeContent] || gradeContent[3];
  return {
    topics: content.topics,
    difficulty: content.difficulty,
    tips: [
      '理解算理比机械计算更重要',
      '每天坚持10-15分钟口算训练',
      '建立错题本，定期回顾',
      '用生活实例帮助理解',
      '适时引入游戏化学习',
    ],
  };
}

function generateMixedProblems(grade: number, count: number) {
  const operations = ['addition', 'subtraction', 'multiplication', 'division'];
  const problems: { problem: string; answer: number; type: string }[] = [];

  for (let i = 0; i < count; i++) {
    const op = operations[Math.floor(Math.random() * operations.length)];
    const max = grade <= 2 ? 20 : grade <= 3 ? 50 : grade <= 4 ? 100 : 500;
    let problem = '';
    let answer = 0;

    if (op === 'addition') {
      const a = Math.floor(Math.random() * max) + 1;
      const b = Math.floor(Math.random() * max) + 1;
      problem = `${a} + ${b}`;
      answer = a + b;
    } else if (op === 'subtraction') {
      const b = Math.floor(Math.random() * Math.min(max, 50)) + 1;
      const a = b + Math.floor(Math.random() * Math.min(max, 50)) + 1;
      problem = `${a} - ${b}`;
      answer = a - b;
    } else if (op === 'multiplication') {
      const multMax = grade <= 2 ? 5 : grade <= 3 ? 9 : 12;
      const a = Math.floor(Math.random() * multMax) + 2;
      const b = Math.floor(Math.random() * 9) + 2;
      problem = `${a} × ${b}`;
      answer = a * b;
    } else {
      const multMax = grade <= 2 ? 5 : grade <= 3 ? 9 : 12;
      const b = Math.floor(Math.random() * multMax) + 2;
      const quotient = Math.floor(Math.random() * 9) + 2;
      const a = b * quotient;
      problem = `${a} ÷ ${b}`;
      answer = quotient;
    }

    problems.push({ problem: `${i + 1}. ${problem} = ?`, answer, type: op });
  }
  return problems;
}
