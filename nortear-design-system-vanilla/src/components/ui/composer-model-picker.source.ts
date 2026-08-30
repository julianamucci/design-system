// Snippet do painel Code do seletor de modelo — ver `@/lib/story-source`.
//
// Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
// curried devolveria função em vez de string, e as checagens que leem o snippet
// nunca chegariam ao snippet.
//
// A LISTA NÃO É ESCRITA POR EXTENSO em nenhuma das configurações, e isso é
// decisão. Os controles do Playground mexem em qual modelo está escolhido e em
// se a lista começa aberta — não nos modelos —, então despejar três objetos de
// andaime faria o painel ensinar o andaime em vez da peça. O que muda por
// story é o nome da constante, que é o que diz QUAL lista está na tela.

import {
  appendLine,
  callLine,
  importing,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

export type ModelPickerSnippetOptions = {
  /** Nome da constante da lista que o snippet declara. */
  models?: string;
  /** O endereço do modelo escolhido. */
  value?: string;
  /** A lista começa aberta? */
  open?: boolean;
  /** O snippet monta o seletor dentro do trilho do campo? */
  rail?: boolean;
};

function build(opts: ModelPickerSnippetOptions): string {
  const picker = `const picker = ${callLine(
    'createComposerModelPicker',
    options([
      ['labels', 'rotulos'],
      ['models', opts.models ?? 'modelos'],
      // Documentação não ensina a repetir o padrão da fábrica: só o que
      // difere entra no snippet.
      ['value', opts.value === undefined ? undefined : text(opts.value)],
      ['open', opts.open ? 'true' : undefined],
      ['onValueChange', '(model) => escolher(model.id)'],
    ]),
  )};`;

  if (!opts.rail) {
    return snippet(
      importing('composer-model-picker', 'createComposerModelPicker'),
      picker,
      appendLine('picker'),
    );
  }

  // O seletor é AUTÔNOMO: ele não é uma prop do campo, é um controle que quem
  // consome põe no início do trilho — pelo mesmo espaço de qualquer outro.
  return snippet(
    [
      importing('composer-model-picker', 'createComposerModelPicker'),
      importing('composer', 'createComposer'),
    ].join('\n'),
    picker,
    `const composer = ${callLine(
      'createComposer',
      options([
        ['labels', 'rotulosDoCampo'],
        ['railStart', '[picker]'],
      ]),
    )};`,
    appendLine('composer'),
  );
}

/** Transform do `meta` — o Playground, cujos controles mexem no escolhido. */
export const composerModelPickerSource: SourceTransform<ModelPickerSnippetOptions> = (
  _generated,
  ctx,
) => build(ctx?.args ?? {});

/** A lista aberta, em que a descrição é o único assunto. */
export function modelPickerDescriptionsSource(): string {
  return build({ models: 'disponiveis', open: true });
}

/** A lista com a etiqueta curta ao lado de um dos nomes. */
export function modelPickerBadgeSource(): string {
  return build({ models: 'comEtiqueta', open: true });
}

/** Em repouso: o gatilho com o nome escolhido, e nenhuma lista no documento. */
export function modelPickerClosedSource(): string {
  return build({ value: 'balanced' });
}

/** Com um modelo que não pode responder agora. */
export function modelPickerUnavailableSource(): string {
  return build({ open: true });
}

/** O seletor no início do trilho do campo. */
export function modelPickerInRailSource(): string {
  return build({ rail: true });
}
