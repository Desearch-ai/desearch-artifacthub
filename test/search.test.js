import test from 'node:test';
import assert from 'node:assert/strict';
import { search } from '../src/search.js';
import { liveSearch, toolResults, selectSearchTool } from '../src/live.js';
const data = [{ title: 'Example', link: 'https://example.org', snippet: 'Text' }];

test('API uses GET, encoded query and Bearer header only', async t => {
  const old = process.env.DESEARCH_API_KEY;
  process.env.DESEARCH_API_KEY = 'unit-test-token';
  t.after(() => { if (old === undefined) delete process.env.DESEARCH_API_KEY;
    else process.env.DESEARCH_API_KEY = old; });
  assert.deepEqual(await search('bittensor & web', 3, { fetchImpl: async (url, options) => {
    assert.equal(url.origin + url.pathname, 'https://api.desearch.ai/web');
    assert.deepEqual([...url.searchParams], [['query', 'bittensor & web'], ['num', '3']]);
    assert.equal(options.method, 'GET');
    assert.deepEqual(options.headers, { Authorization: 'Bearer unit-test-token' });
    assert.equal(options.redirect, 'error');
    return Response.json({ data });
  } }), data);
  for (const response of [new Response('', { status: 401 }), Response.json({ data: [{}] }),
    new Response('invalid')]) {
    await assert.rejects(search('q', 3, { fetchImpl: async () => response }));
  }
  await assert.rejects(search('q', 3, { fetchImpl: async () => {
    throw new Error('unit-test-token');
  } }), { message: 'Search request failed.' });
  await assert.rejects(search('', 3));
  await assert.rejects(search('q', 0));
  delete process.env.DESEARCH_API_KEY;
  await assert.rejects(search('q'), /DESEARCH_API_KEY/);
});

test('live initializes, lists tools and makes one search call', async () => {
  const calls = [];
  const tool = { name: 'web-search', inputSchema: { properties: {
    query: { type: 'string' }, start: { type: 'number' }
  }, required: ['query'] } };
  const client = {
    async connect(transport) { calls.push(['connect', transport]); },
    async listTools() { calls.push(['list']); return { tools: [tool] }; },
    async callTool(args) { calls.push(['call', args]); return { content: [
      { type: 'text', text: JSON.stringify({ data }) }
    ] }; },
    async close() { calls.push(['close']); }
  };
  assert.deepEqual(await liveSearch(client, 'transport'), {
    toolCount: 1, tool: 'web-search', resultCount: 1, firstTitle: 'Example'
  });
  assert.deepEqual(calls, [['connect', 'transport'], ['list'], ['call', {
    name: 'web-search', arguments: { query: 'bittensor' }
  }], ['close']]);
  assert.throws(() => selectSearchTool([]));
  assert.throws(() => toolResults({ isError: true }));
  assert.throws(() => toolResults({ content: [] }));
  assert.deepEqual(toolResults({ structuredContent: { data: [] } }), []);
  client.callTool = async () => { throw new Error('failure'); };
  await assert.rejects(liveSearch(client, 'transport'));
  assert.deepEqual(calls.at(-1), ['close']);
});


test('search tool selection prefers exact name and requires only query for fallback', () => {
  const fallback = { name: 'other_search', inputSchema: { properties: {
    query: { type: 'string' }
  }, required: ['query'] } };
  const exact = { ...fallback, name: 'web-search' };
  assert.equal(selectSearchTool([fallback, exact]), exact);
  assert.equal(selectSearchTool([fallback]), fallback);
  for (const required of [[], ['query', 'num'], ['start']]) {
    assert.throws(() => selectSearchTool([{ ...fallback,
      inputSchema: { ...fallback.inputSchema, required } }]));
  }
  assert.throws(() => selectSearchTool([{ ...fallback, name: 'lookup' }]));
});

test('tool results accept arrays and common envelopes without REST field requirements', () => {
  const items = [{ title: 'First' }, { title: 'Second', url: 'https://example.org' }];
  for (const body of [items, { data: items }, { results: items },
    { organic_results: items }, { data: null, results: items }, []]) {
    assert.deepEqual(toolResults({ content: [
      { type: 'image' }, { type: 'text', text: 'not JSON' },
      { type: 'text', text: JSON.stringify(body) }
    ] }), Array.isArray(body) ? body : items);
  }
  for (const body of [null, {}, { data: {} }, { results: 'invalid' }]) {
    assert.throws(() => toolResults({ content: [{ type: 'text', text: JSON.stringify(body) }] }));
  }
});
