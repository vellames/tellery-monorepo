#!/usr/bin/env node
/*
 * audit.js — consistency checker for an ai-history mock JSON.
 * Usage: node audit.js <path/to/history.json>
 */
const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node audit.js <history.json>');
  process.exit(1);
}

const h = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

const clueIds = new Set(h.clues.map((c) => c.id));
const intentIds = new Set(h.intentDefinitions.map((i) => i.id));
const charIds = new Set(h.characters.map((c) => c.id));
const locIds = new Set(h.locations.map((l) => l.id));
const objIds = new Set(h.objects.map((o) => o.id));

const revealers = {};
const requires = {};
const problems = [];

function reg(ctx, rule) {
  (rule.requiresClueIds || []).forEach((id) => {
    if (!clueIds.has(id)) {
      problems.push(`[ref] ${ctx} requires pista inexistente: ${id}`);
      return;
    }
    const key = rule.clueId || ctx;
    (requires[key] = requires[key] || new Set()).add(id);
  });
  if (rule.clueId) {
    (revealers[rule.clueId] = revealers[rule.clueId] || []).push(ctx);
  }
  (rule.revealsClueIds || []).forEach((id) => {
    if (!clueIds.has(id)) {
      problems.push(`[ref] ${ctx} reveals pista inexistente: ${id}`);
      return;
    }
    (revealers[id] = revealers[id] || []).push(ctx);
  });
  (rule.triggerIntents || []).forEach((id) => {
    if (!intentIds.has(id))
      problems.push(`[ref] ${ctx} usa intent inexistente: ${id}`);
  });
}

h.characters.forEach((ch) => {
  (ch.clueRevealRules || []).forEach((r) => reg(`char ${ch.id}`, r));
  (ch.secrets || []).forEach((s) =>
    s.revealStages.forEach((st) =>
      reg(`char ${ch.id}/${s.id} L${st.level}`, st)
    )
  );
});
h.objects.forEach((o) =>
  (o.clueRevealRules || []).forEach((r) => reg(`obj ${o.id}`, r))
);
h.endings.forEach((e) =>
  (e.condition.requiresClueIds || []).forEach((id) => {
    if (!clueIds.has(id))
      problems.push(`[ref] ending ${e.id} requires pista inexistente ${id}`);
  })
);

// Orphans
const orphan = h.clues.filter((c) => !revealers[c.id]).map((c) => c.id);
if (orphan.length)
  problems.push(
    `[orfas] pistas declaradas mas nunca reveladas: ${orphan.join(', ')}`
  );

// Location/object/character refs
h.objects.forEach((o) => {
  if (!locIds.has(o.locationId))
    problems.push(`[ref] obj ${o.id} locationId inexistente ${o.locationId}`);
});
h.locations.forEach((l) =>
  l.objectIds.forEach((id) => {
    if (!objIds.has(id))
      problems.push(`[ref] loc ${l.id} referencia obj inexistente ${id}`);
  })
);
h.locations.forEach((l) =>
  l.ambientClueIds.forEach((id) => {
    if (!clueIds.has(id))
      problems.push(`[ref] loc ${l.id} ambient inexistente ${id}`);
  })
);

// Reachability
function reachable(id, seen = new Set()) {
  if (seen.has(id)) return null;
  seen.add(id);
  const rq = requires[id] || new Set();
  if (rq.size === 0) return true;
  for (const r of rq) {
    if (!revealers[r]) return false;
    const x = reachable(r, new Set(seen));
    if (x === false) return false;
    if (x === null) return null;
  }
  return true;
}
h.endings.forEach((e) => {
  (e.condition.requiresClueIds || []).forEach((id) => {
    const r = reachable(id);
    if (r === false)
      problems.push(`[inalc] ending ${e.id} exige pista nao-alcancavel: ${id}`);
    if (r === null)
      problems.push(`[circ] ending ${e.id} cadeia circular via ${id}`);
  });
});

// Secret stage chains
h.characters.forEach((ch) => {
  (ch.secrets || []).forEach((s) => {
    const stages = [...s.revealStages].sort((a, b) => a.level - b.level);
    stages.forEach((st, i) => {
      if (i > 0 && (st.requiresClueIds || []).length === 0) {
        problems.push(
          `[segredo] ${ch.id}/${s.id} L${st.level} sem requires (quebra de cadeia)`
        );
      }
    });
  });
});

// Conclusion option ids vs character ids (for character-type fields)
const conclCharField = h.conclusion.fields.find((f) => f.type === 'character');
if (conclCharField) {
  (conclCharField.options || []).forEach((o) => {
    if (!charIds.has(o.id))
      problems.push(`[concl] opcao sem personagem: ${o.id}`);
  });
}

// Image coverage
const imgRefs = [];
if (h.coverImageUrl) imgRefs.push(['history', h.coverImageUrl]);
if (h.thumbnailUrl) imgRefs.push(['history', h.thumbnailUrl]);
h.characters.forEach(
  (c) => c.imageUrl && imgRefs.push(['characters', c.imageUrl])
);
h.locations.forEach(
  (l) => l.imageUrl && imgRefs.push(['location', l.imageUrl])
);
h.objects.forEach((o) => o.imageUrl && imgRefs.push(['object', o.imageUrl]));
h.endings.forEach((e) => e.imageUrl && imgRefs.push(['endings', e.imageUrl]));
const imgMapPath = inputPath.replace(/\.json$/, '-images-map.json');
if (fs.existsSync(imgMapPath)) {
  const map = JSON.parse(fs.readFileSync(imgMapPath, 'utf8'));
  imgRefs.forEach(([section, p]) => {
    const name = path.basename(p, path.extname(p));
    const sec = section === 'character' ? 'characters' : section;
    if (!map[sec] || !map[sec][name]) {
      problems.push(`[imagem] sem prompt no image-map: ${sec}/${name}`);
    }
  });
}

// Report
console.log('=== AUDITORIA ===');
if (problems.length) {
  console.log(`ENCONTRADOS ${problems.length} problemas:`);
  problems.forEach((p) => console.log(`  - ${p}`));
} else {
  console.log('OK — nenhuma inconsistencia.');
}

const reach = h.clues.filter((c) => reachable(c.id) === true).length;
console.log(`\nPistas alcancaveis: ${reach}/${h.clues.length}`);
console.log(
  `Personagens: ${h.characters.length} | Locais: ${h.locations.length} | Objetos: ${h.objects.length} | Pistas: ${h.clues.length} | Intents: ${h.intentDefinitions.length} | Finais: ${h.endings.length}`
);

process.exit(problems.length ? 1 : 0);
