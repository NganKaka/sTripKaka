# Project Guidelines (CLAUDE.md)

## Token Efficiency Rules
- **Minimal Scanning**: Do not read the entire project. Only access files explicitly mentioned or directly relevant to the current task.
- **Ignore Assets**: Skip images, fonts, and large static assets.
- **Concise Responses**: Provide code snippets only for changed parts. Avoid reprinting the entire file unless requested.

## Technical Stack
- **Backend**: FastAPI (Python) / Node.js (như trong ảnh của bạn).
- **Package Manager**: Yarn.
- **Database**: PostgreSQL/MongoDB (tùy theo project của bạn).

## Coding Preferences
- Use Type Hints for Python (FastAPI).
- Use ES6+ syntax for JavaScript.
- Prioritize modularity and clean architecture.

## Interaction Protocol
- Always ask for clarification before modifying multiple files.
- If a task involves a file not in context, ask me to provide it instead of scanning.
- Summarize changes briefly after providing code.