/**
 * Andaime das demonstrações do contexto — um construtor por caso.
 *
 * Existe pelo mesmo motivo do `composer.fixtures.ts`: num `*.stories.ts` todo
 * export nomeado vira story, então o andaime não pode morar lá, e a saída
 * fácil — copiar a constante para cada arquivo — produz cópias que divergem sem
 * nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. Os
 * NOMES das referências e os recortes são dado de exemplo e ficam iguais nos
 * três idiomas: nome de arquivo não se traduz, e traduzi-lo faria as stories
 * fotografarem listas diferentes conforme o idioma da foto.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { computed, type ComputedRef } from 'vue';
import { useI18nStore, useTranslation, type Locale } from '@/lib/i18n';
import { CONTEXT_KINDS, type ContextItem, type ContextKind } from '@shared/primitives/chat-protocol';
import contextTranslations from '@shared/content/composer-context/translations.json';
import type { ComposerContextLabels } from './index';

/**
 * A anotação de tipo é o PORTÃO: a seção `labels` é lida como
 * `ComposerContextLabels` em CADA idioma, então rótulo que sumir do JSON — ou
 * idioma que ficar para trás — reprova no type-check, e não na tela. Uma
 * espécie sem palavra deixaria a etiqueta com o ícone e sem a informação.
 */
const CONTENT: Record<Locale, { labels: ComposerContextLabels }> = contextTranslations;

/** Os rótulos da lista num idioma — a forma para quem já tem o locale em mãos. */
export function contextLabelsFor(target: Locale): ComposerContextLabels {
  return CONTENT[target].labels;
}

/**
 * Os rótulos da lista fora de um componente — `play` não é render.
 *
 * Lê a MESMA store de locale que o composable abaixo, então o rótulo que a play
 * procura é sempre o que a lista desenha.
 */
export function contextLabels(): ComposerContextLabels {
  return contextLabelsFor(useI18nStore().locale);
}

/**
 * Os rótulos da lista no idioma corrente.
 *
 * Devolve um `computed`, e não um objeto pronto: o `setup` roda uma vez, então
 * um objeto congelaria a lista no idioma em que a story abriu — e a barra de
 * idioma do Storybook troca o idioma com a story montada.
 */
export function useContextLabels(): ComputedRef<ComposerContextLabels> {
  const { locale } = useTranslation(contextTranslations);
  return computed(() => contextLabelsFor(locale.value as Locale));
}

// Os rótulos do CAMPO, para a lista ter onde morar, saem de
// `composer.fixtures` — quem monta a story os importa de lá. Reexportá-los aqui
// criaria dois caminhos para a mesma coisa, e é assim que duas cópias começam a
// divergir sem sinal nenhum. As peças irmãs desta pasta fazem o mesmo.

/** O nome de exemplo de cada espécie. Dado, e por isso fora da tradução. */
const KIND_LABELS: Record<ContextKind, string> = {
  selection: 'relatorio.ts',
  file: 'medidas.csv',
  directory: 'src/fachada',
  page: 'Painel de medidas',
  repository: 'nortear/obra',
};

/**
 * Uma etiqueta por espécie, na ordem do vocabulário compartilhado.
 *
 * A lista sai de `CONTEXT_KINDS`, e não de um array escrito à mão: espécie nova
 * no protocolo entra aqui sozinha, e a story que conta as etiquetas passa a
 * cobri-la sem que ninguém lembre de mexer no andaime.
 */
export function everyKind(): ContextItem[] {
  return CONTEXT_KINDS.map((kind, i) => ({
    id: `c${i + 1}`,
    label: KIND_LABELS[kind],
    kind,
  }));
}

/** O trecho, que é a única espécie que sempre traz recorte. */
export function selection(): ContextItem[] {
  return [{ id: 'c1', label: 'relatorio.ts', kind: 'selection', detail: 'linhas 12–48' }];
}

/** Só o repositório — a espécie mais larga. */
export function repository(): ContextItem[] {
  return [{ id: 'c5', label: 'nortear/obra', kind: 'repository' }];
}

/**
 * Um posto à mão e um que entrou sozinho, lado a lado.
 *
 * É o par que a peça existe para desenhar: um tem botão de remover, o outro tem
 * a marca escrita e nenhum botão.
 */
export function mixed(): ContextItem[] {
  return [
    { id: 'c1', label: 'relatorio.ts', kind: 'selection', detail: 'linhas 12–48' },
    { id: 'c2', label: 'Painel de medidas', kind: 'page', automatic: true },
  ];
}

/** Só o que entrou sozinho. */
export function automatic(): ContextItem[] {
  return [{ id: 'c2', label: 'Painel de medidas', kind: 'page', automatic: true }];
}
