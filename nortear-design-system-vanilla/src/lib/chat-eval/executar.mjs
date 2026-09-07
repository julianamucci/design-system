/**
 * ─── O ganchinho que faz `node` abrir os `.ts` deste repositório ─────────────
 *
 * POR QUE ISTO EXISTE, e por que é tão pequeno
 *
 * O avaliador precisa importar `api/perguntar.ts` — a função de servidor de
 * verdade, com a recuperação, o prompt e o provedor reais. Medir uma cópia
 * seria medir outra coisa.
 *
 * O Node desta máquina (v22.16) já sabe TIRAR os tipos de um `.ts`, com
 * `--experimental-strip-types`. O que ele não faz é resolver import SEM
 * extensão: o repositório escreve `import … from './corpus'` porque o
 * `moduleResolution: "bundler"` do `tsconfig.json` permite, e a resolução ESM
 * do Node não completa extensão nenhuma — ela falha com `ERR_MODULE_NOT_FOUND`
 * apontando para um caminho sem `.ts` no fim.
 *
 * Então o gancho faz UMA coisa: quando a resolução normal falha num caminho
 * relativo, tenta `<caminho>.ts` e `<caminho>/index.ts`. Nada mais — sem
 * transpilar, sem cache, sem mapear `paths`. Se um dia o repositório passar a
 * escrever a extensão nos imports (ou o projeto ganhar um `tsx`), este arquivo
 * some sem deixar saudade.
 *
 * Não é dependência de produção nem de portão: só o script do avaliador o usa,
 * via `--import`.
 */
import { existsSync } from 'node:fs';
import { register } from 'node:module';
import { fileURLToPath } from 'node:url';

/** O gancho em si, publicado para a thread de resolução do Node. */
export async function resolve(especificador, contexto, proximo) {
  try {
    return await proximo(especificador, contexto);
  } catch (erro) {
    // Só caminho relativo/absoluto. Nome de pacote continua com a resolução
    // normal — inventar extensão em `@google/genai` mascararia um erro real.
    if (!especificador.startsWith('.') && !especificador.startsWith('/')) throw erro;
    if (!contexto.parentURL) throw erro;
    for (const sufixo of ['.ts', '/index.ts']) {
      const alvo = new URL(especificador + sufixo, contexto.parentURL);
      if (existsSync(fileURLToPath(alvo))) return proximo(alvo.href, contexto);
    }
    throw erro;
  }
}

// `--import` executa este módulo no thread principal; `register` é o que leva o
// gancho para o thread de resolução, que é onde ele precisa rodar.
register(import.meta.url, import.meta.url);
