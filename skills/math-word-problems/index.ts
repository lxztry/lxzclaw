/**
 * 小学数学 - 应用题专项技能
 * 支持：典型应用题类型、解题思路训练、数量关系分析
 */

export default {
  skill: {
    name: 'math-word-problems',
    description: '小学数学应用题专项 - 典型题型分类、解题思路引导、数量关系分析',
    version: '1.0.0',
    author: 'LxzClaw',
    tags: ['education', 'math', 'word-problems', 'primary-school'],
    dependencies: {},
  },

  /**
   * 应用题类型库
   */
  problemTypes: {
    // 一年级
    partWhole: {
      name: '部分与整体',
      grades: [1, 2],
      template: (vars: Record<string, number>) =>
        `小明有${vars.total}个苹果，吃了${vars.eaten}个，还剩多少个？`,
      solution: (vars: Record<string, number>) =>
        `方法一：总数 - 吃的 = 剩下的\n${vars.total} - ${vars.eaten} = ${vars.total - vars.eaten}（个）\n\n方法二：用减法\n${vars.total} - ${vars.eaten} = ${vars.total - vars.eaten}`,
      keywords: ['还剩', '剩下', '吃了', '走了', '掉了'],
      mathRelation: '整体 - 部分 = 另一部分',
    },

    // 二三年级
    compare: {
      name: '比多少',
      grades: [2, 3],
      template: (vars: Record<string, number>) =>
        `${vars.name1}有${vars.count1}本书，${vars.name2}比${vars.name1}${vars.diff}本书，${vars.name2}有多少本？`,
      solution: (vars: Record<string, number>) =>
        `解题思路：比多就用加法\n${vars.name2}的本数 = ${vars.name1}的本数 + ${vars.diff}\n${vars.count1} + ${vars.diff} = ${vars.count1 + vars.diff}（本）`,
      keywords: ['比...多', '比...少', '相差', '多多少', '少多少'],
      mathRelation: '较大数 = 较小数 + 差',
    },

    // 二三年级
    multiply: {
      name: '乘法的应用',
      grades: [2, 3],
      template: (vars: Record<string, number>) =>
        `同学们去植树，每行${vars.perRow}棵，种了${vars.rows}行，一共植树多少棵？`,
      solution: (vars: Record<string, number>) =>
        `解题思路：求几个几相加用乘法\n每行的棵树 × 行数 = 总棵树\n${vars.perRow} × ${vars.rows} = ${vars.perRow * vars.rows}（棵）`,
      keywords: ['每...', '几行', '几组', '几份', '倍'],
      mathRelation: '每份数 × 份数 = 总数',
    },

    // 二三年级
    divide: {
      name: '除法的应用',
      grades: [2, 3],
      template: (vars: Record<string, number>) =>
        `有${vars.total}个苹果，平均分给${vars.people}个小朋友，每个小朋友分到几个？`,
      solution: (vars: Record<string, number>) =>
        `解题思路：平均分用除法\n总数 ÷ 人数 = 每人数量\n${vars.total} ÷ ${vars.people} = ${vars.total / vars.people}（个）`,
      keywords: ['平均分', '每份', '包含', '几次', '够不够'],
      mathRelation: '总数 ÷ 份数 = 每份数',
    },

    // 三四年级
    price: {
      name: '购物问题',
      grades: [3, 4],
      template: (vars: Record<string, number>) =>
        `${vars.name}去书店买书，一本${vars.unitPrice}元，他买了${vars.quantity}本，一共要付多少钱？`,
      solution: (vars: Record<string, number>) =>
        `解题思路：单价 × 数量 = 总价\n${vars.unitPrice} × ${vars.quantity} = ${vars.unitPrice * vars.quantity}（元）`,
      keywords: ['单价', '总价', '数量', '付钱', '找回'],
      mathRelation: '单价 × 数量 = 总价',
    },

    // 三四年级
    distance: {
      name: '行程问题',
      grades: [3, 4],
      template: (vars: Record<string, number>) =>
        `小明每分钟走${vars.speed}米，走了${vars.time}分钟，一共走了多少米？`,
      solution: (vars: Record<string, number>) =>
        `解题思路：速度 × 时间 = 路程\n${vars.speed} × ${vars.time} = ${vars.speed * vars.time}（米）`,
      keywords: ['每小时', '每分钟', '每秒', '走了', '行了', '跑了'],
      mathRelation: '速度 × 时间 = 路程',
    },

    // 四五年级
    area: {
      name: '面积问题',
      grades: [4, 5],
      template: (vars: Record<string, number>) =>
        `一块长方形菜地，长${vars.length}米，宽${vars.width}米，这块菜地的面积是多少平方米？`,
      solution: (vars: Record<string, number>) =>
        `解题思路：长方形面积 = 长 × 宽\n${vars.length} × ${vars.width} = ${vars.length * vars.width}（平方米）`,
      keywords: ['长', '宽', '面积', '平方米', '平方分米'],
      mathRelation: '长 × 宽 = 面积',
    },

    // 五六年级
    fraction: {
      name: '分数应用题',
      grades: [5, 6],
      template: (vars: Record<string, number>) =>
        `妈妈买了一些苹果，小明吃了这些苹果的${vars.fraction}，正好是${vars.amount}个。妈妈一共买了多少个苹果？`,
      solution: (vars: Record<string, number>) =>
        `解题思路：部分量 ÷ 对应分数 = 整体\n整体 = ${vars.amount} ÷ ${vars.fraction} = ${vars.amount / vars.fraction}（个）`,
      keywords: ['几分之几', '吃了', '用了', '走了', '剩下'],
      mathRelation: '部分量 ÷ 对应分数 = 整体',
    },

    // 五六年级
    percentage: {
      name: '百分数应用',
      grades: [6],
      template: (vars: Record<string, number>) =>
        `某商品原价${vars.original}元，现在打${vars.percent}折出售，现在售价多少元？`,
      solution: (vars: Record<string, number>) =>
        `解题思路：原价 × 折扣 = 现价\n${vars.original} × ${vars.percent / 10} = ${(vars.original * vars.percent / 10).toFixed(2)}（元）`,
      keywords: ['打几折', '降价', '涨价', '增长', '百分数'],
      mathRelation: '原价 × 折扣 = 现价',
    },
  },

  /**
   * 解题步骤模板
   */
  solvingSteps: [
    '📖 认真读题，理解题意',
    '🔍 找出已知条件和问题',
    '💡 分析数量关系',
    '📝 列式计算',
    '✅ 检查答案是否合理',
  ],

  /**
   * 生成应用题
   */
  generateProblem: (type: string, grade: number) => {
    const problemType = problemTypes[type as keyof typeof problemTypes];
    if (!problemType) return { error: `未找到类型: ${type}` };

    const vars: Record<string, number | string> = {};
    if (type === 'partWhole') {
      vars.total = Math.floor(Math.random() * 15) + 5;
      vars.eaten = Math.floor(Math.random() * (vars.total as number - 1)) + 1;
    } else if (type === 'compare') {
      vars.name1 = '小红';
      vars.name2 = '小华';
      vars.count1 = Math.floor(Math.random() * 20) + 10;
      vars.diff = Math.floor(Math.random() * 10) + 5;
    } else if (type === 'multiply') {
      vars.perRow = Math.floor(Math.random() * 5) + 3;
      vars.rows = Math.floor(Math.random() * 6) + 3;
    } else if (type === 'divide') {
      const divisors = [2, 3, 4, 5];
      vars.people = divisors[Math.floor(Math.random() * divisors.length)];
      vars.total = vars.people * (Math.floor(Math.random() * 5) + 2);
    } else if (type === 'price') {
      vars.name = ['小明', '小芳', '小华'][Math.floor(Math.random() * 3)];
      vars.unitPrice = [5, 8, 10, 12, 15][Math.floor(Math.random() * 5)];
      vars.quantity = Math.floor(Math.random() * 5) + 2;
    } else if (type === 'distance') {
      vars.speed = [50, 60, 70, 80][Math.floor(Math.random() * 4)];
      vars.time = Math.floor(Math.random() * 10) + 5;
    } else if (type === 'area') {
      vars.length = Math.floor(Math.random() * 10) + 5;
      vars.width = Math.floor(Math.random() * 8) + 3;
    } else if (type === 'fraction') {
      const fractions = [1 / 2, 1 / 3, 1 / 4, 2 / 5];
      vars.fraction = fractions[Math.floor(Math.random() * fractions.length)];
      vars.amount = Math.floor(Math.random() * 5) + 1;
    } else if (type === 'percentage') {
      vars.original = [100, 200, 300, 500][Math.floor(Math.random() * 4)];
      vars.percent = [7, 8, 9][Math.floor(Math.random() * 3)];
    }

    return {
      type: problemType.name,
      problem: problemType.template(vars),
      solution: problemType.solution(vars),
      mathRelation: problemType.mathRelation,
      keywords: problemType.keywords,
      steps: solvingSteps,
    };
  },

  /**
   * 批量生成应用题
   */
  generateProblems: (grade: number, count: number = 5) => {
    const types = Object.keys(problemTypes).filter(t =>
      problemTypes[t as keyof typeof problemTypes].grades.includes(grade)
    );
    if (types.length === 0) {
      return { error: `年级${grade}暂无可用的应用题类型` };
    }

    const problems = [];
    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      problems.push(generateProblem(type, grade));
    }
    return { problems, count: problems.length };
  },

  /**
   * 分析应用题结构
   */
  analyzeProblem: (problem: string) => {
    const result = {
      keywords: [] as string[],
      likelyType: null as string | null,
      suggestedRelation: null as string | null,
    };

    const allKeywords: Record<string, { type: string; relation: string }> = {};
    for (const [type, info] of Object.entries(problemTypes)) {
      for (const kw of info.keywords) {
        allKeywords[kw] = { type: info.name, relation: info.mathRelation };
      }
    }

    for (const keyword of Object.keys(allKeywords)) {
      if (problem.includes(keyword)) {
        result.keywords.push(keyword);
        result.likelyType = allKeywords[keyword].type;
        result.suggestedRelation = allKeywords[keyword].relation;
      }
    }

    return result;
  },

  /**
   * 获取解题思路
   */
  getSolvingTips: () => {
    return {
      steps: solvingSteps,
      tips: [
        '读题至少三遍：第一遍了解大概，第二遍找出条件，第三遍明确问题',
        '圈画关键词：用波浪线画出关键词，帮助分析数量关系',
        '画图辅助：复杂问题可以用线段图、示意图帮助理解',
        '验算检查：把答案代回原题看是否成立',
        '举一反三：理解一类题的解法，而不是死记硬背',
      ],
      commonMistakes: [
        '审题不仔细，漏看或看错条件',
        '数量关系搞错（该加的减了）',
        '单位不统一就计算',
        '答非所问',
        '计算粗心出错',
      ],
    };
  },

  /**
   * 获取年级对应的题型
   */
  getTypesByGrade: (grade: number) => {
    const types = [];
    for (const [key, info] of Object.entries(problemTypes)) {
      if (info.grades.includes(grade)) {
        types.push({ type: key, name: info.name, relation: info.mathRelation });
      }
    }
    return types;
  },

  /**
   * 列出所有题型
   */
  listTypes: () => {
    const types = [];
    for (const [key, info] of Object.entries(problemTypes)) {
      types.push({
        type: key,
        name: info.name,
        grades: info.grades,
        keywords: info.keywords,
        relation: info.mathRelation,
      });
    }
    return types;
  },

  async execute(input: unknown) {
    const { action, data } = input as { action: string; data?: Record<string, unknown> };
    const d = data || {};

    switch (action) {
      case 'generate':
        return generateProblem(d.type as string, d.grade as number || 3);

      case 'batch':
        return generateProblems(d.grade as number || 3, d.count as number || 5);

      case 'analyze':
        return analyzeProblem(d.problem as string);

      case 'tips':
        return getSolvingTips();

      case 'types':
        return getTypesByGrade(d.grade as number || 3);

      case 'list':
        return listTypes();

      default:
        return {
          message: '应用题技能支持以下操作：',
          actions: ['generate', 'batch', 'analyze', 'tips', 'types', 'list'],
          examples: {
            generate: '{ action: "generate", data: { type: "multiply", grade: 3 } }',
            batch: '{ action: "batch", data: { grade: 3, count: 5 } }',
            analyze: '{ action: "analyze", data: { problem: "小明有20个苹果，吃了5个，还剩多少？" } }',
            tips: '{ action: "tips" }',
            types: '{ action: "types", data: { grade: 3 } }',
          },
        };
    }
  },

  onLoad: async () => {
    console.log('✅ 小学数学-应用题技能已加载');
    console.log('📝 支持：典型应用题生成 | 解题思路 | 数量关系分析');
  },

  onUnload: async () => {
    console.log('🅑 小学数学-应用题技能已卸载');
  },
};

// Helper functions
const problemTypes = {
  partWhole: {
    name: '部分与整体',
    grades: [1, 2],
    template: (vars: Record<string, number | string>) =>
      `小明有${vars.total}个苹果，吃了${vars.eaten}个，还剩多少个？`,
    solution: (vars: Record<string, number | string>) =>
      `方法一：总数 - 吃的 = 剩下的\n${vars.total} - ${vars.eaten} = ${(vars.total as number) - (vars.eaten as number)}（个）\n\n方法二：用减法\n${vars.total} - ${vars.eaten} = ${(vars.total as number) - (vars.eaten as number)}`,
    keywords: ['还剩', '剩下', '吃了', '走了', '掉了'],
    mathRelation: '整体 - 部分 = 另一部分',
  },

  compare: {
    name: '比多少',
    grades: [2, 3],
    template: (vars: Record<string, number | string>) =>
      `${vars.name1}有${vars.count1}本书，${vars.name2}比${vars.name1}${vars.diff}本书，${vars.name2}有多少本？`,
    solution: (vars: Record<string, number | string>) =>
      `解题思路：比多就用加法\n${vars.name2}的本数 = ${vars.name1}的本数 + ${vars.diff}\n${vars.count1} + ${vars.diff} = ${(vars.count1 as number) + (vars.diff as number)}（本）`,
    keywords: ['比...多', '比...少', '相差', '多多少', '少多少'],
    mathRelation: '较大数 = 较小数 + 差',
  },

  multiply: {
    name: '乘法的应用',
    grades: [2, 3],
    template: (vars: Record<string, number | string>) =>
      `同学们去植树，每行${vars.perRow}棵，种了${vars.rows}行，一共植树多少棵？`,
    solution: (vars: Record<string, number | string>) =>
      `解题思路：求几个几相加用乘法\n每行的棵树 × 行数 = 总棵树\n${vars.perRow} × ${vars.rows} = ${(vars.perRow as number) * (vars.rows as number)}（棵）`,
    keywords: ['每...', '几行', '几组', '几份', '倍'],
    mathRelation: '每份数 × 份数 = 总数',
  },

  divide: {
    name: '除法的应用',
    grades: [2, 3],
    template: (vars: Record<string, number | string>) =>
      `有${vars.total}个苹果，平均分给${vars.people}个小朋友，每个小朋友分到几个？`,
    solution: (vars: Record<string, number | string>) =>
      `解题思路：平均分用除法\n总数 ÷ 人数 = 每人数量\n${vars.total} ÷ ${vars.people} = ${(vars.total as number) / (vars.people as number)}（个）`,
    keywords: ['平均分', '每份', '包含', '几次', '够不够'],
    mathRelation: '总数 ÷ 份数 = 每份数',
  },

  price: {
    name: '购物问题',
    grades: [3, 4],
    template: (vars: Record<string, number | string>) =>
      `${vars.name}去书店买书，一本${vars.unitPrice}元，他买了${vars.quantity}本，一共要付多少钱？`,
    solution: (vars: Record<string, number | string>) =>
      `解题思路：单价 × 数量 = 总价\n${vars.unitPrice} × ${vars.quantity} = ${(vars.unitPrice as number) * (vars.quantity as number)}（元）`,
    keywords: ['单价', '总价', '数量', '付钱', '找回'],
    mathRelation: '单价 × 数量 = 总价',
  },

  distance: {
    name: '行程问题',
    grades: [3, 4],
    template: (vars: Record<string, number | string>) =>
      `小明每分钟走${vars.speed}米，走了${vars.time}分钟，一共走了多少米？`,
    solution: (vars: Record<string, number | string>) =>
      `解题思路：速度 × 时间 = 路程\n${vars.speed} × ${vars.time} = ${(vars.speed as number) * (vars.time as number)}（米）`,
    keywords: ['每小时', '每分钟', '每秒', '走了', '行了', '跑了'],
    mathRelation: '速度 × 时间 = 路程',
  },

  area: {
    name: '面积问题',
    grades: [4, 5],
    template: (vars: Record<string, number | string>) =>
      `一块长方形菜地，长${vars.length}米，宽${vars.width}米，这块菜地的面积是多少平方米？`,
    solution: (vars: Record<string, number | string>) =>
      `解题思路：长方形面积 = 长 × 宽\n${vars.length} × ${vars.width} = ${(vars.length as number) * (vars.width as number)}（平方米）`,
    keywords: ['长', '宽', '面积', '平方米', '平方分米'],
    mathRelation: '长 × 宽 = 面积',
  },

  fraction: {
    name: '分数应用题',
    grades: [5, 6],
    template: (vars: Record<string, number | string>) =>
      `妈妈买了一些苹果，小明吃了这些苹果的${vars.fraction}，正好是${vars.amount}个。妈妈一共买了多少个苹果？`,
    solution: (vars: Record<string, number | string>) =>
      `解题思路：部分量 ÷ 对应分数 = 整体\n整体 = ${vars.amount} ÷ ${vars.fraction} = ${(vars.amount as number) / (vars.fraction as number)}（个）`,
    keywords: ['几分之几', '吃了', '用了', '走了', '剩下'],
    mathRelation: '部分量 ÷ 对应分数 = 整体',
  },

  percentage: {
    name: '百分数应用',
    grades: [6],
    template: (vars: Record<string, number | string>) =>
      `某商品原价${vars.original}元，现在打${vars.percent}折出售，现在售价多少元？`,
    solution: (vars: Record<string, number | string>) =>
      `解题思路：原价 × 折扣 = 现价\n${vars.original} × ${vars.percent / 10} = ${((vars.original as number) * (vars.percent as number) / 10).toFixed(2)}（元）`,
    keywords: ['打几折', '降价', '涨价', '增长', '百分数'],
    mathRelation: '原价 × 折扣 = 现价',
  },
};

const solvingSteps = [
  '📖 认真读题，理解题意',
  '🔍 找出已知条件和问题',
  '💡 分析数量关系',
  '📝 列式计算',
  '✅ 检查答案是否合理',
];

function generateProblem(type: string, grade: number) {
  const problemType = problemTypes[type as keyof typeof problemTypes];
  if (!problemType) return { error: `未找到类型: ${type}` };

  const vars: Record<string, number | string> = {};
  if (type === 'partWhole') {
    vars.total = Math.floor(Math.random() * 15) + 5;
    vars.eaten = Math.floor(Math.random() * (vars.total as number - 1)) + 1;
  } else if (type === 'compare') {
    vars.name1 = '小红';
    vars.name2 = '小华';
    vars.count1 = Math.floor(Math.random() * 20) + 10;
    vars.diff = Math.floor(Math.random() * 10) + 5;
  } else if (type === 'multiply') {
    vars.perRow = Math.floor(Math.random() * 5) + 3;
    vars.rows = Math.floor(Math.random() * 6) + 3;
  } else if (type === 'divide') {
    const divisors = [2, 3, 4, 5];
    vars.people = divisors[Math.floor(Math.random() * divisors.length)];
    vars.total = (vars.people as number) * (Math.floor(Math.random() * 5) + 2);
  } else if (type === 'price') {
    vars.name = ['小明', '小芳', '小华'][Math.floor(Math.random() * 3)];
    vars.unitPrice = [5, 8, 10, 12, 15][Math.floor(Math.random() * 5)];
    vars.quantity = Math.floor(Math.random() * 5) + 2;
  } else if (type === 'distance') {
    vars.speed = [50, 60, 70, 80][Math.floor(Math.random() * 4)];
    vars.time = Math.floor(Math.random() * 10) + 5;
  } else if (type === 'area') {
    vars.length = Math.floor(Math.random() * 10) + 5;
    vars.width = Math.floor(Math.random() * 8) + 3;
  } else if (type === 'fraction') {
    const fractions = [1 / 2, 1 / 3, 1 / 4, 2 / 5];
    vars.fraction = fractions[Math.floor(Math.random() * fractions.length)];
    vars.amount = Math.floor(Math.random() * 5) + 1;
  } else if (type === 'percentage') {
    vars.original = [100, 200, 300, 500][Math.floor(Math.random() * 4)];
    vars.percent = [7, 8, 9][Math.floor(Math.random() * 3)];
  }

  return {
    type: problemType.name,
    problem: problemType.template(vars),
    solution: problemType.solution(vars),
    mathRelation: problemType.mathRelation,
    keywords: problemType.keywords,
    steps: solvingSteps,
  };
}

function generateProblems(grade: number, count: number = 5) {
  const types = Object.keys(problemTypes).filter(t =>
    problemTypes[t as keyof typeof problemTypes].grades.includes(grade)
  );
  if (types.length === 0) {
    return { error: `年级${grade}暂无可用的应用题类型` };
  }

  const problems = [];
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    problems.push(generateProblem(type, grade));
  }
  return { problems, count: problems.length };
}

function analyzeProblem(problem: string) {
  const result = {
    keywords: [] as string[],
    likelyType: null as string | null,
    suggestedRelation: null as string | null,
  };

  const allKeywords: Record<string, { type: string; relation: string }> = {};
  for (const [type, info] of Object.entries(problemTypes)) {
    for (const kw of info.keywords) {
      allKeywords[kw] = { type: info.name, relation: info.mathRelation };
    }
  }

  for (const keyword of Object.keys(allKeywords)) {
    if (problem.includes(keyword)) {
      result.keywords.push(keyword);
      result.likelyType = allKeywords[keyword].type;
      result.suggestedRelation = allKeywords[keyword].relation;
    }
  }

  return result;
}

function getSolvingTips() {
  return {
    steps: solvingSteps,
    tips: [
      '读题至少三遍：第一遍了解大概，第二遍找出条件，第三遍明确问题',
      '圈画关键词：用波浪线画出关键词，帮助分析数量关系',
      '画图辅助：复杂问题可以用线段图、示意图帮助理解',
      '验算检查：把答案代回原题看是否成立',
      '举一反三：理解一类题的解法，而不是死记硬背',
    ],
    commonMistakes: [
      '审题不仔细，漏看或看错条件',
      '数量关系搞错（该加的减了）',
      '单位不统一就计算',
      '答非所问',
      '计算粗心出错',
    ],
  };
}

function getTypesByGrade(grade: number) {
  const types = [];
  for (const [key, info] of Object.entries(problemTypes)) {
    if (info.grades.includes(grade)) {
      types.push({ type: key, name: info.name, relation: info.mathRelation });
    }
  }
  return types;
}

function listTypes() {
  const types = [];
  for (const [key, info] of Object.entries(problemTypes)) {
    types.push({
      type: key,
      name: info.name,
      grades: info.grades,
      keywords: info.keywords,
      relation: info.mathRelation,
    });
  }
  return types;
}
