import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createSatNavMCPServer } from '../src/lib/mcp-server';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

describe('Model Context Protocol (MCP) Server Suite', () => {
  it('registers all 6 sovereign Lightning tools per MCP specification', async () => {
    const server = createSatNavMCPServer();
    assert.ok(server);

    // Call the internal list tools handler
    const handler = (server as any)._requestHandlers?.get(ListToolsRequestSchema.shape.method.value);
    assert.ok(handler, 'ListTools handler must be registered');

    const result = await handler({ method: 'tools/list' }, {});
    assert.ok(result.tools);
    assert.strictEqual(result.tools.length, 6);

    const toolNames = result.tools.map((t: any) => t.name);
    assert.ok(toolNames.includes('find_optimal_route'));
    assert.ok(toolNames.includes('probe_node_liquidity'));
    assert.ok(toolNames.includes('check_fee_sentinel'));
    assert.ok(toolNames.includes('pay_invoice_guarded'));
    assert.ok(toolNames.includes('get_network_health'));
    assert.ok(toolNames.includes('broadcast_nostr_threat_alert'));
  });

  it('rejects unknown tool executions with proper MCP error schema', async () => {
    const server = createSatNavMCPServer();
    const handler = (server as any)._requestHandlers?.get(CallToolRequestSchema.shape.method.value);
    assert.ok(handler, 'CallTool handler must be registered');

    await assert.rejects(
      async () => {
        await handler(
          {
            method: 'tools/call',
            params: {
              name: 'non_existent_tool',
              arguments: {},
            },
          },
          {}
        );
      },
      {
        message: /Tool not found: non_existent_tool/,
      }
    );
  });
});
