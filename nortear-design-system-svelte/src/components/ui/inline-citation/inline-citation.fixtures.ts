/**
 * Andaime das demonstrações da citação em linha.
 *
 * Existe pelo mesmo motivo do andaime da tela do computador: num `*.stories.ts`
 * todo export nomeado vira story, então o andaime não pode morar lá, e a saída
 * fácil — copiar a constante para cada arquivo — produz cópias que divergem sem
 * nenhum sinal.
 *
 * As CITAÇÕES saem de `@shared/primitives/inline-citation-examples`, sem i18n:
 * são a fala, e o texto é o mesmo nos três idiomas para que as cinco stacks
 * fotografem a mesma tela. Os RÓTULOS saem da `translations.json`, porque são
 * texto de interface.
 *
 * O QUE ESTE ARQUIVO FAZ E O COMPONENTE NÃO: ESCREVER O NOME ACESSÍVEL. É de
 * propósito, e é a demonstração do contrato — aqui o andaime está no papel de
 * quem monta a página, e é quem monta que conhece a palavra para "fonte", o
 * número da marca e o título do documento ao mesmo tempo. Um nome montado
 * dentro do componente decidiria a ordem entre os três em cinco stacks de uma
 * vez, e a ordem é do idioma.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { get } from 'svelte/store';
import { locale, type Locale } from '@/lib/i18n';
import inlineCitationTranslations from '@shared/content/inline-citation/translations.json';
import {
  CITACAO_COMPLETA,
  CITACAO_MINIMA,
  CITACAO_RECUSADA,
  FRASE_COM_CITACOES,
} from '@shared/primitives/inline-citation-examples';
import type { Citation } from '@shared/primitives/chat-protocol';
import type { InlineCitationLabels } from './index';

/**
 * A anotação de tipo é o PORTÃO: a seção é lida em CADA idioma, então rótulo
 * que sumir do JSON — ou idioma que ficar para trás — reprova no type-check, e
 * não na tela. Sem a palavra para "fonte", o nome acessível da marca seria só o
 * número e o título, e o número sozinho é o que a decisão 2 da folha recusa.
 */
const CONTENT: Record<Locale, { labels: InlineCitationLabels }> =
  inlineCitationTranslations;

/** Os casos que a peça desenha diferente. */
export type InlineCitationCase = 'full' | 'minimal' | 'unsafe';

/** A citação daquele exemplo. */
export function citationOf(name: InlineCitationCase): Citation {
  if (name === 'minimal') return CITACAO_MINIMA;
  if (name === 'unsafe') return CITACAO_RECUSADA;
  return CITACAO_COMPLETA;
}

/**
 * Os rótulos da marca num idioma, com o nome acessível JÁ ESCRITO.
 *
 * O número entra no nome porque ele é o que se vê, e a WCAG 2.5.3 pede que o
 * nome contenha o rótulo visível. O título entra porque sem ele o nome não
 * responde a de QUAL fonte se trata — que é a pergunta inteira desta peça.
 *
 * É a forma para quem já tem o idioma em mãos: dentro de um componente ele vem
 * da store, e derivar dela é o que faz o rótulo acompanhar a barra de idioma do
 * Storybook com a story montada.
 */
export function inlineCitationLabelsFor(
  target: Locale,
  index: number,
  citation: Citation,
): InlineCitationLabels {
  const base = CONTENT[target].labels;
  return {
    marker: `${base.marker} ${index}: ${citation.source.title}`,
    unsafeSource: base.unsafeSource,
  };
}

/**
 * Os rótulos fora de um componente — `props` de story e `play` não são render.
 *
 * Lê a MESMA store de locale que o `useTranslation` da página, então o rótulo
 * que a play procura é sempre o que a peça desenha.
 */
export function inlineCitationLabels(
  index: number,
  citation: Citation,
): InlineCitationLabels {
  return inlineCitationLabelsFor(get(locale), index, citation);
}

/**
 * A frase da demonstração, partida onde as marcas entram.
 *
 * Vem do módulo compartilhado, e o andaime só a repassa: é ela que garante que
 * as cinco stacks fotografem o mesmo parágrafo, com as marcas nos mesmos dois
 * lugares. Nenhum pedaço termina em espaço — é assim que a marca não se separa
 * da palavra que a antecede quando a linha quebra.
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
 * Existe porque a prévia que nasce aberta só aparece depois de o efeito de
 * montagem correr: encaixá-la exige o retângulo da marca, que só existe depois
 * de o navegador calcular o layout.
 */
export async function awaitPanel(
  root: HTMLElement,
  timeoutMs = 1000,
): Promise<HTMLElement | null> {
  const deadline = Date.now() + timeoutMs;
  let panel = panelOf(root);
  while (panel === null && Date.now() < deadline) {
    await new Promise((resolve) => { setTimeout(resolve, 16); });
    panel = panelOf(root);
  }
  return panel;
}

/**
 * Espera a prévia SAIR da árvore, pelo mesmo relógio e com a mesma leitura
 * pura.
 *
 * A contraparte de `awaitPanel`, e ela é necessária pelo mesmo motivo: se a
 * prévia que nasce aberta só aparece depois do efeito de montagem, a que fecha
 * também só some depois do efeito — a asserção `toBeNull()` logo após o clique
 * mediria a árvore de antes.
 */
export async function awaitPanelGone(root: HTMLElement, timeoutMs = 1000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (panelOf(root) !== null && Date.now() < deadline) {
    await new Promise((resolve) => { setTimeout(resolve, 16); });
  }
  return panelOf(root) === null;
}

/**
 * Espera a marca ASSENTAR no estado pedido, pelo mesmo relógio e com a mesma
 * leitura pura de `awaitPanel`.
 *
 * É a metade que faltava. `awaitPanel` cobria só a ida: a prévia que nasce
 * aberta só aparece depois do efeito de montagem. A VOLTA tem a mesma latência
 * e não tinha espera nenhuma — quem escreve `aria-expanded` é o primitivo, num
 * efeito que corre depois que o clique já retornou, e a leitura logo em seguida
 * pega o valor de ANTES. A primeira rodada de navegador desta stack reprovou
 * exatamente aí, com `'true'` onde a asserção pedia `'false'`.
 *
 * Nada de espera por observador de mutação, pelo motivo escrito em `awaitPanel`
 * e no CLAUDE.md raiz: condição que toca o DOM reagenda a si mesma e pendura a
 * aba sem reprovar. Aqui a leitura é um `getAttribute` e nada mais.
 *
 * Devolver o valor final em vez de afirmar é de propósito: quem afirma é a
 * story, com a mensagem dela. Estourado o prazo, sai o valor errado e a
 * asserção reprova — a espera não esconde defeito, só tira a corrida do meio.
 */
export async function awaitExpanded(
  marker: HTMLElement,
  expected: 'true' | 'false',
  timeoutMs = 1000,
): Promise<string | null> {
  const deadline = Date.now() + timeoutMs;
  let current = marker.getAttribute('aria-expanded');
  while (current !== expected && Date.now() < deadline) {
    await new Promise((resolve) => { setTimeout(resolve, 16); });
    current = marker.getAttribute('aria-expanded');
  }
  return current;
}
