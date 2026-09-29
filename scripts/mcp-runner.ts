#!/usr/bin/env node
/**
 * SatsNav MCP Stdio Transport Runner
 * Enables plug-and-play integration with Claude Desktop, Cursor, and any MCP-compliant AI client.
 * Uses standard input/output (stdio) for high-performance zero-overhead communication.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createSatNavMCPServer } from '../src/lib/mcp-server';

async function main() {
  const server = createSatNavMCPServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error('[SatsNav MCP] Server running on stdio transport. Ready for AI agent requests.');
}

main().catch((err) => {
  console.error('[SatsNav MCP] Fatal startup error:', err);
  process.exit(1);
});
