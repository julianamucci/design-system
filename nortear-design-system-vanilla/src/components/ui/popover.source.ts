// Snippet do painel Code do Popover — ver `@/lib/story-source`.

import {
  callLine,
  importing,
  appendLine,
  options,
  snippet,
  text,
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
  /**
   * Nome acessível DECLARADO do painel. Só entra no snippet do painel sem
   * título: com título quem nomeia é o `aria-labelledby`, e os dois juntos
   * seriam ambiguidade.
   */
  ariaLabel?: string;
  side?: PopoverSide;
  align?: PopoverAlign;
  sideOffset?: number;
  defaultOpen?: boolean;
  /** Modo modal — foco preso, rolagem travada, painel anunciado como modal. */
  modal?: boolean;
  /** Presença liga a linha do callback; string troca a expressão mostrada. */
  onOpenChange?: unknown;
  /** Mostra a linha de limpeza — o painel mora em portal no `body`. */
  destroy?: boolean;
};

const CALLBACK_DEFAULT = '(aberto) => registrar(aberto)';

/**
 * Reindenta as linhas seguintes de um bloco já montado.
 *
 * `callLine()` recua os próprios pares em dois espaços, medida certa para uma
 * chamada no topo do arquivo e curta demais quando ela entra numa lista de
 * argumentos.
 */
function recuar(block: string, espacos: string): string {
  return block
    .split('\n')
    .map((line, i) => (i === 0 ? line : `${espacos}${line}`))
    .join('\n');
}

const TITLE_DEFAULT = 'Configurações de exibição';
const DESCRIPTION_DEFAULT = 'Ajuste a aparência do conteúdo da página.';

/** O botão que abre o painel. Todas as formas de snippet começam por ele. */
function blockTrigger(o: PopoverSnippetOptions): string {
  return `const gatilho = ${callLine(
    'createButton',
    options([
      ['variant', text(o.triggerVariant ?? 'outline')],
      ['label', text(o.triggerLabel ?? 'Abrir popover')],
    ]),
  )};`;
}

/** As opções do painel que não dependem da forma do conteúdo. */
function panelLines(o: PopoverSnippetOptions, content: string): string[] {
  return options([
    ['trigger', 'gatilho'],
    ['content', content],
    ['side', o.side && o.side !== 'bottom' ? text(o.side) : undefined],
    ['align', o.align && o.align !== 'center' ? text(o.align) : undefined],
    ['sideOffset', o.sideOffset !== undefined && o.sideOffset !== 4 ? String(o.sideOffset) : undefined],
    // Só o painel sem título declara nome: `o.text` é justamente a forma que
    // troca cabeçalho por texto solto.
    ['ariaLabel', o.ariaLabel && typeof o.text === 'string' ? text(o.ariaLabel) : undefined],
    ['defaultOpen', o.defaultOpen ? 'true' : undefined],
    ['modal', o.modal ? 'true' : undefined],
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
  if (!o.destroy) return appendLine('painel');
  return `${appendLine('painel')}

// O painel aberto mora em portal no \`body\` e a fábrica escuta o documento.
// Quem tira o componente da página solta as duas coisas por aqui.
painel.destroy();`;
}

/**
 * Os imports do painel, conforme ele tenha cabeçalho ou só texto.
 *
 * Extraído do corpo de `popoverSnippet` quando o snippet controlado passou a
 * precisar do mesmo par: duas listas divergindo em silêncio é como um snippet
 * começa a ensinar import que não resolve.
 */
function panelImports(soText: boolean): string {
  return (
    soText
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
        ]
  ).join('\n');
}

/** O bloco que monta o conteúdo do painel a partir das peças do próprio Popover. */
function blockHeader(o: PopoverSnippetOptions): string {
  return `// Cabeçalho, título e descrição são peças do próprio Popover: são elas que
// carregam a classe e o \`data-slot\` de cada parte, e é o título que dá nome
// acessível ao painel.
const conteudo = createPopoverHeader();
conteudo.append(
  ${recuar(
    callLine(
      'createPopoverTitle',
      options([
        ['text', text(o.title ?? TITLE_DEFAULT)],
        ['level', o.titleLevel && o.titleLevel !== 2 ? String(o.titleLevel) : undefined],
      ]),
    ),
    '  ',
  )},
  ${recuar(
    callLine('createPopoverDescription', options([['text', text(o.description ?? DESCRIPTION_DEFAULT)]])),
    '  ',
  )},
);`;
}

/** A chamada real de `createPopover` com as opções da story. */
export function popoverSnippet(o: PopoverSnippetOptions = {}): string {
  const soText = typeof o.text === 'string';

  return snippet(
    panelImports(soText),
    blockTrigger(o),
    soText ? undefined : blockHeader(o),
    `const painel = ${callLine(
      'createPopover',
      panelLines(o, soText ? text(o.text as string) : 'conteudo'),
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
 * Abertura comandada de fora.
 *
 * O gatilho FICA — ele é a âncora de que o painel sai e o dono do
 * `aria-expanded` e do `aria-controls` —, e o que muda é o que o botão de fora
 * faz: `painel.open()`, e não `gatilho.click()`.
 *
 * Não é o gatilho escondido que o portão `gatilho_escondido_clicado` acusa; o
 * gatilho daqui sempre esteve à vista. É o degrau ao lado, e ele custa duas
 * coisas a quem copia: esconde a API pública da fábrica atrás de um clique
 * encenado, e ALTERNA — clique no gatilho aberto fecha, então um botão chamado
 * "abrir" fechava o painel na segunda vez.
 */
export function popoverControlledSnippet(o: PopoverSnippetOptions = {}): string {
  const soText = typeof o.text === 'string';
  const withCallback: PopoverSnippetOptions = {
    ...o,
    description: o.description ?? 'Estado observado por fora via onOpenChange.',
    onOpenChange: o.onOpenChange ?? '(aberto) => mostrarEstado(aberto)',
  };

  return snippet(
    panelImports(soText),
    blockTrigger(o),
    soText ? undefined : blockHeader(withCallback),
    `const painel = ${callLine(
      'createPopover',
      panelLines(withCallback, soText ? text(o.text as string) : 'conteudo'),
    )};`,
    `const externo = ${callLine(
      'createButton',
      options([
        ['variant', text('secondary')],
        ['label', text('Abrir por código')],
      ]),
    )};
// O verbo, e não um clique encenado no gatilho: clique no gatilho ALTERNA,
// então um botão que promete abrir fecharia o painel na segunda vez. A guarda
// de "já aberto" mora no verbo, e por isso não há espelho de estado aqui.
externo.addEventListener('click', () => painel.open());`,
    `document.querySelector('#app')?.append(externo, painel);`,
  );
}

/** Transform de story para a abertura comandada de fora. */
export function popoverSourceControlled(
  fixas: PopoverSnippetOptions = {},
): SourceTransform<PopoverSnippetOptions> {
  return (_gerado, ctx) => popoverControlledSnippet({ ...ctx.args, ...fixas });
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
formulario.dataset.spacing = 'md';
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
    `const painel = ${callLine('createPopover', panelLines(o, 'formulario'))};`,
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

// O Cancelar FECHA o painel: a fábrica delega o clique em
// \`[data-slot="popover-close"]\` dentro do painel e relata \`close-button\`.
// Sem a marca o botão não faz nada — não há ouvinte próprio a escrever.
const cancelar = createButton({ variant: 'ghost', size: 'sm', label: 'Cancelar' });
cancelar.dataset.slot = 'popover-close';

acoes.append(cancelar, createButton({ size: 'sm', label: 'Confirmar' }));

conteudo.append(${recuar(
      callLine('createPopoverTitle', options([['text', text(o.title ?? 'Confirmar alteração')]])),
      '  ',
    )}, acoes);`,
    `const painel = ${callLine('createPopover', panelLines(o, 'conteudo'))};`,
    blockFinal(o),
  );
}

/** Transform de story para o painel com ações. */
export function popoverSourceActions(
  fixas: PopoverSnippetOptions = {},
): SourceTransform<PopoverSnippetOptions> {
  return (_gerado, ctx) => popoverWithActionsSnippet({ ...ctx.args, ...fixas });
}
