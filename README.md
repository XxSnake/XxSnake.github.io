# Snake 个人主页｜第一版

一个围绕“工程 × AI × 视觉”的单页个人数字主页。第一版只使用本地静态数据，不依赖数据库、后端或实时接口。

## 启动方法

需要 Node.js 20 或更高版本。

```bash
pnpm install
pnpm dev
```

浏览器打开终端里显示的本地地址即可预览。

生产构建：

```bash
pnpm build
pnpm preview
```

## 内容配置位置

所有可持续更新的文案和数据都集中在 `src/data/content.ts`：

- `profile`：个人介绍与首页核心文案
- `identities`：三个身份标签
- `researchAreas`：四个研究方向
- `projects`：项目列表及分类
- `works`：视觉作品列表
- `insights`：随机认知卡片
- `workflow`：AI 工作流程
- `socialLinks`：公开社交链接

主题色和页面样式位于 `src/styles.css`。

## 待替换素材清单

当前作品墙的三张图片均为统一生成的抽象占位视觉：

1. 《产业升级》作品图
2. 《沉渣泛起》作品图
3. 《知足常乐》作品图

替换点位于 `src/components/PlaceholderVisual.tsx`，代码中以 `TODO: ASSET_REPLACE` 标记。建议后续作品使用统一的 4:3 比例。

联系方式尚未提供，当前显示说明性占位。配置点位于 `src/data/content.ts` 的 `socialLinks`，组件中以 `TODO: CONTACT_REPLACE` 标记。

## 第一版之后可做的优化

- 换入 Snake 的真实视觉作品，并逐项补充作品说明
- 补充经授权的公开社交账号
- 使用真实且已脱敏的工程案例替换项目说明中的概括内容
- 根据上线后的实际阅读情况微调首页文案与模块顺序

第一版没有加入登录、评论、聊天、数据库、后台、三维场景或复杂动画。

## 在线发布

推送到 `main` 分支后，GitHub Actions 会自动构建并发布到 GitHub Pages。
