import { runLive } from '../src/live.js';
try {
  const { resultCount, firstTitle } = await runLive();
  console.log(JSON.stringify({ resultCount, firstTitle }));
} catch {
  console.error('Live search failed. Check DESEARCH_API_KEY, network access, and the remote search tool schema.');
  process.exitCode = 1;
}
