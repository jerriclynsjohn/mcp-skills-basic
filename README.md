# Minimal MCP server with a skill

One `greet` tool and one bundled `skills/greet-user/SKILL.md`, served over stdio.
Uses the MCP TypeScript SDK v2 and the [Skills extension (SEP-2640)](https://github.com/modelcontextprotocol/ext-skills/blob/main/specification/stable/skills.mdx).

Requires Node.js 22 or later:

```sh
npm install
node server.js
```

The server waits for MCP messages on stdin. Add it to your MCP client's server configuration, replacing the absolute path:

```json
{
  "mcpServers": {
    "skills-example": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-skills/server.js"]
    }
  }
}
```

The server declares `capabilities.extensions["io.modelcontextprotocol/skills"]`:

- `skills/list` discovers the skill, frontmatter, file size, and SHA-256 digest.
- `skills/get` takes `{ "uri": "skill://greet-user/SKILL.md" }` and returns that skill's metadata.
- `resources/read` takes the same URI and returns the actual `SKILL.md`.
- `tools/call` with `{ "name": "greet", "arguments": { "name": "Jerric" } }` returns `Hello, Jerric!`.

Automatic skill loading requires a client that supports the Skills extension. Other clients can access the Markdown as an ordinary MCP resource.

Run `npm pack` to create a distributable package containing both the server and its skill. Skill contents are loaded at startup; restart after editing them.
