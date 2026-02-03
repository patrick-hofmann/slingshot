# Slingshot IDE

Agentic IDE with "One Shot" philosophy for iterative development using Claude Code CLI.

## Concept

Slingshot manages development tasks through **Threads** - each thread represents a single goal with a plan and iterative execution cycles:

1. **Plan** - Write or generate an implementation plan
2. **Checkpoint** - Git commit to save current state
3. **Execute** - Claude Code CLI implements the plan
4. **Learn** - Extract learnings from failures
5. **Retry** - Reset to checkpoint, refine plan, try again

This cycle continues until the task succeeds or is abandoned.

## Features

- **Project Management** - Clone and manage GitHub/Azure DevOps repositories
- **Thread Organization** - Group related tasks with status tracking
- **Plan Editor** - Markdown editor with version history
- **Run Monitor** - Live streaming of Claude Code output
- **Learnings Panel** - Extracted errors and constraints from failed runs
- **Settings** - Configure Claude model, Git behavior, Azure DevOps integration

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Bun |
| Desktop | Electron |
| Build | electron-vite |
| UI | Vue 3 + Tailwind CSS |
| State | Pinia |
| Database | SQLite (better-sqlite3) + Drizzle ORM |
| Git | isomorphic-git + Shell fallback |
| AI | Claude Code CLI |

## Prerequisites

- [Bun](https://bun.sh/) installed
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated

## Installation

```bash
# Clone the repository
git clone https://github.com/patrick-hofmann/slingshot.git
cd slingshot

# Install dependencies
bun install

# Start development
bun run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run package` | Package as desktop app |
| `bun run typecheck` | Run TypeScript checks |

## Project Structure

```
slingshot/
├── src/
│   ├── main/                 # Electron Main Process
│   │   ├── database/         # SQLite + Drizzle
│   │   ├── ipc/              # IPC Handlers
│   │   └── services/         # Business Logic
│   │
│   ├── preload/              # Electron Preload
│   │
│   └── renderer/             # Vue 3 App
│       ├── components/
│       ├── pages/
│       └── stores/
│
└── resources/                # App Resources
```

## Configuration

Access settings via the gear icon in the header:

### Claude
- **Model** - Select Claude model (Sonnet 4, Opus 4, Haiku 3.5)
- **Max Turns** - Limit agentic turns per run
- **Budget Tokens** - Optional token limit
- **Auto-Approve** - Skip permission prompts (use with caution)

### Git
- **Auto-Commit** - Automatically create checkpoints
- **Commit Prefix** - Prefix for auto-generated commits

### Azure DevOps
- **Organization** - Your Azure DevOps org name
- **PAT** - Personal Access Token for Work Items API

## License

MIT

## Author

Delta Mind GmbH
