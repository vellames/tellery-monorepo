import fs from 'fs';
import { RunResult } from './runner';

function line(char = '-', length = 78): string {
  return char.repeat(length);
}

export function writeReport(result: RunResult, outputPath: string): void {
  const sections: string[] = [];

  sections.push('AI HISTORY - VALIDATOR RUN REPORT');
  sections.push(line('='));
  sections.push(`History:     ${result.historyTitle}`);
  sections.push(`Session:     ${result.sessionId}`);
  sections.push(`Generated:   ${new Date().toISOString()}`);
  sections.push(`Stop reason: ${result.stopReason}`);
  sections.push('');

  sections.push('PLAYTHROUGH');
  sections.push(line());

  for (const turn of result.turns) {
    sections.push(
      `[Turn ${turn.turn}] ${turn.stateType ?? '?'} / ${turn.entityName ?? '?'}`
    );
    sections.push(`  Reasoning: ${turn.reasoning}`);
    sections.push(`  Sent:      ${turn.message ?? '-'}`);

    if (turn.reply) {
      sections.push(`  Reply:     ${turn.reply}`);
    }

    if (turn.discoveredClues.length > 0) {
      sections.push('  Discovered clues:');
      for (const clue of turn.discoveredClues) {
        sections.push(`    - ${clue.title}: ${clue.description}`);
      }
    }

    if (turn.error) {
      sections.push(`  ERROR: ${turn.error}`);
    }

    sections.push('');
  }

  const totalClues = result.finalState.characters.reduce(
    (sum, c) => sum + c.cluesTotal,
    0
  );

  sections.push('SUMMARY');
  sections.push(line());
  sections.push(`Clues discovered: ${result.discoveredClueCount}`);
  sections.push(
    `Clue reveal slots: ${totalClues} (sum of per-entity cluesTotal)`
  );
  sections.push(`Turns played: ${result.turns.length}`);
  sections.push('');

  sections.push('DISCOVERED CLUES');
  sections.push(line());
  if (result.finalState.clues.length === 0) {
    sections.push('(none)');
  } else {
    for (const clue of result.finalState.clues) {
      sections.push(
        `- [${clue.importance}] ${clue.title}: ${clue.description}`
      );
    }
  }
  sections.push('');

  sections.push('ENTITY PROGRESS');
  sections.push(line());
  const entityRows = [
    ...result.finalState.characters.map((c) => ({
      type: 'character',
      name: c.name,
      total: c.cluesTotal,
      discovered: c.discoveredClues.length,
    })),
    ...result.finalState.objects.map((o) => ({
      type: 'object',
      name: o.name,
      total: o.cluesTotal,
      discovered: o.discoveredClues.length,
    })),
    ...result.finalState.locations.map((l) => ({
      type: 'location',
      name: l.name,
      total: l.cluesTotal,
      discovered: l.discoveredClues.length,
    })),
  ];

  for (const row of entityRows) {
    sections.push(
      `- [${row.type}] ${row.name}: ${row.discovered}/${row.total} clues`
    );
  }

  sections.push('');
  sections.push(line('='));
  sections.push('END OF REPORT');

  fs.writeFileSync(outputPath, sections.join('\n'), 'utf8');
}
