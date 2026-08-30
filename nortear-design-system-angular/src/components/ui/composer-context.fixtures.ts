/**
 * Andaime das demonstrações do contexto — um construtor por caso.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. Os
 * NOMES das referências e os recortes são dado de exemplo e ficam iguais nos
 * três idiomas: nome de arquivo não se traduz, e traduzi-lo faria as stories
 * fotografarem listas diferentes conforme o idioma da foto.
 *
 * O construtor dos rótulos do CAMPO é REEXPORTADO, e não reescrito: ele já mora
 * em `composer.fixtures.ts`, e a lista vive dentro do campo. Copiar o corpo
 * produziria duas cópias que divergem sem nenhum sinal — quem precisa dele o
 * recebe daqui, com a mesma implementação.
 *
 * Nada de `storybook/test` neste módulo: a docs page importa dele, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { useTranslation } from '@/lib/i18n';
import contextTranslations from '@shared/content/composer-context/translations.json';
import { CONTEXT_KINDS, type ContextItem } from '@shared/primitives/chat-protocol';
import type { ComposerContextLabels } from './composer-context';

export { composerLabels } from './composer.fixtures';

const { t } = useTranslation(contextTranslations as Record<string, unknown>);

/** Os rótulos da lista, no idioma corrente. */
export function contextLabels(): ComposerContextLabels {
  return {
    list: t('labels.list'),
    remove: t('labels.remove'),
    kind: {
      selection: t('labels.kind.selection'),
      file: t('labels.kind.file'),
      directory: t('labels.kind.directory'),
      page: t('labels.kind.page'),
      repository: t('labels.kind.repository'),
    },
    automatic: t('labels.automatic'),
  };
}

/** O nome de exemplo de cada espécie. Dado, e por isso fora da tradução. */
const KIND_LABELS: Record<(typeof CONTEXT_KINDS)[number], string> = {
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
