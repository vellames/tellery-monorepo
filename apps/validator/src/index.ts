import { loadConfig } from './config';
import { createApiClient } from './api-client';
import { OpenRouterJsonClient } from './llm-client';
import { Investigator } from './investigator';
import { runSession } from './runner';
import { writeReport } from './reporter';

async function main(): Promise<void> {
  const config = loadConfig();

  console.log(`[validator] history: ${config.historySlug}`);
  console.log(`[validator] api: ${config.apiUrl}`);
  console.log(`[validator] investigator model: ${config.investigatorModel}`);

  const api = createApiClient(config);
  console.log('[validator] logging in...');
  await api.login(config.email, config.password);

  console.log('[validator] starting session...');
  const sessionId = await api.startSession(config.historySlug);
  console.log(`[validator] session: ${sessionId}`);

  const llm = new OpenRouterJsonClient(
    config.openRouterApiKey,
    config.investigatorModel
  );
  const investigator = new Investigator(llm);

  console.log('[validator] running investigation...');
  const result = await runSession(
    api,
    investigator,
    sessionId,
    config.maxIterations
  );

  console.log(
    `[validator] done — ${result.discoveredClueCount} clues in ${result.turns.length} turns (${result.stopReason})`
  );

  writeReport(result, config.outputPath);
  console.log(`[validator] report written to ${config.outputPath}`);
}

main().catch((error) => {
  console.error('[validator] fatal error:', error);
  process.exit(1);
});
