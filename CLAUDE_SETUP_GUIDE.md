# Claude Code Complete Setup Guide — Browser Utils Library

> Hướng dẫn chi tiết cách setup Claude Code (CC) cho project ngockhoi96,
> bao gồm CLAUDE.md, .claude/ folder, skills, hooks, rules, MCP servers, workflows.

---

## 1. Tổng Quan Kiến Trúc .claude

```
ngockhoi96/
├── CLAUDE.md                    # Team instructions — committed to git
├── CLAUDE.local.md              # Personal overrides — gitignored
├── PRD.md                       # Product Requirements Document — committed
├── .claude/
│   ├── settings.json            # Permissions + config — committed
│   ├── settings.local.json      # Personal permission overrides — gitignored
│   ├── .mcp.json                # MCP server configs — committed (no secrets!)
│   ├── rules/                   # Modular instruction files
│   │   ├── code-style.md
│   │   ├── testing.md
│   │   └── publishing.md
│   ├── skills/                  # Auto-invoked or /slash-command workflows
│   │   ├── implement/
│   │   │   └── SKILL.md
│   │   ├── test/
│   │   │   └── SKILL.md
│   │   ├── release/
│   │   │   └── SKILL.md
│   │   └── review/
│   │       └── SKILL.md
│   ├── commands/                # Manual /slash commands
│   │   ├── scaffold.md
│   │   ├── check-bundle.md
│   │   └── prep-release.md
│   └── agents/                  # Specialized subagent personas
│       ├── code-reviewer.md
│       └── test-writer.md
├── src/
├── tests/
├── package.json
└── tsdown.config.ts
```

### Nguyên tắc vàng

1. **CLAUDE.md < 150 lines** — Chỉ chứa thứ áp dụng cho MỌI session. Mỗi dòng phải trả lời "CC sẽ sai nếu không có dòng này?"
2. **Rules cho domain-specific** — Split ra `.claude/rules/` khi CLAUDE.md phình to
3. **Skills cho on-demand** — Kiến thức chuyên sâu chỉ load khi cần
4. **Hooks cho deterministic** — Những gì PHẢI xảy ra mỗi lần, không ngoại lệ
5. **Commands cho manual triggers** — Workflow bạn gõ tay

---

## 2. CLAUDE.md

File quan trọng nhất. CC đọc nó ở đầu MỌI session.

```markdown
# Browser Utils Library

## What
Modular, tree-shakeable browser utilities library. Core: clipboard APIs.
See @PRD.md for full product requirements.

## Stack
- TypeScript (strict), tsdown (bundler), Vite (playground)
- Vitest (unit), Playwright (E2E)
- pnpm, Biome (lint+format), GitHub Actions
- changesets (versioning)

## Project Structure
src/clipboard/     — clipboard utilities (copy, read, detect)
src/utils/         — shared internal helpers
tests/unit/        — vitest unit tests
tests/e2e/         — playwright browser tests
docs/              — VitePress documentation (future)

## Commands
pnpm build         — build with tsdown (ESM + CJS + .d.ts)
pnpm test          — run vitest unit tests
pnpm test:e2e      — run playwright E2E tests
pnpm lint          — biome check
pnpm lint:fix      — biome check --fix
pnpm size          — check bundle size with size-limit
pnpm validate      — run publint + attw

## Code Style
- ES modules (import/export), never CommonJS
- No default exports — always named exports
- Strict TypeScript — no `any`, no `as` casts unless documented why
- Functions return boolean/null for failure, never throw for expected errors
- Every exported function has TSDoc comments
- Zero dependencies — only browser native APIs

## Testing
- Unit tests mock navigator.clipboard — test logic, not browser
- E2E tests use real browsers via Playwright
- Target: 100% coverage on core functions
- Run single test file when iterating, full suite before commit

## Git
- Conventional commits: feat/fix/chore/docs(scope): description
- Always create branch for new work, never commit to main directly
- Run `pnpm lint && pnpm test && pnpm build` before any commit

## IMPORTANT
- NEVER add runtime dependencies to package.json
- ALWAYS verify tree-shaking works after adding new exports
- When compacting, preserve: current task, modified files list, test status
```

### Tại sao format này?

- **WHAT → STACK → STRUCTURE → COMMANDS → STYLE → RULES** — Theo thứ tự CC cần để hiểu project
- Mỗi section ngắn, scan được nhanh
- Commands section cho CC biết cách verify công việc
- IMPORTANT section ở cuối = peripheral position = CC nhớ tốt hơn

---

## 3. PRD.md — Có nên tạo không?

**CÓ.** Nhưng KHÔNG nhét vào CLAUDE.md. Dùng `@PRD.md` reference.

Tại sao tách:
- PRD dài (200+ lines) → nhét vào CLAUDE.md = dilute mọi instruction khác
- CC chỉ load PRD khi cần (nhờ `@` import) thay vì mỗi session
- PRD là reference doc, không phải instruction

Cách dùng trong session:
```
> Read @PRD.md and implement the copyToClipboard function from section 4.1
```

---

## 4. .claude/rules/ — Modular Instructions

Khi CLAUDE.md bắt đầu > 100 lines, split rules ra:

### .claude/rules/code-style.md
```markdown
# Code Style Rules

## TypeScript
- Use `interface` for object shapes, `type` for unions/intersections
- Prefer `const` assertions where possible
- No enums — use const objects with `as const`
- Generic constraints: always provide meaningful defaults

## Naming
- Functions: camelCase, verb-first (copyToClipboard, isSupported)
- Types/Interfaces: PascalCase (ClipboardOptions, BrowserUtilsError)
- Constants: SCREAMING_SNAKE for true constants only
- Files: kebab-case (copy-to-clipboard.ts)

## Exports
- Named exports only, no default exports
- Barrel files (index.ts) re-export from modules
- Every public export must have TSDoc
```

### .claude/rules/testing.md
```markdown
# Testing Rules

## Unit Tests (Vitest)
- File naming: `{module}.test.ts` next to source
- Use `describe` blocks grouped by function
- AAA pattern: Arrange → Act → Assert
- Mock browser APIs at module level, restore in afterEach
- Test error paths explicitly — happy path is not enough

## E2E Tests (Playwright)
- File naming: `{feature}.spec.ts` in tests/e2e/
- Each test must be independent — no shared state
- Test in Chromium + Firefox + WebKit
- Use proper page.evaluate() for clipboard operations

## Coverage
- Core functions: 100% line + branch coverage
- Don't chase 100% on barrel files or type-only files
```

### .claude/rules/publishing.md
```markdown
# Publishing Rules

## package.json exports
- Always define "exports" map with import/require/types conditions
- "sideEffects": false is mandatory
- "files" must only include "dist"

## Validation before publish
- publint: validates package.json correctness
- arethetypeswrong (attw): validates .d.ts resolution
- size-limit: fails if bundle > threshold

## Versioning
- Use @changesets/cli for all version bumps
- Pre-1.0: breaking = minor, patches = patch
- Post-1.0: strict semver
- Never manually edit version in package.json
```

---

## 5. .claude/skills/ — On-Demand Knowledge

Skills load CHỈ KHI relevant. Dùng cho workflow phức tạp.

### .claude/skills/implement/SKILL.md
```markdown
---
name: implement
description: Implement a new browser utility function. Use when adding new API functions to the library.
---

# Implement New Utility

## Checklist
1. Create source file in appropriate module directory (e.g., src/clipboard/)
2. Add types to types.ts in the module
3. Implement function with:
   - Input validation
   - Feature detection (isSupported check)
   - Try/catch with typed error codes
   - TSDoc comment with @example
4. Export from module's index.ts barrel
5. Export from root src/index.ts
6. Write unit tests covering: success, failure, unsupported, edge cases
7. Run `pnpm test` — must pass
8. Run `pnpm build` — verify output includes new export
9. Run `pnpm validate` — verify package exports resolve correctly
10. Run `pnpm size` — verify bundle size delta is acceptable

## Template
```typescript
/**
 * Brief description of what this does.
 *
 * @param param - Description
 * @returns Description of return value
 *
 * @example
 * ```ts
 * const result = await myFunction('input');
 * ```
 */
export async function myFunction(input: string): Promise<boolean> {
  if (!isMyApiSupported()) {
    console.warn('MyAPI is not supported in this browser');
    return false;
  }

  try {
    // implementation
    return true;
  } catch (error) {
    console.error('myFunction failed:', error);
    return false;
  }
}
```
```

### .claude/skills/release/SKILL.md
```markdown
---
name: release
description: Prepare a new release. Use when versioning, changelog, or publishing.
disable-model-invocation: true
---

# Release Workflow

## Steps
1. Ensure all tests pass: `pnpm test && pnpm test:e2e`
2. Ensure build is clean: `pnpm build`
3. Run validations: `pnpm validate`
4. Check bundle size: `pnpm size`
5. Create changeset: `pnpm changeset`
   - Select change type (major/minor/patch)
   - Write human-readable summary
6. Version packages: `pnpm changeset version`
   - This updates package.json version + CHANGELOG.md
7. Review CHANGELOG.md — edit if needed
8. Commit: `git add . && git commit -m "chore: version bump"`
9. Tag: `git tag v$(node -p "require('./package.json').version")`
10. Push: `git push && git push --tags`
11. CI will handle npm publish via GitHub Actions

## IMPORTANT
- NEVER publish manually with `npm publish`
- ALWAYS go through changeset workflow
- ALWAYS verify CI passes before merging to main
```

### .claude/skills/review/SKILL.md
```markdown
---
name: review
description: Review code changes for quality, security, and library best practices.
---

# Code Review Checklist

## API Design
- [ ] Function signature is intuitive and minimal
- [ ] Return types are predictable (boolean for success/fail, null for "no data")
- [ ] No unnecessary options — only add what users need NOW
- [ ] Error codes are typed and documented

## Bundle Impact
- [ ] No new dependencies added
- [ ] Tree-shaking verified (run `pnpm build` and check output)
- [ ] Bundle size delta < 200B gzip

## TypeScript
- [ ] No `any` types
- [ ] No `as` type assertions without comment explaining why
- [ ] Generics have meaningful constraints
- [ ] Exported types are documented

## Security
- [ ] No eval, innerHTML, or dynamic script injection
- [ ] Feature detection before API access
- [ ] Secure context checks where required
- [ ] No sensitive data in console.log

## Testing
- [ ] Unit tests cover: success, failure, unsupported, edge cases
- [ ] E2E test for real browser behavior (if applicable)
- [ ] No flaky tests — deterministic assertions only
```

---

## 6. .claude/commands/ — Manual Workflows

Commands = bạn gõ `/project:command-name` để trigger.

### .claude/commands/scaffold.md
```markdown
Scaffold a new utility module named $ARGUMENTS in the src/ directory.
Create:
1. src/$ARGUMENTS/index.ts (barrel export)
2. src/$ARGUMENTS/types.ts (shared types)
3. src/$ARGUMENTS/$ARGUMENTS.ts (main implementation, empty function stubs)
4. tests/unit/$ARGUMENTS.test.ts (test skeleton)
5. Update src/index.ts to re-export from new module
Then run pnpm build to verify it compiles.
```

### .claude/commands/check-bundle.md
```markdown
Analyze the current bundle output:
1. Run `pnpm build`
2. Run `pnpm size` and report the results
3. Run `pnpm validate` (publint + attw)
4. List all exports and their individual sizes
5. Verify tree-shaking: create a temp file that imports only one function,
   bundle it, and confirm other functions are excluded
6. Report any issues found
```

### .claude/commands/prep-release.md
```markdown
Prepare for a release:
1. Run full test suite: `pnpm test && pnpm test:e2e`
2. Run full build: `pnpm build`
3. Run validations: `pnpm validate`
4. Check bundle size: `pnpm size`
5. Show git log since last tag: `git log $(git describe --tags --abbrev=0)..HEAD --oneline`
6. Suggest changeset type (major/minor/patch) based on the changes
7. Show any TODO or FIXME comments in src/
8. Report readiness status
```

---

## 7. .claude/agents/ — Specialized Subagents

Agents chạy trong context riêng biệt. Dùng khi cần isolation.

### .claude/agents/test-writer.md
```markdown
---
name: test-writer
description: Writes comprehensive tests for browser utility functions.
model: sonnet
allowed-tools: Read, Write, Bash(pnpm test*)
---

You are a test engineering specialist for a browser utilities library.

## Your job
Write thorough unit and E2E tests for the provided function.

## Rules
- Cover: happy path, error paths, edge cases, browser unsupported
- Mock navigator APIs properly — never test real browser in unit tests
- Use describe/it blocks with clear names
- AAA pattern: Arrange → Act → Assert
- Each test must be independent
- Run tests after writing to verify they pass

## Output
- Unit test file ready to commit
- Brief summary of what's covered and any known gaps
```

---

## 8. Hooks — Deterministic Automation

Hooks chạy TỰ ĐỘNG tại specific lifecycle events. Không phụ thuộc CC "nhớ".

### Cấu hình trong .claude/settings.json

```json
{
  "$schema": "https://code.claude.com/schema/settings.json",
  "permissions": {
    "allow": [
      "Bash(pnpm *)",
      "Bash(git *)",
      "Bash(npx *)",
      "Read",
      "Write"
    ],
    "deny": [
      "Bash(rm -rf /)",
      "Bash(npm publish*)",
      "Bash(git push --force*)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "cd /path/to/project && pnpm biome check --write $(echo \"$CLAUDE_TOOL_INPUT\" | jq -r '.file_path // empty') 2>/dev/null || true",
            "timeout": 10
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "echo \"$CLAUDE_TOOL_INPUT\" | jq -r '.command' | grep -qE 'npm publish|git push.*--force' && echo '{\"block\": true, \"message\": \"Blocked: Use changeset workflow for publishing, never force push\"}' >&2 && exit 2 || true",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

### Hooks giải thích

| Hook | Event | Mục đích |
|---|---|---|
| PostToolUse → Write | Sau mỗi file write | Auto-format với Biome |
| PreToolUse → Bash | Trước mỗi bash command | Block `npm publish` và `git push --force` |

---

## 9. MCP Servers — Nên dùng gì?

### Recommend cho project này

```bash
# Context7 — fresh docs cho tsdown, vitest, playwright, etc.
claude mcp add context7 --scope project -- npx -y @upstash/context7-mcp

# Playwright MCP — để CC chạy E2E tests trong real browser
claude mcp add playwright --scope project -- npx -y @playwright/mcp --headless
```

### Khi nào thêm MCP khác

| Khi nào | MCP Server |
|---|---|
| Khi cần tạo PR/issues tự động | GitHub MCP |
| Khi setup docs site | Không cần MCP, CC tự handle |
| Khi dùng external APIs | Tuỳ case |

### Cảnh báo quan trọng

- MỖI MCP server tốn token context. Nếu > 20k tokens MCP tools → CC bị "cripple"
- Chỉ add MCP khi THỰC SỰ cần, không add "cho đủ bộ"
- Context7 là must-have vì nó cho CC docs mới nhất thay vì hallucinate API cũ

---

## 10. Workflow Patterns Với Claude Code

### Pattern 1: Interview → Spec → Execute (Recommended cho features mới)

```
SESSION 1 (Planning):
> I want to add readFromClipboard(). Interview me about requirements,
> edge cases, and design decisions. Use the AskUserQuestion tool.
> When done, write the spec to SPEC-read-clipboard.md

SESSION 2 (Execution — fresh context):
> Read @SPEC-read-clipboard.md and implement it. Follow /implement skill.

SESSION 3 (Review — fresh context):
> Review the changes in this branch as a staff engineer.
> Follow /review skill. Be critical.
```

**Tại sao 3 sessions?**
- Session 1: Planning context ≠ implementation context
- Session 2: Clean context → CC không bị confused bởi planning discussion
- Session 3: Fresh eyes → CC review không biased bởi implementation shortcuts

### Pattern 2: TDD (Test → Implement → Verify)

```
SESSION 1:
> Write comprehensive tests for copyRichContent() based on @PRD.md section 4.1.
> Tests should fail because the function doesn't exist yet.

SESSION 2:
> Run the failing tests in tests/unit/copy-rich-content.test.ts.
> Implement src/clipboard/copy-rich-content.ts to make all tests pass.
> Do NOT modify the tests.
```

### Pattern 3: Incremental (Cho tasks nhỏ, clear)

```
> Add isClipboardSupported() to src/clipboard/. Include unit tests.
> Follow the implement skill checklist.
```

Một session là đủ cho task nhỏ, rõ ràng.

### Pattern 4: Debug

```
> The E2E test for copyToClipboard fails in Firefox.
> Read the test file and the implementation.
> Diagnose the issue, explain root cause, then fix it.
> Run the test to verify.
```

---

## 11. Context Management — Quan Trọng Nhất

CC suy giảm quality khi context lớn. Quản lý context = quản lý output quality.

### Rules

| Context % | Action |
|---|---|
| 0-50% | Làm việc tự do |
| 50-70% | Chú ý, cân nhắc `/compact` |
| 70-90% | `/compact` ngay, focus vào modified files + current task |
| 90%+ | `/clear` bắt buộc — start fresh session |

### Tips

1. **`/clear` giữa tasks không liên quan** — Đừng debug xong rồi implement feature mới trong cùng session
2. **`/compact` có hướng dẫn** — Đừng chỉ `/compact`, mà:
   ```
   /compact Focus on the clipboard module changes and failing test list
   ```
3. **Git commit sau mỗi task hoàn thành** — CC có thể đọc lại git log nếu cần context
4. **Đừng dump cả PRD vào prompt** — Reference với `@PRD.md` và chỉ point tới section cụ thể

---

## 12. Prompt Patterns Hiệu Quả

### ✅ Good Prompts

```
# Specific, actionable
> Implement copyToClipboard() in src/clipboard/copy.ts.
> Follow the implement skill. Target: PRD section 4.1.

# Challenge CC
> Review these changes and grill me on edge cases.
> Don't approve until you're confident it's production-ready.

# Learn from CC
> Explain how tsdown processes our tsdown.config.ts.
> Walk me through what happens from source → dist output.

# Redirect after mistake
> That approach won't work because [reason].
> Knowing everything you know now, scrap this and implement the elegant solution.
```

### ❌ Bad Prompts

```
# Too vague
> Build the library

# Too much at once
> Implement clipboard, add tests, setup CI, write docs, publish to npm

# Micromanaging
> Create a file called copy.ts, on line 1 write import, on line 2...
```

---

## 13. Plan Mode — Shift+Tab×2

Plan Mode = CC chỉ đọc + phân tích + plan, KHÔNG edit files.

### Khi nào dùng

- Trước khi implement feature mới → CC plan trước, bạn approve
- Khi debug issue phức tạp → CC analyze trước khi sửa
- Khi refactor → CC propose changes trước khi execute

### Flow

```
[Plan Mode ON — Shift+Tab×2]
> I want to add Vue composable support. Analyze the current codebase
> and propose how to restructure for monorepo. Don't make changes.

[CC outputs plan]
[You review, give feedback]

[Plan Mode OFF — Shift+Tab]
> Execute the plan. Start with step 1.
```

---

## 14. Daily Workflow

### Morning Session (New day, fresh context)

```bash
cd ngockhoi96
claude

# In CC:
> What's the current status? Check git log, any failing tests, open TODOs.
```

### Working Session

```
> [Describe task clearly, reference PRD/spec if needed]
> [CC implements]
> [You review output]
> [CC fixes based on feedback]
> [Commit when satisfied]
> /clear
> [Next task]
```

### End of Day

```
> Summarize what we accomplished today.
> Write it to DEVLOG.md with today's date.
> List any open issues or TODOs.
```

---

## 15. File Checklist — Tạo Gì Trước

### Bắt buộc (ngày 1)

| File | Commit? | Mục đích |
|---|---|---|
| `CLAUDE.md` | ✅ | Core instructions cho mọi session |
| `PRD.md` | ✅ | Product requirements reference |
| `.claude/settings.json` | ✅ | Permissions + hooks |
| `.claude/rules/code-style.md` | ✅ | Code conventions |
| `.claude/rules/testing.md` | ✅ | Testing conventions |
| `.gitignore` (add CLAUDE.local.md, settings.local.json) | ✅ | Keep personal files out |

### Sau khi có code (tuần 1-2)

| File | Commit? | Mục đích |
|---|---|---|
| `.claude/skills/implement/SKILL.md` | ✅ | Implementation workflow |
| `.claude/skills/review/SKILL.md` | ✅ | Code review checklist |
| `.claude/commands/check-bundle.md` | ✅ | Bundle analysis command |
| `.claude/.mcp.json` | ✅ | MCP server configs |

### Khi cần (tuần 3+)

| File | Commit? | Mục đích |
|---|---|---|
| `.claude/skills/release/SKILL.md` | ✅ | Release workflow |
| `.claude/commands/prep-release.md` | ✅ | Pre-release check |
| `.claude/agents/test-writer.md` | ✅ | Test specialist subagent |
| `.claude/rules/publishing.md` | ✅ | Publishing conventions |
| `CLAUDE.local.md` | ❌ | Personal overrides |

---

## 16. Anti-Patterns — Tránh Điều Này

1. **Nhét hết vào CLAUDE.md** — > 150 lines = CC bắt đầu ignore instructions uniformly
2. **Add MCP "cho đủ bộ"** — Mỗi MCP tốn context token. Chỉ add khi cần
3. **Không `/clear` giữa tasks** — Context degradation là failure mode #1
4. **Vibe coding** — "Build the whole thing" → technical debt. Plan trước, execute sau
5. **Không commit thường xuyên** — Git là memory của CC across sessions
6. **@ embed file lớn** — `@PRD.md` inject TOÀN BỘ file. Chỉ reference khi cần, point tới section cụ thể
7. **Copy-paste cùng prompt > 2 lần** — Nếu bạn lặp lại, tạo skill/command
8. **Override built-in behavior** — CC đã biết TypeScript, Git, npm. Chỉ instruct khi nó làm SAI