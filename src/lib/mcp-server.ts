/**
 * SatNav Model Context Protocol (MCP) Server
 * Exposes Bitcoin Lightning Network pathfinding, fee anomaly detection,
 * and guarded payment dispatching to AI agent runtimes (Claude, Cursor, Antigravity).
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

export function createSatNavMCPServer(): Server {
  const server = new Server(
    {
      name: 'satnav-lightning-sentinel',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  return server;
}
