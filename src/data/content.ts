export type ProjectCategory = "工程" | "AI" | "视觉" | "知识系统";

export const profile = {
  name: "Snake",
  positioning: "工程 × AI × 视觉",
  headline: "用 AI 重构工作，用视觉表达认知。",
  introduction: [
    "我是一名工程检测从业者，也是一名 AI 深度使用者。",
    "我正在尝试用 AI 重构工作流程、知识系统和个人表达。",
  ],
  belief: "真正的产业升级，首先发生在人的认知里。",
};

export const identities = [
  {
    number: "01",
    title: "工程实践",
    label: "ENGINEERING",
    description: "长期从事第三方工程质量检测，关注基桩、地基基础、结构实体和现场检测中的真实问题。",
  },
  {
    number: "02",
    title: "AI 工作流",
    label: "AI WORKFLOW",
    description: "把 ChatGPT、Codex、Obsidian 和知识管理工具融入日常工作，探索人和 AI 如何长期协作。",
  },
  {
    number: "03",
    title: "视觉表达",
    label: "VISUAL THINKING",
    description: "将抽象概念、社会观察和认知思考，转化为有冲击力的海报、知识卡片和视觉作品。",
  },
];

export const researchAreas = [
  {
    number: "01",
    title: "AI 与个人生产力",
    summary: "把零散工具组织成可持续的人机协作方式。",
    items: ["ChatGPT 使用方法", "Codex 工作流", "多模型协作", "Obsidian 知识管理", "AI 记忆与上下文管理", "提示词与 Skill 设计", "个人知识档案维护", "长期人机协作流程"],
  },
  {
    number: "02",
    title: "AI 改造传统行业",
    summary: "探索 AI 在工程检测中的辅助价值，同时守住专业判断边界。",
    items: ["技术规范查询与比对", "工程检测报告审查", "检测数据整理", "现场问题分析", "标准化工作模板", "团队知识库", "工作流程优化"],
    note: "AI 用于辅助分析和提高效率，不替代专业人员的最终判断。",
  },
  {
    number: "03",
    title: "概念视觉创作",
    summary: "把抽象观点转化为能够被看见、记住和传播的视觉语言。",
    items: ["产业升级系列", "认知隐喻海报", "成语与社会观察视觉化", "知识卡片", "朋友圈概念海报", "瓦猫与小蛇插画系统", "视觉提示词风格体系"],
  },
  {
    number: "04",
    title: "数字工作与知识系统",
    summary: "让工作结果进入长期知识系统，而不是散落在一次性的对话里。",
    items: ["多设备协同", "云端文档管理", "Google Drive 文件体系", "Obsidian 知识库", "ChatGPT 与 Codex 协作", "个人知识档案", "工作资料分类", "AI 内容生产流程"],
  },
];

export const projects: Array<{
  number: string;
  title: string;
  categories: ProjectCategory[];
  description: string;
  tags: string[];
  href?: string;
  note?: string;
  stats?: Array<{ value: string; label: string }>;
}> = [
  {
    number: "P-01",
    title: "AI 工程检测助手",
    categories: ["工程", "AI"],
    description: "探索如何利用 AI 辅助工程检测中的规范查询、报告审查、数据整理与现场问题分析。",
    tags: ["项目背景", "使用场景", "工作流程", "问题分析", "脱敏示例"],
    note: "AI 是辅助工具，不能替代工程检测人员的专业判断、签字责任和规范要求。",
  },
  {
    number: "P-02",
    title: "视觉提示词风格路由器",
    categories: ["AI", "视觉"],
    description: "将大量视觉模板进行分类、评级和匹配，根据主题自动选择适合的视觉表达方向。",
    tags: ["风格匹配", "避坑规则", "多模板重组"],
    stats: [
      { value: "121", label: "正式模板" },
      { value: "31", label: "S 级" },
      { value: "64", label: "A 级" },
      { value: "26", label: "B 级" },
    ],
  },
  {
    number: "P-03",
    title: "瓦猫与小蛇视觉系统",
    categories: ["视觉"],
    description: "以云南瓦猫和小蛇为核心角色，建立统一的角色、配色、构图和生成规则。",
    tags: ["角色设定", "黑橙蓝配色", "插画风格", "使用规则", "知识卡片"],
  },
  {
    number: "P-04",
    title: "Snake AI 工作系统",
    categories: ["AI", "知识系统"],
    description: "将 ChatGPT、Codex、Obsidian、Google Drive 和个人知识档案连接起来，形成一套长期演进的 AI 协作系统。",
    tags: ["角色分工", "协作流程", "知识沉淀", "持续更新"],
  },
  {
    number: "P-05",
    title: "36–104 自动尺寸拼豆图生成器",
    categories: ["视觉"],
    description: "根据主体复杂度在 36×36 到 104×104 之间逐格选择具体尺寸，生成拼豆效果图与带编号施工图，支持裁切、清晰增强、去除简单背景和实际用量统计。",
    tags: ["48 色卡", "自动尺寸", "主体留白", "图纸下载"],
    href: "/pixel-beads/",
  },
];

export const works = [
  {
    title: "产业升级",
    viewpoint: "一度电只值几毛钱，但进入算力系统后，它可以变成被模型定价的 Token。",
    description: "观察能源、算力与数字价值之间的转换关系。",
    accent: "orange",
  },
  {
    title: "沉渣泛起",
    viewpoint: "真正被时间埋下的东西，并不会因为沉默而消失。",
    description: "关于时间、记忆与被重新看见之物的视觉隐喻。",
    accent: "blue",
  },
  {
    title: "知足常乐",
    viewpoint: "不是拥有得少，而是不再让欲望决定幸福。",
    description: "用克制的构图讨论欲望、尺度与内心秩序。",
    accent: "neutral",
  },
];

export const insights = [
  "工具升级很快，真正稀缺的是提出好问题的能力。",
  "效率不是把事情做得更快，而是更少地做错事情。",
  "知识只有进入系统，才不会在一次对话后消失。",
  "专业判断不是 AI 的对立面，而是使用 AI 的前提。",
  "视觉不是装饰，它是帮助复杂观点被理解的结构。",
  "真正长期的人机协作，需要边界、记录与复盘。",
  "把经验写下来，是让下一次判断站在更高的起点。",
  "认知升级，往往从重新定义一个旧问题开始。",
];

export const workflow = [
  { title: "提出问题", role: "人定义目标与边界" },
  { title: "ChatGPT", role: "讨论、分析与决策" },
  { title: "Codex", role: "执行、整理与生成" },
  { title: "Obsidian + Google Drive", role: "归档、连接与沉淀" },
  { title: "个人知识系统", role: "持续更新与复用" },
];

export const socialLinks: Array<{ label: string; href: string }> = [];
