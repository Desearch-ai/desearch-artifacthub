import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import YAML from 'yaml';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('repository and versioned package metadata have required fields', () => {
  const repo = YAML.parse(read('artifacthub-repo.yml'));
  assert.equal(repo.repositoryID, '');
  assert.deepEqual(repo.owners, [{ name: 'Desearch', email: 'dev@desearch.ai' }]);
  const pkg = YAML.parse(read('desearch/1.0.0/artifacthub-pkg.yml'));
  for (const field of ['version', 'name', 'displayName', 'createdAt', 'description']) {
    assert.equal(typeof pkg[field], 'string');
    assert.ok(pkg[field]);
  }
  assert.ok(Number.isFinite(Date.parse(pkg.createdAt)));
  const server = JSON.parse(read('desearch/1.0.0/server.json'));
  assert.equal(server.$schema, 'https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json');
  assert.match(server.name, /^[a-zA-Z0-9.-]+\/[a-zA-Z0-9._-]+$/);
  assert.equal(server.version, '1.0.0');
  assert.equal(pkg.version, server.version);
  assert.ok(server.description.length > 0 && server.description.length <= 100);
  assert.equal(server.remotes.length, 1);
  const remote = server.remotes[0];
  assert.equal(remote.type, 'streamable-http');
  assert.equal(remote.url, 'https://mcp.desearch.ai/mcp');
  assert.deepEqual(remote.headers, [{ name: 'Authorization',
    description: 'Bearer authentication using DESEARCH_API_KEY.',
    value: 'Bearer {DESEARCH_API_KEY}', variables: { DESEARCH_API_KEY: {
      description: 'Desearch API key supplied from the environment.', isRequired: true, isSecret: true
    } } }]);
});

test('public copy follows editorial constraints', () => {
  for (const file of ['README.md', 'desearch/1.0.0/README.md',
    'desearch/1.0.0/server.json', 'desearch/1.0.0/artifacthub-pkg.yml']) {
    assert.doesNotMatch(read(file), /\u2014|real.time|fastest|cheapest|low.latency/i);
  }
});
