# Repo Onboarding：从陌生/遗留代码库到高质量 AGENTS.md 的技术调研与 Skill 设计交接

> 状态：初次技术调研 + 可实施设计草案  
> 日期：2026-09-04  
> 目标：为后续 Agent 继续细化、实现和评估一个跨 Coding Agent 的 `repo-onboarding` Skill 提供完整上下文。  
> 核心目标：**先可靠地理解仓库，再把少量高价值事实蒸馏成 agent-facing instructions；不要把仓库说明书直接塞进 `AGENTS.md`。**

---

## 0. Executive Summary

当前 Codex、Claude Code、OpenCode、GitHub Copilot、Cursor 等 Coding Agent 都已经具备 repository-level instructions 机制，但“如何从零理解一个陌生或 legacy repository，再生成高质量 instructions”的过程仍然高度碎片化：

- Codex 以 `AGENTS.md` 为主要项目指令文件，并支持层级发现；
- Claude Code 原生使用 `CLAUDE.md`，`/init` 会分析代码库生成初始指令，并可通过 `@AGENTS.md` 复用 canonical `AGENTS.md`；
- OpenCode `/init` 明确扫描重要文件、发现 build/lint/test、架构和 conventions，再生成或更新 `AGENTS.md`；
- GitHub Copilot、Cursor 已支持 `AGENTS.md`，同时各自还存在独有的 instructions/rules 体系；
- `AGENTS.md` 已成为开放格式，由 Agentic AI Foundation / Linux Foundation steward，且生态支持面很广，但它**没有规定内容 schema，也没有规定“repo understanding algorithm”**。

因此问题已经从：

> “应该用 AGENTS.md 还是 CLAUDE.md？”

转变为：

> **“Agent 在写 AGENTS.md 之前，应该如何严谨地建立 repository knowledge？”**

本调研建议把 `repo-onboarding` 定义成一个独立的上游 primitive：

```text
Repository archaeology
        ↓
Evidence-backed repository model
        ↓
Instruction candidate set
        ↓
writing-for-agents-style distillation
        ↓
Thin canonical AGENTS.md
        ↓
Context pointers → deeper docs / skills
```

这里最重要的设计决定是：

1. **Repository model 和 AGENTS.md 是两个不同产物。**
   - repository model 是 Agent 为了理解项目而建立的工作模型；
   - `AGENTS.md` 是从这个模型中蒸馏出的、always-loaded、行为导向的 repository contract / routing map。

2. **Evidence before instruction。**
   任何要进入 `AGENTS.md` 的 repo-specific rule，都必须能追溯到文档、代码、配置、CI、可执行验证或足够代表性的观察。

3. **Unknown is a valid result。**
   找不到证据时标记 unknown / partial / conflict，而不是用 Spring、Rails、Next.js 等框架默认惯例补全。

4. **AGENTS.md 不是仓库百科全书。**
   OpenAI 的 agent-first 工程实践明确把短 `AGENTS.md` 当“table of contents”，把 deeper knowledge 放在结构化 repo docs 中；Matt Pocock 的 `writing-for-agents` 同样强调 context pointers、progressive disclosure、pruning，以及不要重复环境里一眼可查的事实。

5. **不要把 domain artifacts 的职责塞进 repo-onboarding。**
   `CONTEXT.md` / ADR 属于 domain-modeling 类工作流；repo-onboarding 最多发现它们、验证它们是否存在并建立 pointer，不应自动伪造 domain glossary 或 architecture decisions。

6. **不应把任何一个 vendor `/init` 当作行业标准。**
   可以把它们视作 bootstrap implementations，但我们的目标应是一个 portable、evidence-first、vendor-neutral workflow。

---

# 1. 问题定义：为什么现有 `/init` 不够

一个典型初始化流程常常长这样：

```text
scan repo
  ↓
identify language/framework
  ↓
summarize directory structure
  ↓
copy build/test commands
  ↓
generate AGENTS.md / CLAUDE.md
```

问题是这个流程把三个不同问题压成了一步：

1. **Repository Understanding**
   - 这个仓库真实怎么工作？
   - 哪些模块是当前活跃的？
   - 一条真实请求/事件/命令如何流经系统？
   - build/test/CI 的真实 gate 是什么？

2. **Knowledge Validation**
   - README 是否已经 stale？
   - 某种 coding pattern 是 repo-wide convention，还是某个旧模块的局部写法？
   - manifest 里的 dependency 是否真的被使用？
   - “通常 Spring Boot 会这样做”是否真的适用于这个 repo？

3. **Agent Instruction Design**
   - 哪些事实值得每个 session 都加载？
   - 哪些应该留在代码/config 中让 Agent 自己查？
   - 哪些应该变成 pointer？
   - 哪些应该由 linter/test/hook 机械执行，而不是写成自然语言？

如果一步完成，最常见的失败是：

```text
one observed example
      ↓
promoted to "project convention"
      ↓
written into AGENTS.md
      ↓
all future agents obey a false rule
```

这在 legacy repository 中尤其危险，因为同一个仓库可能同时包含旧架构、迁移中的架构、新架构、deprecated module、generated code、vendor code，以及 README 中仍存在的旧命令。

因此 `repo-onboarding` 不应该只是“更深的 `/init`”，而应该是一个 **epistemically disciplined repository archaeology workflow**。

---

# 2. AGENTS.md 到底“标准”了什么

官方站点：<https://agents.md/>

当前 AGENTS.md open format 的几个关键点：

- 普通 Markdown；
- 没有 required fields；
- 推荐记录项目概览、build/test、style、testing、安全和 workflow 等 agent-relevant guidance；
- 支持 nested `AGENTS.md`；
- 明确定位为 “README for agents”；
- 已被大量 Coding Agent / IDE 支持；
- 当前由 Agentic AI Foundation（Linux Foundation）steward；
- 官方页面称已有 60k+ open-source projects 使用该格式。

### 关键结论

**AGENTS.md 标准主要标准化“可发现的文件格式和约定”，没有标准化内容生成算法。**

它没有规定：

- Agent 应先读哪些文件；
- 如何判断 architecture；
- 如何验证 build/test command；
- convention 需要什么证据；
- 如何处理 stale docs；
- 什么值得进入 AGENTS.md；
- 什么应该成为 pointer。

因此本 Skill 的机会点恰好位于 open format 的上游。

---

# 3. 各 Coding Agent 当前行为：共同目标，不同实现

> 下表描述 2026-09 调研时的公开行为。工具迭代很快，Skill 实现时应避免硬编码 vendor-specific assumptions。

| 工具 | 原生/主要项目指令 | 初始化/生成路径 | Scope / hierarchy | 对本 Skill 的启示 |
|---|---|---|---|---|
| OpenAI Codex | `AGENTS.md` | Codex 生态支持项目初始化；源码实现层级发现 | project root → CWD 收集/合并 | canonical `AGENTS.md` 很适合 Codex；避免 nested 冲突 |
| Claude Code | `CLAUDE.md` | `/init` 分析代码库；新 init 可用 subagent + follow-up questions | 多层 `CLAUDE.md`，子目录按需加载 | 可用 `CLAUDE.md` 中 `@AGENTS.md` 作为 adapter |
| OpenCode | `AGENTS.md` | `/init` 扫 important files，可提 targeted questions | V2 合并 ambient/nested instructions | 已很接近 repo-onboarding，但仍是 vendor implementation |
| GitHub Copilot | `AGENTS.md` + Copilot instructions | 多种 custom instructions 机制 | 支持 agent instructions / scoped instructions | 不应自动复制 Copilot-specific source of truth |
| Cursor | `AGENTS.md` + `.cursor/rules` | 可生成 Cursor Rules；AGENTS.md 可直接维护 | 支持 root + nested AGENTS.md | AGENTS.md 可作 portable baseline |

## 3.1 Claude Code 一个值得注意的新变化

Anthropic 当前官方文档说明：

- `/init` 会分析代码库，创建包含 build commands、test instructions、project conventions 的起始 `CLAUDE.md`；
- 已存在 `CLAUDE.md` 时会建议改进而不是盲目覆盖；
- `CLAUDE_CODE_NEW_INIT=1` 可启用 interactive multi-phase flow：选择 artifacts、subagent 探索、follow-up questions、写入前给 reviewable proposal；
- 如果 repo 已有 `AGENTS.md`，Claude Code 建议用：

```md
@AGENTS.md

## Claude Code

<Claude-specific instructions only>
```

这说明 vendor 原生 init 也正在从“一次扫描 → 自动写文件”向“更深探索 + gap questions + proposal”演进。

## 3.2 OpenCode `/init`

OpenCode 当前文档明确写到 `/init` 会：

- 扫描 important files；
- 必要时问 targeted questions；
- 捕获 build/lint/test；
- command order / focused verification；
- 非显而易见的 architecture；
- project-specific conventions；
- setup quirks / operational gotchas；
- 读取其他 instruction sources；
- 已有 AGENTS.md 时 improve in place。

我们的目标不是否定原生 `/init`，而是把优秀思想抽成一个**跨 harness、可审计、可复用的 Skill**。

---

# 4. AGENTS.md 应该是什么：Contract / Map，而不是 Repo Manual

## 4.1 OpenAI：Map, not manual

OpenAI 2026 年 Harness Engineering：

<https://openai.com/index/harness-engineering/>

其经验是：

- 巨大 `AGENTS.md` 会挤压 task/code/relevant docs；
- 指令太多时所有东西都变得“不重要”；
- monolithic manual 很快 stale；
- 难以机械校验；
- 后来把短 `AGENTS.md` 当作 **table of contents**；
- deeper knowledge 放进结构化 `docs/`；
- 通过 pointers progressive-disclose。

## 4.2 Anthropic：Cheat sheet, not documentation

来源：

<https://code.claude.com/docs/en/memory>  
<https://code.claude.com/docs/en/best-practices>

Anthropic 同样强调：

- concise instructions 更容易被遵循；
- 不要逐文件描述代码库；
- 不要写“write clean code”等 self-evident 指令；
- 将 multi-step procedures / scoped guidance 移到 skill 或 path-scoped rules；
- 把 project memory 当 cheat sheet，而不是 documentation。

## 4.3 Matt Pocock：`writing-for-agents`

来源：

<https://github.com/mattpocock/skills/blob/main/skills/productivity/writing-for-agents/SKILL.md>

对本设计最有价值的点：

### Context pointers

AGENTS.md 中的 pointer 应同时表达：

```text
什么时候需要 material + material 在哪里
```

### Context load vs cognitive load

always-loaded instruction 每一轮都在消耗 context，因此每一行都应该赚回成本。

### Progressive disclosure

所有 branches 都需要的内容 inline；只有特定分支才需要的 reference 放到 pointer 后面。

### Environment is a source of truth

如果 Agent 一眼能从 package scripts、config、目录、`--help` 得到事实，文档重复它就是一个可能 stale 的 cache。

### Pruning / no-op test

一句 instruction 如果不会改变 Agent 相对默认行为，就应该删除。

---

# 5. 2026 年实证研究：为什么“自动生成越多越好”是危险假设

## 5.1 Evaluating AGENTS.md

<https://arxiv.org/abs/2602.11988>

研究发现：

- context file 不稳定提升 task success；
- 会推动更广泛探索；
- inference cost 平均增加 20%+；
- 不必要 requirements 会让任务更难；
- human-written context 应尽量 minimal。

这不等于“AGENTS.md 没用”，而是：

> **repo understanding output 不应直接等于 always-loaded context。**

## 5.2 Configuration Smells in AGENTS.md

<https://arxiv.org/abs/2606.15828>

对 100 个流行开源 repo 的研究发现常见 smells：

- Lint Leakage：62%
- Context Bloat：42%
- Skill Leakage：35%
- 还有 Conflicting Instructions 等。

因此 Skill 必须包含 **distillation/audit gate**，而不是只有 discovery。

---

# 6. 已有 Skill precedent：ECC vs quokkify

## 6.1 ECC `codebase-onboarding`

<https://github.com/affaan-m/ECC/blob/5deee34c93395045b985e3baf91550e5f1ab7204/skills/codebase-onboarding/SKILL.md>

ECC 版本的重要价值：

```text
Reconnaissance
  ↓
Architecture
  ↓
Convention discovery
  ↓
Onboarding artifacts / starter CLAUDE.md
```

优势：

- 不要求读完整 repo；
- 检测 manifests/framework/test/build；
- architecture + conventions；
- “verify, don't guess”；
- 有 onboarding guide。

局限：

- 原始版本明显 Claude-centric；
- framework fingerprinting 较强；
- convention evidence model formalization 不足；
- understanding 与 instruction generation 仍较耦合。

ECC 是 MIT License。若后续直接复制 substantial text，应保留对应许可声明。

## 6.2 quokkify adaptation

<https://github.com/quokkify/skills/blob/main/skills/repository/codebase-onboarding/SKILL.md>

metadata 明确标注 upstream ECC 固定 commit 和 MIT。

它对本项目更有价值的改良：

1. **Evidence classification**
   - documented rule
   - observed convention
   - local exception
   - unknown

2. **Real flow tracing**
   - 要求 trace representative path；
   - 缺失边界标 partial；
   - 不用 framework default 补洞。

3. **Sampling before convention**
   - sample multiple files 才能升级为 convention。

4. **Verification model**
   - fast/small-change；
   - full gate；
   - prerequisites；
   - containers/services/credentials/network。

5. **First-change guide**
   - 目标是让 developer/agent 能安全完成 first change。

6. **Vendor-neutral output**
   - 默认 summary；
   - 只有请求时才改 instruction file；
   - 避免重复 source of truth。

我们应该继承这些**设计原则**，而不是简单复制文字。

---

# 7. Proposed `repo-onboarding`：职责边界

## 7.1 负责

1. 深度但选择性地调查陌生 repo；
2. 建立 evidence-backed repository model；
3. 找出真实 build/test/lint/typecheck/CI/verification path；
4. trace representative runtime flow；
5. 识别 architecture boundaries；
6. 区分 documented / verified / observed / exception / conflict / unknown；
7. 形成 first-change navigation；
8. 当用户请求时，从 verified facts 中产生 instruction candidates；
9. 使用 `writing-for-agents`（如果可用）做最终 distillation；
10. 创建/更新 thin canonical `AGENTS.md`；
11. 必要时建议 nested `AGENTS.md`；
12. 保留已有 instructions，不制造重复 source of truth。

## 7.2 不负责

- 自动写产品 spec；
- 自动写 implementation plan；
- 把 README 重写成 AGENTS.md；
- 自动创造 `CONTEXT.md` glossary；
- 自动创造 ADR；
- 自动把所有 architecture knowledge 持久化；
- 自动安装 dependencies；
- 为 onboarding 启动昂贵 container stack / paid API / production action；
- 把 framework best practice 冒充 repo convention；
- 把一个 sample 当团队标准；
- 创建多套重复 agent instruction。

---

# 8. 核心架构：Evidence Ledger → Instruction Candidates

## 8.1 Evidence Ledger

调查时维护一个 working ledger：

| Claim | Evidence | Scope | Source | Status |
|---|---|---|---|---|
| Maven wrapper is canonical | mechanically verified | repo | `mvnw`, CI | verified |
| Integration tests need Docker | docs + CI | integration | docs/workflow | verified |
| Constructor injection is normal | observed | `service-a` | sampled files | observed |
| Entire repo mandates it | insufficient | repo | only service-a | unknown |
| README says Java 17, POM says 21 | conflict | repo | README/POM | conflict |

默认可以是 **ephemeral working state**，不必写进 repo。

建议证据类型：

- mechanically verified
- documented
- observed convention
- local exception
- historical support
- conflict
- unknown

其中 documented ≠ current；若与代码/config 冲突则升级为 conflict。

## 8.2 Instruction Candidate Set

只有 evidence 成立后才产生 candidate。

每条 candidate 必须回答：

```text
1. What behavior should this change?
2. What evidence supports it?
3. What scope does it apply to?
4. Is it non-obvious / expensive to rediscover?
5. Is it stable enough to persist?
6. Is AGENTS.md the right tier?
7. Could this be a pointer instead?
8. Could this be enforced mechanically instead?
```

不通过 gate 就删。

**这是本 Skill 与普通 `/init` 最本质的差异。**

---

# 9. Proposed Workflow

## Phase 0 — Establish scope and authority

先找：

- root/parent/nested `AGENTS.md`
- `CLAUDE.md`
- `.claude/rules/`
- `.github/copilot-instructions.md`
- `.github/instructions/*`
- `.cursor/rules/`
- `CONTRIBUTING*`
- developer/security/release/runbook docs

先尊重当前 hierarchy，再做 onboarding。

## Phase 1 — Repository Archaeology

调查：

### Identity / boundaries
- purpose
- monorepo/library/service collection
- workspace/module
- runtime/language version

### Manifests
- build files
- lockfiles
- toolchains
- wrappers

### Entry points
- startup
- routes
- CLI
- workers
- jobs
- public API

### Runtime/deployment
- env
- Docker
- k8s
- deployment
- services

### Verification
- unit/integration
- lint/typecheck/build
- static analysis
- CI
- scripts/hooks

### History
- recent changes
- active areas
- migration/refactor signals

纪律：

- shallow tree first；
- targeted search；
- selective read；
- 不 recursive dump；
- generated/vendor/cache/build 默认排除。

## Phase 2 — Architecture Map

建立：

- runtime processes
- package/service boundaries
- interfaces
- domain/application logic location
- persistence/external service
- generated code
- dependency direction

至少 trace 一条真实 flow。

Web：

```text
HTTP → controller → validation/auth → logic → persistence/external → response/event
```

Event：

```text
event → consumer → validation → handler → domain/persistence → side effect
```

CLI：

```text
command → parser → service/use case → boundary → output
```

Library：

```text
public API → core abstraction → implementation → boundary/return
```

找不到的边界标 partial。

## Phase 3 — Convention Detection

不能：

```text
看到一个文件 → 宣布 repo convention
```

应该：

- sample multiple representative files；
- 尽量跨 module/author/time；
- 找 counterexample；
- 标 scope；
- 样本少则记录 sample size；
- 区分 documented / mechanically verified / observed / local / conflict / unknown。

Legacy repo 要主动寻找不同 architectural eras。

## Phase 4 — Verification Model

目标不是只找到 `mvn test`，而是：

```text
Fast / focused
Full gate
Prerequisites
CI-only / restricted
Side effects
```

command evidence 优先：

1. CI 真实 command；
2. repo-owned wrapper/script/task runner；
3. build manifest；
4. maintained dev docs；
5. README；
6. framework default 只能当搜索提示。

允许安全验证：

- `--help`
- list tasks
- dry-run
- 已有环境可跑的 focused low-cost check

默认不要：

- 安装大量依赖
- 启 container stack
- migration
- paid API
- deploy
- remote write

不能执行就写：

> discovered, not runtime-validated

绝不能伪装成通过。

## Phase 5 — First-Change Map

回答：

```text
I want to change X → where do I start, what else is usually touched, how do I verify?
```

例如：

- feature
- API
- migration
- background event
- config
- tests
- deployment
- generated artifacts

只做导航，不做 implementation plan。

## Phase 6 — Material Unknowns

只询问会改变以下结果的问题：

- canonical build/test command；
- architecture boundary；
- dangerous operation；
- repo-wide convention；
- instruction scope。

其他 unknown 记录即可。

## Phase 7 — Distillation

只在用户要求写 instructions 时执行。

如果有 Matt `writing-for-agents`：

```text
repository model
→ instruction candidates
→ writing-for-agents
→ AGENTS.md
```

否则使用 fallback inclusion test：

- 是否改变行为？
- 是否 repo-specific？
- 是否不容易重新发现？
- 是否稳定？
- 是否大多数任务需要？
- 是否应该 pointer？
- 是否更适合机械 enforce？

---

# 10. Root AGENTS.md：建议 heuristic

不是 schema，只是参考：

```md
# Repository

<Only non-obvious orientation.>

## Working agreements
- <high-value constraint>

## Verification
- Fast: `<command>`
- Full: `<command>`
- <prerequisite / restriction>

## Architecture boundaries
- <important invariant>
- <pointer>

## Where to look
- When <branch>, read `<target>`.
- When <branch>, start at `<path>`.
```

通常不值得写：

```md
- This project uses Java.
- Tests are under src/test/java.
- Write clean code.
- Follow SOLID.
- Add comments where appropriate.
```

除非存在真实的 non-obvious consequence。

---

# 11. Nested AGENTS.md Strategy

适合 nested：

- monorepo 子项目栈不同；
- scoped build/test command 不同；
- legacy/new area 规则真实不同；
- 子目录有高价值 scoped constraint。

不适合：

- 仅为了把 root 拆短；
- 内容其实 repo-wide；
- 会制造重复和冲突。

不同 harness 的 merge/precedence 并不完全一致，所以最安全原则是：

> **nested instructions 尽量 additive，不要依赖“否定 root”才能正确运行。**

---

# 12. Canonical Source 与 Vendor Adapters

推荐：

```text
AGENTS.md              ← canonical shared instructions
CLAUDE.md              ← optional import adapter
.cursor/rules/*        ← Cursor-specific only
.github/...            ← Copilot-specific only
```

Claude：

```md
@AGENTS.md

## Claude Code

<Only Claude-specific instructions>
```

不要复制同一规则四份。

---

# 13. CONTEXT.md / ADR / docs / skills 边界

```text
AGENTS.md
    ├── pointer → CONTEXT.md
    ├── pointer → docs/adr/*
    ├── pointer → architecture/runbook docs
    └── pointer → skills
```

但 `repo-onboarding` 不自动创建它们。

### CONTEXT.md
domain glossary / ubiquitous language；交给 domain-modeling。

### ADR
只有 hard-to-reverse、surprising、real trade-off 的真实决策；不能从代码猜 rationale。

### docs/agents/*
较长 testing/runbook/architecture navigation。

### Skills
多步骤、条件触发、可复用 procedure。

AGENTS.md 保留 pointers。

---

# 14. 与 Matt Skills 的组合

```text
repo-onboarding
    ↓
evidence-backed repo model
    ↓
instruction candidates
    ↓
writing-for-agents
    ↓
thin AGENTS.md
```

后续：

```text
domain-modeling
    ↓
CONTEXT.md + ADR

setup-matt-pocock-skills
    ↓
routing / tracker / docs location
```

职责：

- repo-onboarding：现有 repo 能可靠知道什么；
- writing-for-agents：怎么写给 Agent；
- domain-modeling：澄清 domain model；
- setup：wiring。

---

# 15. Legacy Repository 专项风险

## Stale docs
README command != CI command → conflict，不静默信 README。

## Multiple eras
old pattern + migration pattern + new pattern → 按 scope，不自动 root 化。

## Dead dependency
manifest presence ≠ active use → search actual imports/call paths。

## Generated code
识别 generator；instructions 更应该写“别直接改 + 如何 regenerate”。

## Expensive verification
明确 Fast / Full / Prerequisite / CI-only。

## Hidden org knowledge
repo 无证据 → unknown / targeted question，而不是猜。

---

# 16. Completion Criteria

完整 onboarding 至少满足：

- [ ] existing instructions 已找到并遵守；
- [ ] purpose / major boundaries 有 evidence；
- [ ] entry points 已确定；
- [ ] 至少一条 representative flow 被 trace 或明确 partial；
- [ ] build/test/lint/typecheck/CI surface 已调查；
- [ ] Fast / Full / Prerequisite 能区分适用部分；
- [ ] 无 invented command；
- [ ] convention 来自代表性 evidence；
- [ ] documented / observed / exception / conflict / unknown 区分；
- [ ] first-change map 可用；
- [ ] 若写 AGENTS.md，每条重要 instruction 可追 evidence；
- [ ] 没有大段复制环境一眼可查 facts；
- [ ] branch-specific detail 优先 pointer；
- [ ] 不制造重复 vendor sources；
- [ ] 未经要求不执行 heavyweight / side-effectful operations。

---

# 17. Anti-Patterns

- **README Echo**：把 README 改写进 AGENTS。
- **Framework Fanfic**：用 Spring/Next 默认结构补未知。
- **One-Sample Convention**：一个文件升格为规范。
- **Architecture by Directory Name**：目录名当架构证据。
- **Dependency = Usage**：manifest 依赖当 active architecture。
- **Command Invention**：猜 test/build/deploy。
- **Context Dump**：repository model 全塞 AGENTS。
- **Vendor Duplication**：AGENTS/CLAUDE/Copilot/Cursor 四份复制。
- **Stale Cache**：复制 package/config 易查事实。
- **History Worship**：最近 commit 当正式 policy。
- **Premature ADR**：从代码猜 rationale。
- **Fake Verification**：没执行却报告 passed。

---

# 18. Skill 文件结构建议

```text
repo-onboarding/
├── SKILL.md
├── PROBES.md
└── REFERENCES.md
```

- `SKILL.md`：主 workflow；
- `PROBES.md`：按语言/构建生态 progressive-disclose；
- `REFERENCES.md`：外部来源和 provenance，不污染 runtime context。

---

# 19. Java Legacy Repo：重点 Probes

## Build

- Maven/Gradle wrapper；
- parent/modules；
- Java toolchain；
- Spring Boot version；
- profiles；
- company plugins/repos。

## Verification

Maven：

- Surefire vs Failsafe；
- `-pl` / `-am`；
- `verify`；
- Checkstyle / Spotless / PMD / SpotBugs；
- JaCoCo；
- profile-gated suites。

Gradle：

- tasks；
- custom test suites；
- check；
- integrationTest；
- build cache。

## Runtime

- Spring profiles；
- env；
- DB；
- Docker；
- Kafka/Rabbit/Redis；
- internal auth/VPN；
- Testcontainers。

## Architecture

不要假设三层，实际 trace：

```text
Controller
→ Facade/UseCase/Service
→ Domain
→ transaction boundary
→ Repository/Mapper/Client
→ response/event
```

## Tests

区分 unit / slice / SpringBootTest / contract / Testcontainers / environment integration。

**Probe 只是去哪里找 evidence，不是自动生成规则。**

---

# 20. Evaluation Plan：怎么证明优于 `/init`

不要只比较“文档看起来好不好”。

## Repo sample

至少：

1. 小型单体；
2. Java legacy multi-module；
3. JS/TS monorepo；
4. 文档良好 repo；
5. 文档 stale repo。

## Baselines

- Codex native init；
- Claude `/init`；
- OpenCode `/init`；
- `repo-onboarding`。

## Artifact metrics

### Command validity
- exists?
- syntax valid?
- CI uses?
- prerequisite documented?

### Evidence precision
随机抽 repo-specific claims：
- 有 source？
- scope 对？
- 有 counterexample？

### Context quality
- root lines；
- duplicate facts；
- generic no-op；
- file-by-file descriptions；
- pointer ratio；
- conflict count。

### Navigation
给出任务：
- change API
- add field
- fix worker
- change migration
- add focused test

看 agent 是否快速到正确起点。

## Task-level A/B

```text
no AGENTS
native-init AGENTS
repo-onboarding AGENTS
```

观察：

- task pass rate
- tool calls
- tokens/cost
- wrong-file edits
- unnecessary full tests
- violations
- time-to-first-relevant-file

---

# 21. Open Questions

1. bare invocation 是否默认只 map，还是直接写 AGENTS？
2. Evidence Ledger 是否默认只在内存？
3. Java/JS/Python probes 是否需要更细 reference？
4. update existing AGENTS 如何做 provenance-aware merge？
5. 是否自动创建 Claude `@AGENTS.md` adapter？
6. root 是否需要 soft size warning？
7. subagents 是否值得用于并行 archaeology？
8. 是否另拆 `audit-agents-md` Skill？
9. 如何与 `writing-for-agents` 可选组合但不硬依赖？
10. 如何做 fixture repo regression tests？

建议 v0.1：

```text
1. Existing instructions discovery
2. Shallow reconnaissance
3. Evidence ledger
4. Representative flow trace
5. Convention sampling
6. Verification classification
7. First-change map
8. AGENTS distillation
9. Instruction audit
```

---

# 22. 十条最终原则

1. **Understand before instruct.**
2. **Evidence before instruction.**
3. **Unknown beats plausible.**
4. **Sample before convention.**
5. **Trace behavior, not directory names.**
6. **Validate commands; never invent them.**
7. **Repository model ≠ AGENTS.md.**
8. **AGENTS.md is a contract/map, not a manual.**
9. **Point to deeper context; do not inline every branch.**
10. **Prefer one canonical source of truth across agents.**

---

# 23. Source Index

## Standards / vendor docs

- AGENTS.md open format  
  <https://agents.md/>

- OpenAI — Harness engineering  
  <https://openai.com/index/harness-engineering/>

- OpenAI Codex — AGENTS.md discovery implementation  
  <https://github.com/openai/codex/blob/main/codex-rs/core/src/agents_md.rs>

- Claude Code — Memory / `/init` / AGENTS import  
  <https://code.claude.com/docs/en/memory>

- Claude Code — Best practices  
  <https://code.claude.com/docs/en/best-practices>

- OpenCode — Rules / `/init`  
  <https://opencode.ai/docs/rules/>

- GitHub Copilot — Repository custom instructions  
  <https://docs.github.com/en/copilot/how-tos/configure-custom-instructions-in-your-ide/add-repository-instructions-in-your-ide>

- Cursor — Rules / AGENTS.md  
  <https://prod.cursor.com/docs/rules>

## Skill references

- Matt Pocock — `writing-for-agents`  
  <https://github.com/mattpocock/skills/blob/main/skills/productivity/writing-for-agents/SKILL.md>

- Matt Pocock — `domain-modeling`  
  <https://github.com/mattpocock/skills/blob/main/skills/engineering/domain-modeling/SKILL.md>

- ECC — `codebase-onboarding` baseline  
  <https://github.com/affaan-m/ECC/blob/5deee34c93395045b985e3baf91550e5f1ab7204/skills/codebase-onboarding/SKILL.md>

- quokkify — adapted `codebase-onboarding`  
  <https://github.com/quokkify/skills/blob/main/skills/repository/codebase-onboarding/SKILL.md>

## Research

- Gloaguen et al. — *Evaluating AGENTS.md*  
  <https://arxiv.org/abs/2602.11988>

- dos Santos et al. — *Configuration Smells in AGENTS.md Files*  
  <https://arxiv.org/abs/2606.15828>

---

# 24. Handoff Note

下一位 Agent 建议优先细化：

1. Evidence Ledger 最小模型；
2. bare invocation UX；
3. instruction-candidate gate；
4. legacy repo multi-era convention detection；
5. canonical instruction source detection；
6. AGENTS update/merge strategy；
7. fixture repos + A/B evaluation；
8. `audit-agents-md` 是否拆分；
9. optional `writing-for-agents` integration；
10. Skill 自身的 progressive disclosure / context budget。

同时阅读附带的 `repo-onboarding/SKILL.md` v0.1 和 `PROBES.md`，将其视为设计起点，而不是最终标准。
