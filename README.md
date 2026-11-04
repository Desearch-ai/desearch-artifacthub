# Desearch MCP repository

Desearch provides web search through a remote MCP server. Results contain `title`, `link`, and `snippet` fields.

About Desearch: AI search, X search and web search for AI agents, plus page extraction and X data tools.

Install with Node.js 22 or newer:

```sh
npm install
npm test
```

`npm test` parses the repository YAML and package JSON, checks required metadata and authentication configuration, and runs unit tests using mocked HTTP and MCP clients. Tests require no network or API key.

## Usage

Configure your MCP client with streamable HTTP at `https://mcp.desearch.ai/mcp`. Supply `Authorization: Bearer <key>` with the key read from `DESEARCH_API_KEY` by your client configuration. Placeholder expansion depends on the client. The registry metadata declares a required secret variable; it does not itself read environment variables.

Set `DESEARCH_API_KEY` in your process environment using your shell or secret manager. Do not store credentials in this repository. Run:

```sh
npm run live
```

This uses the MCP SDK to initialize a connection, list tools, select a search tool accepting `query` and `num`, and make one call with `query: "bittensor"` and `num: 3`. It prints only JSON containing `resultCount` and `firstTitle`. The helper internally returns the discovered tool count and selected tool name for testing. If the remote tool schema differs, the check fails without making a search call. Errors are sanitized to avoid exposing credentials or response bodies.

The optional API helper is a thin wrapper:

```js
import { search } from './src/search.js';
const results = await search('bittensor', 3);
```

It sends `GET https://api.desearch.ai/web?query=bittensor&num=3` with Bearer authorization, reads `{data: [{title, link, snippet}]}`, and returns the data array. The key is read only from `DESEARCH_API_KEY`. There are no alternate authentication modes.

## Listing steps

The repository layout is:

```text
artifacthub-repo.yml
desearch/
  1.0.0/
    server.json
    artifacthub-pkg.yml
    README.md
```

`server.json` follows the [MCP Registry schema dated 2025-12-11](https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json). The companion YAML supplies Artifact Hub display metadata. The package version describes this listing metadata.

1. Review the metadata and run `npm test`.
2. When ready, host this repository at a public Git URL through your normal publication process.
3. In Artifact Hub, add the repository with kind **MCP servers**, if that kind is available, and point it at the root containing `artifacthub-repo.yml`. Use a repository path without hosting-specific `tree/branch` segments.
4. Copy the assigned repository ID into the empty `repositoryID` string and publish that metadata update through your normal process.
5. Check the listing and tracker errors after indexing. Add future versions in new version folders with matching metadata versions.

The [published Artifact Hub repositories guide](https://artifacthub.io/docs/topics/repositories/) accessible during preparation did not list an MCP kind, and the MCP-specific documentation page was unavailable. Confirm support and any MCP-specific companion metadata requirements before listing. This repository uses the requested version-folder structure; Artifact Hub acceptance has not been verified. The [repository metadata guide](https://artifacthub.io/docs/topics/repositories/#verified-publisher) describes the repository ID workflow.

No listing, publication, or account creation is performed by these scripts.

## Links/Contact

- Docs: https://www.desearch.ai/docs/guide/sdk/mcp
- Contact: dev@desearch.ai
