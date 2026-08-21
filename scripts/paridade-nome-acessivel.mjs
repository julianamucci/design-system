#!/usr/bin/env node
// scripts/paridade-nome-acessivel.mjs — a mesma story anuncia o mesmo nome nas
// cinco stacks?
//
//   node scripts/paridade-nome-acessivel.mjs <slug>
//   node scripts/paridade-nome-acessivel.mjs --all
//
// ── Por que isto é INSTRUMENTO e não portão do `audit.mjs` ───────────────────
//
// O `audit.mjs` só aceita regra que eu tenha triado inteira, achado por achado,
// sem falso positivo. Esta medição não passa nesse teste: `--all` devolve ~120
// linhas e uma parte delas é diferença de FORMA, não de conteúdo — uma stack
// nomeia o grupo e outra nomeia cada item, e as duas estão certas. Triar 120
// não é trabalho de portão; triar as 2 a 6 de UM componente é trabalho de
// revisão, e cabe na `/quality`.
//
// ── O defeito que a originou ────────────────────────────────────────────────
//
// A story `Multi Responsive` do carrossel tinha CINCO nomes para a mesma
// demonstração: `Galeria de múltiplos itens`, `Galeria responsiva`, `Carrossel
// com múltiplos itens responsivos`, `Conjunto longo de slides` e `Vários itens
// por vez`. Dez stories do carrossel estavam assim. Nada acusava, porque nome
// acessível não quebra teste — ele só chega em quem ouve a tela, e essa pessoa
// recebe cinco produtos diferentes.
//
// ── Como ler a saída ────────────────────────────────────────────────────────
//
// Cada linha é "nome que a MAIORIA declara e alguém não". Duas formas de falso
// positivo já conhecidas, e as duas se reconhecem de relance:
//
// 1. Uma stack nomeia o GRUPO e outra nomeia cada ITEM. Aparece como um bloco de
//    nomes de item faltando na mesma stack. Não é defeito: é composição
//    diferente. (Comparar "o primeiro nome do corpo" fazia isto virar achado
//    sempre; por isso a comparação é de CONJUNTO — a ordem de escrita é
//    acidente.)
// 2. O nome é de um elemento que só uma stack tem no exemplo.
//
// O que É defeito: mesmo elemento, mesma story, nome diferente.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STACKS = ['react', 'vue', 'svelte', 'vanilla', 'angular'];
const ler = (p) => { try { return readFileSync(p, 'utf8'); } catch { return ''; } };

/** Rótulo de CONTROLE, não do exemplo: seta, fechar, item numerado. */
const DE_CONTROLE = /anterior|próximo|proximo|^slide |^foto |^página |^pagina |fechar|abrir menu|^item \d/i;

function nomesAcessiveis(corpo) {
  const out = [];
  // `<track label="Português">` nomeia a FAIXA de legenda, não o componente.
  const limpo = corpo.replace(/<track\b[^>]*>/g, ' ').replace(/<option\b[^>]*>/g, ' ');
  const rx = /(?:aria-label|ariaLabel|'aria-label'|"aria-label"|\blabel)\s*[:=]\s*["']([^"'\n]{3,60})["']/g;
  for (const m of limpo.matchAll(rx)) {
    const t = m[1].trim();
    if (DE_CONTROLE.test(t)) continue;
    if (/^[a-z-]+$/.test(t)) continue;   // valor de enum, não nome
    out.push(t);
  }
  return out;
}

function storiesDoSlug(slug, stack) {
  const padroes = [
    `nortear-design-system-${stack}/src/**/${slug}*.stories.*`,
    `nortear-design-system-${stack}/src/**/${slug}/*.stories.*`,
  ];
  const arqs = new Set();
  for (const g of padroes) {
    let o = '';
    try { o = execSync(`git ls-files "${g}"`, { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { continue; }
    if (!o) continue;
    for (const f of o.split('\n')) {
      // `alert*` casa `alert-dialog*`: o vizinho de nome mais longo contamina.
      const base = f.split('/').pop();
      if (!new RegExp(`^${slug}([.-])`, 'i').test(base) && !f.includes(`/${slug}/`)) continue;
      arqs.add(f);
    }
  }
  // Nome que a FÁBRICA dá por padrão conta como declarado: no Vanilla o
  // `createNavigationMenu` já nomeia o landmark, e cobrar a repetição em cada
  // story seria acusar uma stack de não escrever o que ela entrega.
  const doPadrao = padroesDaFabrica(slug, stack);

  const mapa = {};
  for (const f of arqs) {
    const partes = ler(join(ROOT, f)).split(/^export const (\w+)/m);
    for (let i = 1; i < partes.length; i += 2) {
      const nomes = [...nomesAcessiveis(partes[i + 1] || ''), ...doPadrao];
      if (nomes.length) mapa[partes[i]] = new Set(nomes);
    }
  }
  return mapa;
}

/** `?? 'Nome'` num `setAttribute('aria-label', …)` do componente. */
function padroesDaFabrica(slug, stack) {
  const out = [];
  let o = '';
  try {
    o = execSync(`git ls-files "nortear-design-system-${stack}/src/components/ui/${slug}.*"`,
      { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch { return out; }
  if (!o) return out;
  for (const f of o.split('\n')) {
    if (/\.(test|spec|stories|source)\./.test(f)) continue;
    const src = ler(join(ROOT, f));
    for (const m of src.matchAll(/aria-label['"]?\s*[,:=]\s*[^;\n]*\?\?\s*['"]([^'"\n]{3,60})['"]/g)) {
      out.push(m[1].trim());
    }
  }
  return out;
}

function medir(slug) {
  const porStack = {};
  for (const s of STACKS) porStack[s] = storiesDoSlug(slug, s);

  const nomes = new Set();
  for (const s of STACKS) for (const n of Object.keys(porStack[s])) nomes.add(n);

  const achados = [];
  for (const nome of [...nomes].sort()) {
    const onde = STACKS.filter((s) => porStack[s][nome]);
    if (onde.length < 3) continue;   // story que não existe em três não é paridade

    const todos = new Set();
    for (const s of onde) for (const v of porStack[s][nome]) todos.add(v);

    for (const v of [...todos].sort()) {
      const tem = onde.filter((s) => porStack[s][nome].has(v));
      const faltam = onde.filter((s) => !porStack[s][nome].has(v));
      if (tem.length > faltam.length && faltam.length) achados.push({ nome, texto: v, tem, faltam });
    }
  }
  return achados;
}

const args = process.argv.slice(2);
const CONTEUDO = join(ROOT, 'docs', 'shared', 'content');
const todosSlugs = readdirSync(CONTEUDO)
  .filter((s) => existsSync(join(CONTEUDO, s, 'translations.json')));

const alvos = args.includes('--all') ? todosSlugs : args.filter((a) => !a.startsWith('--'));
if (!alvos.length) {
  console.error('uso: node scripts/paridade-nome-acessivel.mjs <slug> | --all');
  process.exit(2);
}

let total = 0;
for (const slug of alvos) {
  const achados = medir(slug);
  if (!achados.length) { if (alvos.length === 1) console.log(`${slug}: nenhuma divergência`); continue; }
  total += achados.length;
  console.log(`\n## ${slug} — ${achados.length} nome(s) divergente(s)`);
  for (const a of achados) {
    console.log(`  ${a.nome}`);
    console.log(`     "${a.texto}"`);
    console.log(`     declara: ${a.tem.join(', ')}   |   NÃO declara: ${a.faltam.join(', ')}`);
  }
}
if (alvos.length > 1) console.log(`\ntotal: ${total} em ${alvos.length} componentes`);
