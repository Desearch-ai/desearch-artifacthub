import { apiKey } from './search.js';

export function selectSearchTool(tools) {
  const tool = tools.find(tool => tool.name === 'web-search') ??
    tools.find(tool => /search/i.test(tool.name) &&
    tool.inputSchema?.properties?.query?.type === 'string' &&
    tool.inputSchema.required?.length === 1 &&
    tool.inputSchema.required[0] === 'query');
  if (!tool) throw new Error('No compatible search tool found.');
  return tool;
}

export function toolResults(result) {
  if (result.isError) throw new Error('Search tool failed.');
  const extract = body => Array.isArray(body) ? body :
    ['data', 'results', 'organic_results'].map(key => body?.[key]).find(Array.isArray);
  const structured = extract(result.structuredContent);
  if (structured) return structured;
  for (const item of result.content ?? []) {
    if (item.type !== 'text') continue;
    let body;
    try { body = JSON.parse(item.text); } catch { continue; }
    const data = extract(body);
    if (data) return data;
  }
  throw new Error('Invalid search tool response.');
}

export async function liveSearch(client, transport) {
  try {
    await client.connect(transport); // SDK performs initialize and initialized notification.
    const tools = [];
    let cursor;
    do {
      const page = await client.listTools(cursor ? { cursor } : {});
      tools.push(...page.tools);
      cursor = page.nextCursor;
    } while (cursor);
    const tool = selectSearchTool(tools);
    const data = toolResults(await client.callTool({ name: tool.name,
      arguments: { query: 'bittensor' } }));
    return { toolCount: tools.length, tool: tool.name,
      resultCount: data.length, firstTitle: data[0]?.title ?? null };
  } finally { await client.close(); }
}

export async function runLive() {
  const key = apiKey();
  const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
  const { StreamableHTTPClientTransport } = await import('@modelcontextprotocol/sdk/client/streamableHttp.js');
  const transport = new StreamableHTTPClientTransport(new URL('https://mcp.desearch.ai/mcp'), {
    requestInit: { headers: { Authorization: `Bearer ${key}` }, redirect: 'error',
      signal: AbortSignal.timeout(45_000) }
  });
  return liveSearch(new Client({ name: 'desearch-listing-check', version: '1.0.0' }), transport);
}
