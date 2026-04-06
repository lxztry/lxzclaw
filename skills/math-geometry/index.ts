/**
 * 小学数学 - 几何专项技能
 * 支持：平面图形、立体图形、面积、周长、体积、角度
 */

export default {
  skill: {
    name: 'math-geometry',
    description: '小学数学几何专项 - 认识图形、计算面积周长、立体图形体积',
    version: '1.0.0',
    author: 'LxzClaw',
    tags: ['education', 'math', 'geometry', 'primary-school'],
    dependencies: {},
  },

  /**
   * 平面图形定义
   */
  planeShapes: {
    square: {
      name: '正方形',
      properties: ['四条边相等', '四个角都是直角', '对角线相等且垂直', '是特殊的长方形'],
      perimeter: (a: number) => `边长 × 4 = ${a} × 4 = ${a * 4}`,
      area: (a: number) => `边长 × 边长 = ${a} × ${a} = ${a * a}`,
    },
    rectangle: {
      name: '长方形',
      properties: ['对边相等', '四个角都是直角', '对角线相等'],
      perimeter: (a: number, b: number) => `(长 + 宽) × 2 = (${a} + ${b}) × 2 = ${(a + b) * 2}`,
      area: (a: number, b: number) => `长 × 宽 = ${a} × ${b} = ${a * b}`,
    },
    triangle: {
      name: '三角形',
      properties: ['三条边', '内角和180°', '可分为锐角、直角、钝角三角形'],
      area: (a: number, h: number) => `底 × 高 ÷ 2 = ${a} × ${h} ÷ 2 = ${(a * h) / 2}`,
    },
    circle: {
      name: '圆',
      properties: ['半径相等', '直径是半径的2倍', '周长 = 2πr', '面积 = πr²'],
      perimeter: (r: number) => `2 × π × 半径 = 2 × 3.14 × ${r} = ${(2 * 3.14 * r).toFixed(2)}`,
      area: (r: number) => `π × 半径² = 3.14 × ${r}² = ${(3.14 * r * r).toFixed(2)}`,
    },
    parallelogram: {
      name: '平行四边形',
      properties: ['对边平行且相等', '对角相等', '可转化为长方形计算面积'],
      area: (a: number, h: number) => `底 × 高 = ${a} × ${h} = ${a * h}`,
    },
  },

  /**
   * 立体图形定义
   */
  solidShapes: {
    cube: {
      name: '正方体',
      properties: ['6个面都是正方形', '12条棱相等', '8个顶点'],
      surfaceArea: (a: number) => `6 × 边长² = 6 × ${a}² = ${6 * a * a}`,
      volume: (a: number) => `边长³ = ${a}³ = ${a * a * a}`,
    },
    cuboid: {
      name: '长方体',
      properties: ['6个面都是长方形', '相对的面相等', '12条棱', '8个顶点'],
      surfaceArea: (a: number, b: number, c: number) => {
        const s = 2 * (a * b + b * c + a * c);
        return `2 × (长×宽 + 宽×高 + 长×高) = 2 × (${a}×${b} + ${b}×${c} + ${a}×${c}) = ${s}`;
      },
      volume: (a: number, b: number, c: number) => `长 × 宽 × 高 = ${a} × ${b} × ${c} = ${a * b * c}`,
    },
    cylinder: {
      name: '圆柱',
      properties: ['两个底面是相等的圆', '侧面展开是长方形', '体积 = 底面积 × 高'],
      surfaceArea: (r: number, h: number) => {
        const side = (2 * 3.14 * r * h).toFixed(2);
        const topBottom = (2 * 3.14 * r * r).toFixed(2);
        return `2×πr² + 2πrh = 2×3.14×${r}² + 2×3.14×${r}×${h} = ${topBottom} + ${side}`;
      },
      volume: (r: number, h: number) => `πr² × 高 = 3.14 × ${r}² × ${h} = ${(3.14 * r * r * h).toFixed(2)}`,
    },
    cone: {
      name: '圆锥',
      properties: ['一个底面是圆', '一个顶点', '侧面展开是扇形'],
      volume: (r: number, h: number) => `⅓ × πr² × 高 = ⅓ × 3.14 × ${r}² × ${h} = ${(3.14 * r * r * h / 3).toFixed(2)}`,
    },
    sphere: {
      name: '球',
      properties: ['表面是曲面', '所有截面都是圆', '体积 = 4/3 πr³'],
      surfaceArea: (r: number) => `4 × π × 半径² = 4 × 3.14 × ${r}² = ${(4 * 3.14 * r * r).toFixed(2)}`,
      volume: (r: number) => `4/3 × π × 半径³ = 4/3 × 3.14 × ${r}³ = ${((4 / 3) * 3.14 * r * r * r).toFixed(2)}`,
    },
  },

  /**
   * 年级几何内容
   */
  gradeContent: {
    1: ['认识正方形、长方形、三角形', '会数简单图形的个数', '用积木拼搭图形'],
    2: ['认识平行四边形', '认识七巧板', '图形拼组与分割', '认识轴对称'],
    3: ['认识周长', '长方形正方形周长', '认识面积', '长方形正方形面积'],
    4: ['角的认识与度量', '三角形分类', '平行四边形与梯形', '组合图形面积'],
    5: ['平行四边形、三角形、梯形面积', '认识体积', '长方体正方体体积', '单位换算'],
    6: ['圆柱圆锥体积', '比例尺', '图形与几何综合', '立体图形表面积'],
  },

  /**
   * 获取年级知识点
   */
  getGradeTopics: (grade: number) => {
    return gradeContent[grade as keyof typeof gradeContent] || gradeContent[3];
  },

  /**
   * 计算图形周长或面积
   */
  calculate: (shape: string, params: number[], action: 'perimeter' | 'area' | 'surface' | 'volume') => {
    const result: Record<string, string> = {};

    if (shape === 'square' && params.length >= 1) {
      const a = params[0];
      if (action === 'perimeter') result.perimeter = planeShapes.square.perimeter(a);
      if (action === 'area') result.area = planeShapes.square.area(a);
    } else if (shape === 'rectangle' && params.length >= 2) {
      const [a, b] = params;
      if (action === 'perimeter') result.perimeter = planeShapes.rectangle.perimeter(a, b);
      if (action === 'area') result.area = planeShapes.rectangle.area(a, b);
    } else if (shape === 'triangle' && params.length >= 2) {
      const [a, h] = params;
      if (action === 'area') result.area = planeShapes.triangle.area(a, h);
    } else if (shape === 'circle' && params.length >= 1) {
      const r = params[0];
      if (action === 'perimeter') result.perimeter = planeShapes.circle.perimeter(r);
      if (action === 'area') result.area = planeShapes.circle.area(r);
    } else if (shape === 'parallelogram' && params.length >= 2) {
      const [a, h] = params;
      if (action === 'area') result.area = planeShapes.parallelogram.area(a, h);
    } else if (shape === 'cube' && params.length >= 1) {
      const a = params[0];
      if (action === 'surface') result.surfaceArea = solidShapes.cube.surfaceArea(a);
      if (action === 'volume') result.volume = solidShapes.cube.volume(a);
    } else if (shape === 'cuboid' && params.length >= 3) {
      const [a, b, c] = params;
      if (action === 'surface') result.surfaceArea = solidShapes.cuboid.surfaceArea(a, b, c);
      if (action === 'volume') result.volume = solidShapes.cuboid.volume(a, b, c);
    } else if (shape === 'cylinder' && params.length >= 2) {
      const [r, h] = params;
      if (action === 'surface') result.surfaceArea = solidShapes.cylinder.surfaceArea(r, h);
      if (action === 'volume') result.volume = solidShapes.cylinder.volume(r, h);
    } else if (shape === 'cone' && params.length >= 2) {
      const [r, h] = params;
      if (action === 'volume') result.volume = solidShapes.cone.volume(r, h);
    } else if (shape === 'sphere' && params.length >= 1) {
      const r = params[0];
      if (action === 'surface') result.surfaceArea = solidShapes.sphere.surfaceArea(r);
      if (action === 'volume') result.volume = solidShapes.sphere.volume(r);
    }

    return result;
  },

  /**
   * 获取图形信息
   */
  getShapeInfo: (shape: string) => {
    const plane = planeShapes[shape as keyof typeof planeShapes];
    const solid = solidShapes[shape as keyof typeof solidShapes];
    if (plane) return { type: 'plane', ...plane };
    if (solid) return { type: 'solid', ...solid };
    return null;
  },

  /**
   * 列出所有图形
   */
  listShapes: () => {
    return {
      plane: Object.keys(planeShapes),
      solid: Object.keys(solidShapes),
    };
  },

  /**
   * 生成几何练习题
   */
  generateProblems: (grade: number, count: number = 5) => {
    const problems: string[] = [];
    const topics = getGradeTopics(grade);

    for (let i = 0; i < count; i++) {
      const topicIndex = Math.floor(Math.random() * topics.length);
      const topic = topics[topicIndex];

      let problem = '';
      if (topic.includes('周长')) {
        const a = Math.floor(Math.random() * 10) + 2;
        const b = Math.floor(Math.random() * 10) + 2;
        problem = `长方形长${a}厘米，宽${b}厘米，周长是多少？`;
      } else if (topic.includes('面积')) {
        if (topic.includes('正方形')) {
          const a = Math.floor(Math.random() * 8) + 2;
          problem = `正方形边长${a}厘米，面积是多少？`;
        } else if (topic.includes('长方形')) {
          const a = Math.floor(Math.random() * 10) + 2;
          const b = Math.floor(Math.random() * 8) + 2;
          problem = `长方形长${a}厘米，宽${b}厘米，面积是多少？`;
        } else {
          const a = Math.floor(Math.random() * 10) + 2;
          const h = Math.floor(Math.random() * 8) + 2;
          problem = `三角形底${a}厘米，高${h}厘米，面积是多少？`;
        }
      } else if (topic.includes('体积') || topic.includes('容积')) {
        if (topic.includes('正方体')) {
          const a = Math.floor(Math.random() * 5) + 2;
          problem = `正方体棱长${a}厘米，体积是多少？`;
        } else if (topic.includes('长方体')) {
          const a = Math.floor(Math.random() * 6) + 2;
          const b = Math.floor(Math.random() * 5) + 2;
          const c = Math.floor(Math.random() * 4) + 2;
          problem = `长方体长${a}厘米，宽${b}厘米，高${c}厘米，体积是多少？`;
        }
      } else {
        const a = Math.floor(Math.random() * 10) + 3;
        problem = `正方形边长${a}厘米，求周长和面积？`;
      }

      problems.push(`${i + 1}. ${problem}`);
    }
    return problems;
  },

  /**
   * 几何知识点讲解
   */
  explainConcept: (concept: string) => {
    const explanations: Record<string, string> = {
      周长: '周长是封闭图形一周的长度。比如：用绳子围成一个图形，绳子的长度就是周长。测量周长可以用直尺量每条边再相加，或者用滚动法。',
      面积: '面积是图形所占平面的大小。比如：铺地砖，地砖的数量就是面积。常用单位有平方厘米(cm²)、平方分米(dm²)、平方米(m²)。',
      体积: '体积是立体图形所占空间的大小。比如：往盒子里装东西，盒子能装多少就是体积。常用单位有立方厘米(cm³)、立方分米(dm³)、立方米(m³)。',
      对称轴: '如果一个图形沿着某条直线对折后两边完全重合，这条直线就是对称轴。正方形有4条，长方形有2条，圆有无数条。',
      三角形内角和: '任意三角形的三个内角加起来都等于180°。可以用量角器测量验证，也可以通过撕角拼成平角来直观理解。',
      圆周率: '圆周率π是圆的周长与直径的比值，约等于3.14。是一个无限不循环小数。我国数学家祖冲之最早精确计算到小数点后7位。',
    };
    return explanations[concept] || `关于"${concept}"的讲解：这是小学几何的重要内容，建议结合图形和生活实例来理解。`;
  },

  async execute(input: unknown) {
    const { action, data } = input as { action: string; data?: Record<string, unknown> };
    const d = data || {};

    switch (action) {
      case 'topics':
        return { grade: d.grade || 3, topics: getGradeTopics(d.grade as number || 3) };

      case 'shape':
        return getShapeInfo(d.shape as string);

      case 'list':
        return listShapes();

      case 'calculate':
        return calculate(d.shape as string, d.params as number[], d.action as 'perimeter' | 'area' | 'surface' | 'volume');

      case 'problems':
        return { problems: generateProblems(d.grade as number || 3, d.count as number || 5) };

      case 'explain':
        return { concept: d.concept, explanation: explainConcept(d.concept as string) };

      default:
        return {
          message: '几何技能支持以下操作：',
          actions: ['topics', 'shape', 'list', 'calculate', 'problems', 'explain'],
          examples: {
            topics: '{ action: "topics", data: { grade: 3 } }',
            shape: '{ action: "shape", data: { shape: "square" } }',
            calculate: '{ action: "calculate", data: { shape: "rectangle", params: [6, 4], action: "perimeter" } }',
            problems: '{ action: "problems", data: { grade: 3, count: 5 } }',
            explain: '{ action: "explain", data: { concept: "面积" } }',
          },
        };
    }
  },

  onLoad: async () => {
    console.log('✅ 小学数学-几何技能已加载');
    console.log('📐 支持：平面图形 | 立体图形 | 面积周长计算 | 几何概念讲解');
  },

  onUnload: async () => {
    console.log('🅑 小学数学-几何技能已卸载');
  },
};

// Helper functions
const planeShapes = {
  square: {
    name: '正方形',
    properties: ['四条边相等', '四个角都是直角', '对角线相等且垂直', '是特殊的长方形'],
    perimeter: (a: number) => `边长 × 4 = ${a} × 4 = ${a * 4}`,
    area: (a: number) => `边长 × 边长 = ${a} × ${a} = ${a * a}`,
  },
  rectangle: {
    name: '长方形',
    properties: ['对边相等', '四个角都是直角', '对角线相等'],
    perimeter: (a: number, b: number) => `(长 + 宽) × 2 = (${a} + ${b}) × 2 = ${(a + b) * 2}`,
    area: (a: number, b: number) => `长 × 宽 = ${a} × ${b} = ${a * b}`,
  },
  triangle: {
    name: '三角形',
    properties: ['三条边', '内角和180°', '可分为锐角、直角、钝角三角形'],
    area: (a: number, h: number) => `底 × 高 ÷ 2 = ${a} × ${h} ÷ 2 = ${(a * h) / 2}`,
  },
  circle: {
    name: '圆',
    properties: ['半径相等', '直径是半径的2倍', '周长 = 2πr', '面积 = πr²'],
    perimeter: (r: number) => `2 × π × 半径 = 2 × 3.14 × ${r} = ${(2 * 3.14 * r).toFixed(2)}`,
    area: (r: number) => `π × 半径² = 3.14 × ${r}² = ${(3.14 * r * r).toFixed(2)}`,
  },
  parallelogram: {
    name: '平行四边形',
    properties: ['对边平行且相等', '对角相等', '可转化为长方形计算面积'],
    area: (a: number, h: number) => `底 × 高 = ${a} × ${h} = ${a * h}`,
  },
};

const solidShapes = {
  cube: {
    name: '正方体',
    properties: ['6个面都是正方形', '12条棱相等', '8个顶点'],
    surfaceArea: (a: number) => `6 × 边长² = 6 × ${a}² = ${6 * a * a}`,
    volume: (a: number) => `边长³ = ${a}³ = ${a * a * a}`,
  },
  cuboid: {
    name: '长方体',
    properties: ['6个面都是长方形', '相对的面相等', '12条棱', '8个顶点'],
    surfaceArea: (a: number, b: number, c: number) => {
      const s = 2 * (a * b + b * c + a * c);
      return `2 × (长×宽 + 宽×高 + 长×高) = 2 × (${a}×${b} + ${b}×${c} + ${a}×${c}) = ${s}`;
    },
    volume: (a: number, b: number, c: number) => `长 × 宽 × 高 = ${a} × ${b} × ${c} = ${a * b * c}`,
  },
  cylinder: {
    name: '圆柱',
    properties: ['两个底面是相等的圆', '侧面展开是长方形', '体积 = 底面积 × 高'],
    surfaceArea: (r: number, h: number) => {
      const side = (2 * 3.14 * r * h).toFixed(2);
      const topBottom = (2 * 3.14 * r * r).toFixed(2);
      return `2×πr² + 2πrh = 2×3.14×${r}² + 2×3.14×${r}×${h} = ${topBottom} + ${side}`;
    },
    volume: (r: number, h: number) => `πr² × 高 = 3.14 × ${r}² × ${h} = ${(3.14 * r * r * h).toFixed(2)}`,
  },
  cone: {
    name: '圆锥',
    properties: ['一个底面是圆', '一个顶点', '侧面展开是扇形'],
    volume: (r: number, h: number) => `⅓ × πr² × 高 = ⅓ × 3.14 × ${r}² × ${h} = ${(3.14 * r * r * h / 3).toFixed(2)}`,
  },
  sphere: {
    name: '球',
    properties: ['表面是曲面', '所有截面都是圆', '体积 = 4/3 πr³'],
    surfaceArea: (r: number) => `4 × π × 半径² = 4 × 3.14 × ${r}² = ${(4 * 3.14 * r * r).toFixed(2)}`,
    volume: (r: number) => `4/3 × π × 半径³ = 4/3 × 3.14 × ${r}³ = ${((4 / 3) * 3.14 * r * r * r).toFixed(2)}`,
  },
};

const gradeContent = {
  1: ['认识正方形、长方形、三角形', '会数简单图形的个数', '用积木拼搭图形'],
  2: ['认识平行四边形', '认识七巧板', '图形拼组与分割', '认识轴对称'],
  3: ['认识周长', '长方形正方形周长', '认识面积', '长方形正方形面积'],
  4: ['角的认识与度量', '三角形分类', '平行四边形与梯形', '组合图形面积'],
  5: ['平行四边形、三角形、梯形面积', '认识体积', '长方体正方体体积', '单位换算'],
  6: ['圆柱圆锥体积', '比例尺', '图形与几何综合', '立体图形表面积'],
};

function getGradeTopics(grade: number) {
  return gradeContent[grade as keyof typeof gradeContent] || gradeContent[3];
}

function listShapes() {
  return {
    plane: Object.keys(planeShapes),
    solid: Object.keys(solidShapes),
  };
}

function calculate(shape: string, params: number[], action: 'perimeter' | 'area' | 'surface' | 'volume') {
  const result: Record<string, string> = {};

  if (shape === 'square' && params.length >= 1) {
    const a = params[0];
    if (action === 'perimeter') result.perimeter = planeShapes.square.perimeter(a);
    if (action === 'area') result.area = planeShapes.square.area(a);
  } else if (shape === 'rectangle' && params.length >= 2) {
    const [a, b] = params;
    if (action === 'perimeter') result.perimeter = planeShapes.rectangle.perimeter(a, b);
    if (action === 'area') result.area = planeShapes.rectangle.area(a, b);
  } else if (shape === 'triangle' && params.length >= 2) {
    const [a, h] = params;
    if (action === 'area') result.area = planeShapes.triangle.area(a, h);
  } else if (shape === 'circle' && params.length >= 1) {
    const r = params[0];
    if (action === 'perimeter') result.perimeter = planeShapes.circle.perimeter(r);
    if (action === 'area') result.area = planeShapes.circle.area(r);
  } else if (shape === 'parallelogram' && params.length >= 2) {
    const [a, h] = params;
    if (action === 'area') result.area = planeShapes.parallelogram.area(a, h);
  } else if (shape === 'cube' && params.length >= 1) {
    const a = params[0];
    if (action === 'surface') result.surfaceArea = solidShapes.cube.surfaceArea(a);
    if (action === 'volume') result.volume = solidShapes.cube.volume(a);
  } else if (shape === 'cuboid' && params.length >= 3) {
    const [a, b, c] = params;
    if (action === 'surface') result.surfaceArea = solidShapes.cuboid.surfaceArea(a, b, c);
    if (action === 'volume') result.volume = solidShapes.cuboid.volume(a, b, c);
  } else if (shape === 'cylinder' && params.length >= 2) {
    const [r, h] = params;
    if (action === 'surface') result.surfaceArea = solidShapes.cylinder.surfaceArea(r, h);
    if (action === 'volume') result.volume = solidShapes.cylinder.volume(r, h);
  } else if (shape === 'cone' && params.length >= 2) {
    const [r, h] = params;
    if (action === 'volume') result.volume = solidShapes.cone.volume(r, h);
  } else if (shape === 'sphere' && params.length >= 1) {
    const r = params[0];
    if (action === 'surface') result.surfaceArea = solidShapes.sphere.surfaceArea(r);
    if (action === 'volume') result.volume = solidShapes.sphere.volume(r);
  }

  return result;
}

function generateProblems(grade: number, count: number = 5) {
  const problems: string[] = [];
  const topics = getGradeTopics(grade);

  for (let i = 0; i < count; i++) {
    const topicIndex = Math.floor(Math.random() * topics.length);
    const topic = topics[topicIndex];

    let problem = '';
    if (topic.includes('周长')) {
      const a = Math.floor(Math.random() * 10) + 2;
      const b = Math.floor(Math.random() * 10) + 2;
      problem = `长方形长${a}厘米，宽${b}厘米，周长是多少？`;
    } else if (topic.includes('面积')) {
      if (topic.includes('正方形')) {
        const a = Math.floor(Math.random() * 8) + 2;
        problem = `正方形边长${a}厘米，面积是多少？`;
      } else if (topic.includes('长方形')) {
        const a = Math.floor(Math.random() * 10) + 2;
        const b = Math.floor(Math.random() * 8) + 2;
        problem = `长方形长${a}厘米，宽${b}厘米，面积是多少？`;
      } else {
        const a = Math.floor(Math.random() * 10) + 2;
        const h = Math.floor(Math.random() * 8) + 2;
        problem = `三角形底${a}厘米，高${h}厘米，面积是多少？`;
      }
    } else if (topic.includes('体积') || topic.includes('容积')) {
      if (topic.includes('正方体')) {
        const a = Math.floor(Math.random() * 5) + 2;
        problem = `正方体棱长${a}厘米，体积是多少？`;
      } else if (topic.includes('长方体')) {
        const a = Math.floor(Math.random() * 6) + 2;
        const b = Math.floor(Math.random() * 5) + 2;
        const c = Math.floor(Math.random() * 4) + 2;
        problem = `长方体长${a}厘米，宽${b}厘米，高${c}厘米，体积是多少？`;
      }
    } else {
      const a = Math.floor(Math.random() * 10) + 3;
      problem = `正方形边长${a}厘米，求周长和面积？`;
    }

    problems.push(`${i + 1}. ${problem}`);
  }
  return problems;
}

function explainConcept(concept: string) {
  const explanations: Record<string, string> = {
    周长: '周长是封闭图形一周的长度。比如：用绳子围成一个图形，绳子的长度就是周长。测量周长可以用直尺量每条边再相加，或者用滚动法。',
    面积: '面积是图形所占平面的大小。比如：铺地砖，地砖的数量就是面积。常用单位有平方厘米(cm²)、平方分米(dm²)、平方米(m²)。',
    体积: '体积是立体图形所占空间的大小。比如：往盒子里装东西，盒子能装多少就是体积。常用单位有立方厘米(cm³)、立方分米(dm³)、立方米(m³)。',
    对称轴: '如果一个图形沿着某条直线对折后两边完全重合，这条直线就是对称轴。正方形有4条，长方形有2条，圆有无数条。',
    三角形内角和: '任意三角形的三个内角加起来都等于180°。可以用量角器测量验证，也可以通过撕角拼成平角来直观理解。',
    圆周率: '圆周率π是圆的周长与直径的比值，约等于3.14。是一个无限不循环小数。我国数学家祖冲之最早精确计算到小数点后7位。',
  };
  return explanations[concept] || `关于"${concept}"的讲解：这是小学几何的重要内容，建议结合图形和生活实例来理解。`;
}
