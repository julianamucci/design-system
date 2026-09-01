/**
 * Andaime das demonstrações da citação em linha.
 *
 * As CITAÇÕES saem de `@shared/primitives/inline-citation-examples`, sem i18n:
 * são a fala, e o texto é o mesmo nos três idiomas para que as cinco stacks
 * fotografem a mesma tela. Os RÓTULOS saem da `translations.json`, porque são
 * texto de interface. Mesmo arranjo do `chat-thread`.
 *
 * O QUE ESTE ARQUIVO FAZ E O COMPONENTE NÃO: ESCREVER O NOME ACESSÍVEL. É de
 * propósito, e é a demonstração do contrato — aqui o andaime está no papel de
 * quem monta a página, e é quem monta que conhece a palavra para "fonte", o
 * número da marca e o título do documento ao mesmo tempo. Um nome montado dentro
 * do componente decidiria a ordem entre os três em cinco stacks de uma vez, e a
 * ordem é do idioma.
 */

import { createTranslation } from '@/lib/i18n';
import inlineCitationTranslations from '@shared/content/inline-citation/translations.json';
import {
  CITACAO_COMPLETA,
  CITACAO_MINIMA,
  CITACAO_RECUSADA,
  FRASE_COM_CITACOES,
} from '@shared/primitives/inline-citation-examples';
import type { Citation } from '@shared/primitives/chat-protocol';
import type { InlineCitationLabels } from './inline-citation';

const { t } = createTranslation(inlineCitationTranslations as Record<string, unknown>);

/** Os casos que a peça desenha diferente. */
export type InlineCitationCase = 'full' | 'minimal' | 'unsafe';

/** A citação daquele caso. */
export function citationOf(name: InlineCitationCase): Citation {
  if (name === 'minimal') return CITACAO_MINIMA;
  if (name === 'unsafe') return CITACAO_RECUSADA;
  return CITACAO_COMPLETA;
}

/**
 * Os rótulos da marca, com o nome acessível JÁ ESCRITO.
 *
 * O número entra no nome porque ele é o que se vê, e a WCAG 2.5.3 pede que o
 * nome contenha o rótulo visível. O título entra porque sem ele o nome não
 * responde a de QUAL fonte se trata — que é a pergunta inteira desta peça.
 */
export function inlineCitationLabels(index: number, citation: Citation): InlineCitationLabels {
  return {
    marker: `${t('labels.marker')} ${index}: ${citation.source.title}`,
    unsafeSource: t('labels.unsafeSource'),
  };
}

/**
 * A frase da demonstração, partida onde as marcas entram.
 *
 * Vem do módulo compartilhado, e o andaime só a repassa: é ela que garante que
 * as cinco stacks fotografem o mesmo parágrafo, com as marcas nos mesmos dois
 * lugares.
 */
export function sentenceParts(): readonly string[] {
  return FRASE_COM_CITACOES;
}

/**
 * As citações da frase da demonstração, na ordem em que ela as cita.
 *
 * Duas, e a segunda é a MÍNIMA de propósito: a frase mostra numa foto só que a
 * caixa desenha o que veio, e que uma citação sem trecho é citação legítima.
 */
export function sentenceCitations(): readonly Citation[] {
  return [CITACAO_COMPLETA, CITACAO_MINIMA];
}

/** A prévia daquela marca, se estiver montada. */
export function panelOf(root: HTMLElement): HTMLElement | null {
  return root.querySelector<HTMLElement>('[data-slot="inline-citation-panel"]');
}

/**
 * Espera a prévia montar, POR RELÓGIO e com leitura pura.
 *
 * Nada de espera por observador de mutação: uma condição que toca o DOM
 * reagenda a si mesma, e o prazo nunca chega — a aba trava sem reprovar (regra
 * do `waitFor` no CLAUDE.md raiz). Aqui a leitura é uma consulta e nada mais, e
 * quem decide o fim é o relógio.
 *
 * Existe porque `defaultOpen` abre no quadro seguinte ao da montagem: encaixar a
 * prévia exige o retângulo da marca, que só existe depois de o navegador
 * calcular o layout.
 */
export async function awaitPanel(root: HTMLElement, timeoutMs = 1000): Promise<HTMLElement | null> {
  const deadline = Date.now() + timeoutMs;
  let panel = panelOf(root);
  while (panel === null && Date.now() < deadline) {
    await new Promise((resolve) => { setTimeout(resolve, 16); });
    panel = panelOf(root);
  }
  return panel;
}
