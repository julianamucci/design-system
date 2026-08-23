// Snippet do painel Code do Input — ver `@/lib/story-source`.

import {
  chamada,
  importing,
  montar,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

/**
 * O que as stories do Input usam e que o snippet precisa mostrar.
 *
 * As chaves de opção são as MESMAS da `InputOptions` da fábrica; o que sobra
 * (`label`, `ajuda`, `mensagem`) é a COMPOSIÇÃO em volta do campo, que não é
 * opção de fábrica nenhuma — é marcação que quem consome escreve, e sem ela o
 * campo não teria nome acessível.
 */
export type InputSnippetOptions = {
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  value?: string;
  name?: string;
  class?: string;
  /** id do campo — é o que liga o rótulo ao controle. */
  id?: string;
  /** Estado de erro. Não é opção da fábrica: é atributo posto no elemento. */
  ariaInvalid?: boolean;
  /** Texto do rótulo visível. Campo sem rótulo não é anunciado por ninguém. */
  label?: string;
  /** Texto de apoio, ligado ao campo por `aria-describedby`. */
  ajuda?: string;
  /** Mensagem de erro, ligada ao campo por `aria-describedby`. */
  mensagem?: string;
  /** Mostra a linha que liga a paleta escura no documento. */
  temaEscuro?: boolean;
};

/** Nome acessível e id padrão do exemplo — o par canônico rótulo + campo. */
const LABEL_DEFAULT = 'Nome completo';
const ID_DEFAULT = 'campo';

/**
 * A chamada real de `createInput` com as opções da story, dentro do par que o
 * componente sempre exige: um rótulo associado por `for`/`id`.
 *
 * O rótulo sai de `createLabel`, que é design system, e não de um
 * `campoRotulado()` que só existe dentro do arquivo de story.
 */
export function inputSnippet(o: InputSnippetOptions = {}): string {
  const id = o.id ?? ID_DEFAULT;
  const label = o.label ?? LABEL_DEFAULT;

  const descritores = [
    o.ajuda ? `${id}-ajuda` : undefined,
    o.mensagem ? `${id}-erro` : undefined,
  ].filter((d): d is string => d !== undefined);

  const lines = options([
    ['id', text(id)],
    ['type', o.type && o.type !== 'text' ? text(o.type) : undefined],
    ['placeholder', o.placeholder ? text(o.placeholder) : undefined],
    ['value', o.value ? text(o.value) : undefined],
    ['name', o.name ? text(o.name) : undefined],
    ['disabled', o.disabled ? 'true' : undefined],
    ['class', o.class ? text(o.class) : undefined],
  ]);

  const attrs = [
    o.ariaInvalid ? `campo.setAttribute('aria-invalid', 'true');` : undefined,
    descritores.length
      ? `campo.setAttribute('aria-describedby', ${text(descritores.join(' '))});`
      : undefined,
  ].filter((l): l is string => l !== undefined);

  const montados = ['rotulo', 'campo', o.ajuda && 'apoio', o.mensagem && 'erro'].filter(
    (n): n is string => typeof n === 'string',
  );

  return snippet(
    [importing('input', 'createInput'), importing('label', 'createLabel')].join('\n'),
    // A paleta escura é uma classe no documento: o campo é exatamente o mesmo
    // dos demais estados, e é isso que o snippet precisa deixar claro.
    o.temaEscuro ? `document.documentElement.classList.add('dark');` : undefined,
    [`const campo = ${chamada('createInput', lines)};`, ...attrs].join('\n'),
    `const rotulo = ${chamada('createLabel', options([['text', text(label)], ['htmlFor', text(id)]]))};`,
    o.ajuda
      ? `const apoio = document.createElement('p');
apoio.id = ${text(`${id}-ajuda`)};
apoio.className = 'nds-text-caption nds-text-muted-foreground';
apoio.textContent = ${text(o.ajuda)};`
      : undefined,
    o.mensagem
      ? `const erro = document.createElement('p');
erro.id = ${text(`${id}-erro`)};
erro.className = 'nds-text-caption nds-text-destructive';
erro.textContent = ${text(o.mensagem)};`
      : undefined,
    montar(montados.join(', ')),
  );
}

/**
 * Campo com prefixo, pelo CSS compartilhado do grupo.
 *
 * A moldura é do GRUPO; o campo interno entra nu. `classList.add` e nunca
 * atribuição direta: substituir a classe apagaria a base `.nds-input` e o campo
 * sairia sem respiro, sem borda e sem tipografia.
 */
export function inputWithPrefixoSnippet(o: InputSnippetOptions & { prefixo?: string } = {}): string {
  const id = o.id ?? 'site';
  const label = o.label ?? 'URL do site';
  const prefixo = o.prefixo ?? 'https://';

  const lines = options([
    ['id', text(id)],
    ['type', o.type && o.type !== 'text' ? text(o.type) : undefined],
    ['placeholder', o.placeholder ? text(o.placeholder) : undefined],
  ]);

  return snippet(
    [importing('input', 'createInput'), importing('label', 'createLabel')].join('\n'),
    `const grupo = document.createElement('div');
grupo.className = 'nds-input-group';
grupo.setAttribute('role', 'group');`,
    `const prefixo = document.createElement('span');
prefixo.className = 'nds-input-group-addon';
prefixo.dataset.align = 'inline-start';
prefixo.textContent = ${text(prefixo)};`,
    `const campo = ${chamada('createInput', lines)};
campo.classList.add('nds-input-group-control');
campo.dataset.slot = 'input-group-control';`,
    `grupo.append(prefixo, campo);`,
    `const rotulo = ${chamada('createLabel', options([['text', text(label)], ['htmlFor', text(id)]]))};`,
    montar('rotulo, grupo'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai nos padrões da fábrica, que é o uso
 * canônico do componente.
 */
export const inputSource: SourceTransform<InputSnippetOptions> = (_gerado, ctx) =>
  inputSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function inputSourceWith(fixas: InputSnippetOptions): SourceTransform<InputSnippetOptions> {
  return (_gerado, ctx) => inputSnippet({ ...ctx.args, ...fixas });
}

/** Transform de story para o campo dentro do grupo com prefixo. */
export function inputSourcePrefixo(
  fixas: InputSnippetOptions & { prefixo?: string } = {},
): SourceTransform<InputSnippetOptions> {
  return () => inputWithPrefixoSnippet(fixas);
}
