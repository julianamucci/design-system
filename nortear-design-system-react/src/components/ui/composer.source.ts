/**
 * Transforms do painel Code do Composer.
 *
 * Módulo de TS puro — nada de `.tsx` em valor. É o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm: a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Sem transform o gerador imprime a árvore do `render` da story, com o andaime
 * que só existe no arquivo — o componente que resolve os rótulos, o controle
 * que liga a geração. O que se escreve é uma tag com rótulos e um punhado de
 * props, e é isso que o painel mostra.
 *
 * OS RÓTULOS ENTRAM INTEIROS E OS MANIPULADORES ENTRAM DECLARADOS. O objeto não
 * cabe resumir — o componente exige os seis, e um literal pela metade não
 * compila para quem copia. Os manipuladores ganham uma linha cada porque
 * `onSubmit={enviar}` sem `enviar` declarado é um símbolo indefinido na
 * primeira renderização, e o corpo é justamente o que continua sendo de quem
 * consome: o campo não limpa nem envia por conta própria.
 */
import {
  attrsMultilinha,
  jsxSnippet,
  propBool,
  propNumber,
  propOption,
  propText,
  type SourceTransform,
} from '@/lib/story-source';

/** O que as stories usam da `ComposerProps` e que o snippet precisa mostrar. */
export type ComposerArgs = {
  value: string;
  rows: number;
  maxLength: number;
  disabled: boolean;
  submitOn: 'enter' | 'modifier';
};

const IMPORT = 'import { Composer } from "@/components/ui/composer";';

/**
 * Os rótulos do campo, por INTEIRO.
 *
 * `hint` e `limit` são moldes: `{key}` vira a combinação que envia e `{max}`
 * vira o número do limite. `submit` e `stop` são o nome do MESMO botão em dois
 * momentos — ele troca de nome, e não só de ícone.
 */
const LABELS_BLOCK = [
  'const labels = {',
  '  input: "Mensagem",',
  '  placeholder: "Escreva sua mensagem…",',
  '  submit: "Enviar",',
  '  stop: "Parar",',
  '  hint: "{key} envia",',
  '  limit: "Até {max} caracteres",',
  '};',
].join('\n');

/**
 * O que se faz com o que foi escrito.
 *
 * Uma linha, e o corpo é de quem consome: o componente não limpa o campo nem
 * envia nada por conta própria, e é justamente essa a responsabilidade que o
 * snippet existe para nomear.
 */
const SUBMIT_BLOCK = 'const enviar = (texto) => { /* … */ };';

const SUBMIT_ON = ['enter', 'modifier'] as const;

/** Linhas visíveis em repouso — o padrão do componente, que não entra no snippet. */
const ROWS_DEFAULT = 2;

/**
 * O `onSubmit` entra SEMPRE, mesmo quando a story não passa nenhum.
 *
 * Sem ele o snippet ensinaria um composer que não faz nada com o que foi
 * escrito — que é o erro mais provável de quem copia, porque o componente não
 * limpa o campo nem envia por conta própria. A linha existe para dizer onde a
 * responsabilidade continua.
 */
function tag(parts: Array<string | undefined>): string {
  return `<Composer labels={labels}${attrsMultilinha([...parts, 'onSubmit={enviar}'])} />`;
}

/** O import, os rótulos e o manipulador de envio, mais o que o ramo pedir. */
function preamble(imports: string = IMPORT, extra: string[] = []): string {
  return [imports, '', LABELS_BLOCK, ...extra, '', SUBMIT_BLOCK].join('\n');
}

function build(parts: Array<string | undefined> = [], header: string = preamble()): string {
  return jsxSnippet(header, tag(parts));
}

/** Transform do `meta`: lê os args da story e devolve a tag. */
export const composerSource: SourceTransform<ComposerArgs> = (_generated, ctx) => {
  const args = ctx?.args ?? {};
  return build([
    propText('value', args.value),
    args.rows === ROWS_DEFAULT ? undefined : propNumber('rows', args.rows),
    propNumber('maxLength', args.maxLength),
    propOption('submitOn', args.submitOn, SUBMIT_ON, 'enter'),
    propBool('disabled', args.disabled),
  ]);
};

/** Tecla direta envia — a convenção de teclado físico, e o padrão. */
export function composerEnterSource(): string {
  return build(['submitOn="enter"']);
}

/** A combinação envia — o certo no toque, onde a tecla direta é a de parágrafo. */
export function composerModifierSource(): string {
  return build(['submitOn="modifier"']);
}

/** Com texto já escrito: a semente do campo. */
export function composerFilledSource(): string {
  return build(
    ['value={rascunho}'],
    preamble(IMPORT, ['', 'const rascunho = "Preciso do resumo de custos até sexta.";']),
  );
}

/**
 * A geração em curso.
 *
 * `running` é PROP nesta stack, e o snippet mostra a divergência de frente:
 * quem sabe se a resposta está vindo é quem consome, e o que ele já tem é
 * estado — não um método para chamar.
 */
export function composerRunningSource(): string {
  return build(
    ['running={gerando}', 'onStop={cancelar}'],
    preamble(`${IMPORT}\nimport { useState } from "react";`, [
      '',
      '// O estado de geração é de quem consome: o composer não acompanha a rede.',
      'const [gerando, setGerando] = useState(false);',
      '',
      '// Interromper de verdade é de quem tem a conexão na mão.',
      'const cancelar = () => { /* … */ };',
    ]),
  );
}

/** Com limite: é ele que faz o contador existir. */
export function composerNearLimitSource(): string {
  return build(['maxLength={120}']);
}

/** O conjunto inteiro indisponível. */
export function composerDisabledSource(): string {
  return build(['disabled']);
}

/**
 * O trilho é um ESPAÇO, e nesta stack ele é marcação — não uma lista de
 * elementos prontos.
 */
export function composerRailSource(): string {
  return build(
    ['railStart={<Button variant="ghost" size="sm">Anexar</Button>}'],
    preamble(`${IMPORT}\nimport { Button } from "@/components/ui/button";`),
  );
}
