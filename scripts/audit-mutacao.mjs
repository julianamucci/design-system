#!/usr/bin/env node
/**
 * Teste de mutação da regra `html_dynamic_unsanitized` do `audit.mjs`.
 *
 * Existe porque "zero achados" tem duas leituras indistinguíveis: está tudo
 * sanitizado, ou a regra parou de olhar. Só a mutação separa as duas.
 *
 * Não é hipotético. Ao alargar as isenções da regra eu acrescentei uma guarda
 * de "está dentro de um template literal", para não acusar snippet de
 * documentação como se fosse atribuição real. A guarda estava certa para o
 * Vanilla e cegou o Angular INTEIRO — os templates dele moram dentro de
 * `template: ` + crases, então tudo caía na guarda. O audit continuou dizendo
 * zero. Foi este teste que acusou.
 *
 * Como funciona: em cada stack, remove UMA chamada de `DOMPurify.sanitize()`
 * de um arquivo que hoje está limpo, roda o audit, e espera que ele acuse. O
 * arquivo é sempre restaurado, inclusive se o audit explodir no meio.
 *
 *   node scripts/audit-mutacao.mjs
 *
 * Saída 0 = a regra morde nas quatro stacks. Saída 1 = cega em alguma.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

// Um arquivo por stack, escolhido por ter vários sinks e estar limpo hoje.
// O React não entra: o `FoundationPage.tsx` sanitiza dentro de um helper de
// componente, e a mutação de uma chamada só não produz um sink descoberto.
const CASOS = [
  ['vue', 'nortear-design-system-vue/src/components/docs/shared/FoundationsRenderer.vue'],
  ['svelte', 'nortear-design-system-svelte/src/components/docs/shared/FoundationSection.svelte'],
  ['vanilla', 'nortear-design-system-vanilla/src/components/docs/shared/foundationsRenderer.ts'],
  ['angular', 'nortear-design-system-angular/src/components/docs/shared/FoundationPage.ts'],
];

function acharAchados(stack) {
  // O audit sai com código 1 quando ACHA algo — que é o caso provocado aqui.
  let saida;
  try {
    saida = execFileSync('node', ['scripts/audit.mjs', '--all', '--category', 'security', '--json'], {
      cwd: RAIZ,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (erro) {
    saida = erro.stdout ?? '';
  }
  const porSlug = JSON.parse(saida);
  return Object.values(porSlug)
    .flat()
    .filter((v) => v.stack === stack).length;
}

let cega = false;

for (const [stack, relativo] of CASOS) {
  const arquivo = join(RAIZ, relativo);
  if (!existsSync(arquivo)) {
    console.log(`${stack.padEnd(8)} PULADO — ${relativo} não existe`);
    continue;
  }

  const original = readFileSync(arquivo, 'utf8');
  // Argumento obrigatório (`+`, não `*`): a primeira ocorrência costuma ser
  // `DOMPurify.sanitize()` escrito num COMENTÁRIO que explica a regra, e mutar
  // aquilo não muda código nenhum — o teste concluiria "regra cega" sendo que o
  // cego era ele. Custou uma rodada inteira para descobrir.
  const mutado = original.replace(/DOMPurify\.sanitize\(([^()]+)\)/, '$1');

  if (mutado === original) {
    console.log(`${stack.padEnd(8)} FALHOU — nenhum sanitize mutável em ${relativo}`);
    cega = true;
    continue;
  }

  writeFileSync(arquivo, mutado);
  let achados;
  try {
    achados = acharAchados(stack);
  } finally {
    writeFileSync(arquivo, original);
  }

  const mordeu = achados > 0;
  if (!mordeu) cega = true;
  console.log(
    `${stack.padEnd(8)} ${mordeu ? 'PEGOU' : 'PASSOU BATIDO'} — ${achados} achado(s) com o sanitize removido`,
  );
}

console.log(
  cega
    ? '\nA regra está CEGA em pelo menos uma stack. O zero do audit não vale nada até isto passar.'
    : '\nA regra morde nas quatro stacks. O zero do audit significa o que promete.',
);
process.exit(cega ? 1 : 0);
