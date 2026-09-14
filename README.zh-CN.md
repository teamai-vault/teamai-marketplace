# Team AI Marketplace

中文 | [English](README.md)

这是团队内部的 GitHub Copilot Plugin Marketplace，用于集中维护可复用的 Team AI capabilities。

这个 Repo 是共享 Common、Role 以及未来 Product capabilities 的 **Git-native canonical source**。它直接使用 GitHub Copilot Marketplace 与 Agent Plugins 1.0 规范，不定义 Team AI 私有 Plugin 格式。

## Repo 架构

```text
teamai-marketplace/
├── .github/
│   └── plugin/
│       └── marketplace.json
├── plugins/
│   ├── common/
│   │   ├── plugin.json
│   │   ├── skills/
│   │   └── com.github.copilot/
│   │       └── agents/
│   ├── role-api/
│   ├── role-ios/
│   ├── role-aos/
│   ├── role-qa/
│   └── role-design/
│       ├── plugin.json
│       ├── skills/.gitkeep
│       └── com.github.copilot/
│           ├── agents/.gitkeep
│           ├── rules/.gitkeep
│           └── hooks/.gitkeep
├── docs/
├── scripts/
└── test/
```

`role-design` 中故意保留了少量带 `.gitkeep` 的空原生 capability 目录，用于说明 Agent Plugin 可以承载的位置，但不会为了“填目录”伪造无意义的 Skill / Agent / Hook。

## Capability 归属

| 类型 | 示例 | 含义 |
| --- | --- | --- |
| Common | `common` | 多个 Role 都能使用的共享能力 |
| Role | `role-api`、`role-design` | 某个职业/职能共享能力 |
| Product | `product-payments` | 未来多个真实 Repo 共用的产品能力 |
| Project | 不放在这里 | 必须跟真实业务 Repo 的 `.github/*` 一起版本管理 |

中央 Plugin 内的 Skill / Agent 等名称应尽量保持唯一。名称冲突视为 packaging/configuration error，而不是引入复杂 override engine 的理由。

## Marketplace manifest 位置

本 Repo 的 canonical manifest 位于：

```text
.github/plugin/marketplace.json
```

这是 GitHub Copilot Marketplace 创建指南推荐的布局。

同时已经使用本机 GitHub Copilot CLI `1.0.83` 做过真实兼容性测试：root `marketplace.json` 和 `.github/plugin/marketplace.json` 两种目录都可以成功 `marketplace add` 与 `browse`。既然两者都支持，本 Repo 选择跟随创建指南的 `.github/plugin/marketplace.json`。

## Agent Plugins 1.0

每个 Plugin 自己拥有 root `plugin.json`，使用 Agent Plugins 1.0 schema。

Portable capability 放在标准目录，例如：

```text
skills/
```

Copilot-specific capability 放在：

```text
com.github.copilot/
  agents/
  rules/
  hooks/
  commands/
```

以后如果出现真实共享 MCP 场景，也应使用 Agent Plugin 原生 MCP 机制，而不是让 Team AI 自己实现 MCP converter / injector。

## 当前 Plugins

- `common`：跨 Role 公共能力，当前包含少量 example review 内容。
- `role-api`：API/backend 角色，当前包含少量 Java/backend example。
- `role-ios`：iOS Role package shell。
- `role-aos`：Android Role package shell。
- `role-qa`：QA Role package shell。
- `role-design`：产品/体验设计 Role shell，保留明确的 `.gitkeep` placeholder。

所有示例内容都会明确标注 Example，不会伪装成公司生产级规范。

## 验证

```text
npm run validate
npm test
```

Validator 会检查 Marketplace catalog、Agent Plugins 1.0 manifest、Plugin source、Skill 目录与 frontmatter 名称一致性，以及中央 Skill 重名。

## 使用 Copilot CLI 本地测试

```text
copilot plugins marketplace add <path-to-teamai-marketplace>
copilot plugins marketplace browse company-ai
copilot plugins install common@company-ai
copilot plugins install role-api@company-ai
```

Design Role：

```text
copilot plugins install role-design@company-ai
```

测试后按需清理：

```text
copilot plugins remove common@company-ai
copilot plugins remove role-api@company-ai
copilot plugins marketplace remove company-ai
```

## 新增 Capability

1. 先判断它属于 Common、Role、Product，还是只属于某个真实 Project。
2. 共享能力放到对应 Agent Plugin，并使用原生 Agent Plugin 目录。
3. 中央资源名称保持唯一。
4. 不为了架构图创建无意义空 abstraction；只有确实需要表达“这里是受支持的原生扩展点”时才使用 `.gitkeep`。
5. 发布新版本时同步更新 `plugin.json` 与 `.github/plugin/marketplace.json` 中的版本。
6. Review 前运行 validator/test。

更多规则见 [`docs/PLUGIN-GUIDE.md`](docs/PLUGIN-GUIDE.md) 与 [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md)。

## 当前明确不做

- 自定义 Plugin / Skill / Hook / MCP 格式；
- 把资源复制到不同 IDE 的私有目录；
- 通用 merge / override engine；
- TeamWiki、Recall、Learning、telemetry、dashboard；
- 替代 Copilot 原生 Marketplace / Plugin Manager。
