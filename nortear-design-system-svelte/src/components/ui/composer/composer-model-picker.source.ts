/**
 * Transforms do painel Code do seletor de modelo.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm — a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Existem porque nesta stack o docgen está DESLIGADO: sem transform, o gerador
 * monta a tag a partir do nome interno da função compilada e publica
 * `<wrapper …/>`, que não é um componente que alguém possa importar.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * A LISTA NÃO É ESCRITA POR EXTENSO em nenhuma das configurações, e isso é
 * decisão. Os controles do Playground mexem em qual modelo está escolhido e em
 * se a lista começa aberta — não nos modelos —, então despejar três objetos de
 * andaime faria o painel ensinar o andaime em vez da peça. O que muda por story
 * é o nome da constante, que é o que diz QUAL lista está na tela.
 */
import { attrsMultilinha, svelteSnippet } from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
export type ModelPickerArgs = {
  /** Nome da constante da lista que o snippet declara. */
  models?: string;
  /** O endereço do modelo escolhido. */
  value?: string;
  /** A lista começa aberta? */
  open?: boolean;
  /** O snippet monta o seletor dentro do trilho do campo? */
  rail?: boolean;
};

/** O contexto que o painel Code entrega à transform. */
type StoryContext = { args?: ModelPickerArgs };

const IMPORT_PICKER = "import { ComposerModelPicker } from '@/components/ui/composer';";
const IMPORT_BOTH =
  "import { Composer, ComposerModelPicker } from '@/components/ui/composer';";

/** A tag do seletor, recuada para caber onde ela vai. */
function pickerTag(opts: ModelPickerArgs, indent: string): string {
  const body = attrsMultilinha(
    [
      'labels={rotulos}',
      `models={${opts.models ?? 'modelos'}}`,
      // Documentação não ensina a repetir o padrão: só o que difere entra.
      opts.value === undefined ? undefined : `value="${opts.value}"`,
      opts.open ? 'open' : undefined,
      'onValueChange={(model) => escolher(model.id)}',
    ],
    `${indent}  `,
  );
  const close = body.endsWith('\n') ? indent : ' ';
  return `${indent}<ComposerModelPicker${body}${close}/>`;
}

function build(opts: ModelPickerArgs): string {
  if (!opts.rail) {
    return svelteSnippet(IMPORT_PICKER, pickerTag(opts, ''));
  }

  // O seletor é AUTÔNOMO: ele não é uma prop do campo, é um controle que quem
  // consome põe no início do trilho — pelo mesmo espaço de qualquer outro. O
  // trilho é um `{#snippet}`, e o snippet vem ANTES de quem o usa: declará-lo
  // depois deixaria a referência apontando para o nada.
  const rail = [
    '{#snippet railStart()}',
    pickerTag(opts, '  '),
    '{/snippet}',
    '',
    '<Composer labels={rotulosDoCampo} {railStart} />',
  ].join('\n');

  return svelteSnippet(IMPORT_BOTH, rail);
}

/** Transform do `meta` — o Playground, cujos controles mexem no escolhido. */
export function composerModelPickerSource(_gerado?: unknown, ctx?: StoryContext): string {
  return build(ctx?.args ?? {});
}

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
