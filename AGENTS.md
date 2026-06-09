<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:security-rules -->
# 🔒 Security Rules — MANDATORY FOR ALL AI AGENTS

These rules apply to every AI assistant, coding agent, or LLM working on this project. No exceptions.

## Environment File Protection
- **NEVER read, open, print, or expose the contents of `.env`** or any file matching `.env.*` (e.g. `.env.local`, `.env.production`)
- Do NOT reference, log, or repeat any values that appear to be API keys, secrets, or tokens
- If a task requires knowing the Supabase URL or keys, instruct the user to check the file themselves — do not read it on their behalf
- Assume `.env` contains live production credentials at all times

## Git Safety
- **NEVER run `git add .env`** or any command that would stage the `.env` file
- Before any `git add` or `git push`, verify `.env` is listed in `.gitignore`
- If asked to push "everything", explicitly exclude `.env`
<!-- END:security-rules -->
