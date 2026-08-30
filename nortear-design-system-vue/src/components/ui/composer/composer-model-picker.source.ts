/**
 * Transforms do painel Code do seletor de modelo.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest, a única guarda que elas têm — a saída do painel não
 * chega ao DOM durante a `play`.
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
import {
  attrsMultilinha,
  indentar,
  text,
  vueSnippet,
  type SourceTransform,
} from '@/lib/story-source';

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

const IMPORT = "import { ComposerModelPicker } from '@/components/ui/composer';";
const IMPORT_RAIL =
  "import { Composer, ComposerModelPicker } from '@/components/ui/composer';";

/**
 * O seletor sozinho.
 *
 * O aviso de troca entra SEMPRE: o componente não troca de modelo por conta
 * própria, de propósito, e um snippet sem ele ensinaria um controle que não
 * chega a lugar nenhum.
 */
function picker(opts: ModelPickerArgs): string {
  const attrs = attrsMultilinha([
    ':labels="rotulos"',
    `:models="${text(opts.models, 'modelos')}"`,
    // Documentação não ensina a repetir o padrão do componente: só o que
    // difere entra no snippet.
    opts.value === undefined ? undefined : `value="${text(opts.value)}"`,
    opts.open ? 'open' : undefined,
    '@change="escolher"',
  ]);
  return `<ComposerModelPicker${attrs} />`;
}

function build(opts: ModelPickerArgs): string {
  if (!opts.rail) return vueSnippet(IMPORT, picker(opts));

  // O seletor é AUTÔNOMO: ele não é uma prop do campo, é um controle que quem
  // consome põe no início do trilho — pelo mesmo espaço de qualquer outro.
  const rail = [
    '<Composer :labels="rotulosDoCampo">',
    '  <template #railStart>',
    indentar(picker(opts), 4),
    '  </template>',
    '</Composer>',
  ].join('\n');
  return vueSnippet(IMPORT_RAIL, rail);
}

/** Transform do `meta` — o Playground, cujos controles mexem no escolhido. */
export const composerModelPickerSource: SourceTransform<ModelPickerArgs> = (_gerado, ctx) =>
  build(ctx?.args ?? {});

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
