// Snippet do painel Code do Popover — ver `@/lib/story-source`.

import {
  chamada,
  importing,
  montar,
  opcoes,
  snippet,
  texto,
  type SourceTransform,
} from '@/lib/story-source';
import type { PopoverAlign, PopoverSide } from './popover';

/** Chaves iguais às dos args da story — `{ ...ctx.args }` entra sem tradução. */
export type PopoverSnippetOptions = {
  /** Texto visível do botão que abre o painel. */
  triggerLabel?: string;
  triggerVariant?: string;
  /** Título do painel — é dele que sai o nome acessível, por `aria-labelledby`. */
  title?: string;
  /** Profundidade do título, quando ele precisa encaixar na hierarquia da página. */
  titleLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  description?: string;
  /**
   * Painel só de texto. String entra como `textContent`, que é o caminho seguro
   * para conteúdo que vem de fora; definida, ela substitui título e descrição.
   */
  text?: string;
  side?: PopoverSide;
  align?: PopoverAlign;
  sideOffset?: number;
  defaultOpen?: boolean;
  /** Presença liga a linha do callback; string troca a expressão mostrada. */
  onOpenChange?: unknown;
  /** Mostra a linha de limpeza — o painel mora em portal no `body`. */
  destroy?: boolean;
};

const CALLBACK_DEFAULT = '(aberto) => registrar(aberto)';

/**
 * Reindenta as linhas seguintes de um bloco já montado.
 *
 * `chamada()` recua os próprios pares em dois espaços, medida certa para uma
 * chamada no topo do arquivo e curta demais quando ela entra numa lista de
 * argumentos.
 */
function recuar(bloco: string, espacos: string): string {
  return bloco
    .split('\n')
    .map((linha, i) => (i === 0 ? linha : `${espacos}${linha}`))
    .join('\n');
}

const TITLE_DEFAULT = 'Configurações de exibição';
const DESCRIPTION_DEFAULT = 'Ajuste a aparência do conteúdo da página.';

/** O botão que abre o painel. Todas as formas de snippet começam por ele. */
function blockTrigger(o: PopoverSnippetOptions): string {
  return `const gatilho = ${chamada(
    'createButton',
    opcoes([
      ['variant', texto(o.triggerVariant ?? 'outline')],
      ['label', texto(o.triggerLabel ?? 'Abrir popover')],
    ]),
  )};`;
}

/** As opções do painel que não dependem da forma do conteúdo. */
function panelLines(o: PopoverSnippetOptions, conteudo: string): string[] {
  return opcoes([
    ['trigger', 'gatilho'],
    ['content', conteudo],
    ['side', o.side && o.side !== 'bottom' ? texto(o.side) : undefined],
    ['align', o.align && o.align !== 'center' ? texto(o.align) : undefined],
    ['sideOffset', o.sideOffset !== undefined && o.sideOffset !== 8 ? String(o.sideOffset) : undefined],
    ['defaultOpen', o.defaultOpen ? 'true' : undefined],
    [
      'onOpenChange',
      o.onOpenChange
        ? typeof o.onOpenChange === 'string'
          ? o.onOpenChange
          : CALLBACK_DEFAULT
        : undefined,
    ],
  ]);
}

/** A linha final: o painel entra na página, e a limpeza quando ela é o assunto. */
function blockFinal(o: PopoverSnippetOptions): string {
  if (!o.destroy) return montar('painel');
  return `${montar('painel')}

// O painel aberto mora em portal no \`body\` e a fábrica escuta o documento.
// Quem tira o componente da página solta as duas coisas por aqui.
painel.destroy();`;
}

/** A chamada real de `createPopover` com as opções da story. */
export function popoverSnippet(o: PopoverSnippetOptions = {}): string {
  const soText = typeof o.text === 'string';

  const importes = soText
    ? [importing('popover', 'createPopover'), importing('button', 'createButton')]
    : [
        importing(
          'popover',
          'createPopover',
          'createPopoverDescription',
          'createPopoverHeader',
          'createPopoverTitle',
        ),
        importing('button', 'createButton'),
      ];

  const cabecalho = `// Cabeçalho, título e descrição são peças do próprio Popover: são elas que
// carregam a classe e o \`data-slot\` de cada parte, e é o título que dá nome
// acessível ao painel.
const conteudo = createPopoverHeader();
conteudo.append(
  ${recuar(
    chamada(
      'createPopoverTitle',
      opcoes([
        ['text', texto(o.title ?? TITLE_DEFAULT)],
        ['level', o.titleLevel && o.titleLevel !== 4 ? String(o.titleLevel) : undefined],
      ]),
    ),
    '  ',
  )},
  ${recuar(
    chamada('createPopoverDescription', opcoes([['text', texto(o.description ?? DESCRIPTION_DEFAULT)]])),
    '  ',
  )},
);`;

  return snippet(
    importes.join('\n'),
    blockTrigger(o),
    soText ? undefined : cabecalho,
    `const painel = ${chamada(
      'createPopover',
      panelLines(o, soText ? texto(o.text as string) : 'conteudo'),
    )};`,
    blockFinal(o),
  );
}

/** Transform do `meta` — vale para todas as stories do arquivo. */
export const popoverSource: SourceTransform<PopoverSnippetOptions> = (_gerado, ctx) =>
  popoverSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function popoverSourceWith(
  fixas: PopoverSnippetOptions,
): SourceTransform<PopoverSnippetOptions> {
  return (_gerado, ctx) => popoverSnippet({ ...ctx.args, ...fixas });
}

/**
 * Painel com formulário.
 *
 * É a composição que separa o Popover do Tooltip: o conteúdo é interativo, o
 * foco entra nele ao abrir e a pessoa digita ali dentro.
 */
export function popoverWithFormSnippet(o: PopoverSnippetOptions = {}): string {
  return snippet(
    [
      importing('popover', 'createPopover', 'createPopoverTitle'),
      importing('button', 'createButton'),
      importing('input', 'createInput'),
      importing('label', 'createLabel'),
    ].join('\n'),
    blockTrigger({ ...o, triggerLabel: o.triggerLabel ?? 'Editar perfil' }),
    `const formulario = document.createElement('form');
formulario.className = 'nds-stack';
formulario.dataset.spacing = 'sm';
formulario.addEventListener('submit', (e) => e.preventDefault());

// Rótulo e campo amarrados por \`htmlFor\`/\`id\`: sem o par, o campo chega ao
// leitor de tela sem nome nenhum.
function campo(id, rotulo, valor) {
  const linha = document.createElement('div');
  linha.className = 'nds-stack';
  linha.dataset.spacing = 'xs';
  linha.append(createLabel({ text: rotulo, htmlFor: id }), createInput({ id, value: valor }));
  return linha;
}

formulario.append(
  createPopoverTitle({ text: 'Editar perfil' }),
  campo('perfil-nome', 'Nome', 'Ana Ribeiro'),
  campo('perfil-email', 'Email', 'ana@nortear.com.br'),
  createButton({ size: 'sm', label: 'Atualizar', type: 'submit' }),
);`,
    `const painel = ${chamada('createPopover', panelLines(o, 'formulario'))};`,
    blockFinal(o),
  );
}

/** Transform de story para o painel com formulário. */
export function popoverSourceForm(
  fixas: PopoverSnippetOptions = {},
): SourceTransform<PopoverSnippetOptions> {
  return (_gerado, ctx) => popoverWithFormSnippet({ ...ctx.args, ...fixas });
}

/**
 * Painel de confirmação: título e um par de ações.
 *
 * O foco entra no PRIMEIRO focável do painel — aqui, em `Cancelar`. É a
 * política que faz quem navega por teclado alcançar as ações sem atravessar o
 * resto da página.
 */
export function popoverWithActionsSnippet(o: PopoverSnippetOptions = {}): string {
  return snippet(
    [importing('popover', 'createPopover', 'createPopoverTitle'), importing('button', 'createButton')].join('\n'),
    blockTrigger(o),
    `const conteudo = document.createElement('div');
conteudo.className = 'nds-stack';
conteudo.dataset.spacing = 'sm';

const acoes = document.createElement('div');
acoes.className = 'nds-cluster';
acoes.dataset.spacing = 'sm';
acoes.dataset.justify = 'end';
acoes.append(
  createButton({ variant: 'ghost', size: 'sm', label: 'Cancelar' }),
  createButton({ size: 'sm', label: 'Confirmar' }),
);

conteudo.append(${recuar(
      chamada('createPopoverTitle', opcoes([['text', texto(o.title ?? 'Confirmar alteração')]])),
      '  ',
    )}, acoes);`,
    `const painel = ${chamada('createPopover', panelLines(o, 'conteudo'))};`,
    blockFinal(o),
  );
}

/** Transform de story para o painel com ações. */
export function popoverSourceActions(
  fixas: PopoverSnippetOptions = {},
): SourceTransform<PopoverSnippetOptions> {
  return (_gerado, ctx) => popoverWithActionsSnippet({ ...ctx.args, ...fixas });
}
