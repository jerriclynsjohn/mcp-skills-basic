#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { McpServer, ProtocolError } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { parse } from "yaml";
import { z } from "zod";

// Keep the served bytes and their manifest consistent for this process.
const bytes = await readFile(new URL("./skills/greet-user/SKILL.md", import.meta.url));
const text = bytes.toString("utf8");
const frontmatter = parse(text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)[1]);
const uri = "skill://greet-user/SKILL.md";
const skill = {
  uri,
  frontmatter,
  resources: [{
    uri,
    digest: `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
    size: bytes.length,
  }],
};
const cache = { ttlMs: 0, cacheScope: "public" };

serveStdio(() => {
  const server = new McpServer(
    { name: "mcp-skills-example", version: "1.0.0" },
    { capabilities: { resources: {}, extensions: { "io.modelcontextprotocol/skills": {} } } },
  );

  server.registerTool(
    "greet",
    {
      description: "Greet someone by name.",
      inputSchema: z.object({ name: z.string().trim().min(1) }),
    },
    async ({ name }) => ({ content: [{ type: "text", text: `Hello, ${name}!` }] }),
  );

  // Skill contents use the existing MCP Resources primitive.
  server.registerResource(
    frontmatter.name,
    uri,
    { description: frontmatter.description, mimeType: "text/markdown", cacheHint: cache },
    async () => ({ contents: [{ uri, mimeType: "text/markdown", text }] }),
  );

  // SEP-2640 adds discovery methods; the SDK handles the base MCP protocol.
  server.server.setRequestHandler(
    "skills/list",
    { params: z.object({ cursor: z.string().optional() }).optional() },
    async () => ({ resultType: "complete", skills: [skill], ...cache }),
  );

  server.server.setRequestHandler(
    "skills/get",
    { params: z.object({ uri: z.string() }) },
    async (params) => {
      if (params.uri !== uri) throw new ProtocolError(-32602, "Unknown skill URI");
      return { resultType: "complete", skill, ...cache };
    },
  );

  return server;
});
