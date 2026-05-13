# Webgame — Wanmei Homepage Local Mirror (Stage 1)

Pixel-faithful local mirror of `https://games.wanmei.com/` for offline testing & future Cloudflare deploy.

## Quick start

```bash
npm install
node scripts/mirror-wanmei-homepage.mjs   # fetch homepage + assets into mirror/ (~8 MB)
node scripts/rename-mirror-images.mjs     # apply semantic image names + generate manifest
npx serve mirror/ -p 3000                  # open http://localhost:3000
```

Image name reference: `docs/wanmei-mirror-image-manifest.md` (all 61 chrome images mapped to roles).
Engineering notes: `docs/wanmei-mirror-{asset-inventory,data-schemas,patches}.md`.

`mirror/` and `node_modules/` are gitignored (regen via the scripts above).

---

## ClaudeKit Template (original boilerplate)

Empty project template pre-configured with ClaudeKit (agents, hooks, rules, skills, scripts).

## How to Use

1. **Duplicate this folder** for your new project:
   ```bash
   cp -r /Volumes/FanxiangTBOS/Nodejs_Project/TemplateEmptyClaudeKit /path/to/MyNewProject
   ```

2. **Re-initialize git** (to start fresh history):
   ```bash
   cd /path/to/MyNewProject
   rm -rf .git
   git init
   ```

3. **Update `CLAUDE.md`** — replace `{{PLACEHOLDERS}}` with your project details:
   - `{{PROJECT_NAME}}` — your project name
   - `{{STACK}}` — your tech stack
   - `{{HOSTING}}` — your hosting platform

4. **Install skills dependencies** (Python venv for skills):
   ```bash
   cd .claude/skills && bash install.sh
   ```

5. **Create your project docs** in `docs/`:
   - `project-overview-pdr.md`
   - `code-standards.md`
   - `codebase-summary.md`
   - `design-guidelines.md`
   - `system-architecture.md`

6. **Update `.claude/.mcp.json`** with your MCP server API keys if needed.

7. **Start coding** with Claude Code!

## What's Included

```
.claude/
├── agents/          # 14 agent definitions (planner, tester, reviewer, etc.)
├── hooks/           # Session hooks (privacy-block, scout-block, etc.)
├── rules/           # 5 workflow rules (primary, dev, orchestration, etc.)
├── skills/          # 75+ skill modules
├── scripts/         # Utility scripts (catalog generation, validation)
├── schemas/         # JSON Schema for .ck.json validation
├── output-styles/   # 6 coding level profiles (ELI5 to God mode)
├── statusline.*     # Terminal status display (cjs/sh/ps1)
├── .ck.json         # ClaudeKit main config
├── .ckignore        # Context blocking patterns
├── .mcp.json        # MCP server configs
└── settings.json    # Hook event configuration
CLAUDE.md            # Project guidance (templatized)
.commitlintrc.json   # Conventional commit rules
.gitignore           # Pre-configured ignore patterns
.env.example         # Environment variable template
docs/                # Project documentation (empty)
plans/               # Implementation plans (empty)
```
