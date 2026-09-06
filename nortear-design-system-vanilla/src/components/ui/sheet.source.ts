// Snippet do painel Code do Sheet — ver `@/lib/story-source`.

import {
  callLine,
  importing,
  appendLine,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';
import type { SheetSide } from './sheet';

/** O que ocupa o `content` do painel. Muda o CORPO, não a chamada. */
export type SheetBody = 'text' | 'paragraphs' | 'actions' | 'navigation' | 'form' | 'profile';

/**
 * Texto do corpo de uma linha — o mesmo parágrafo que a Demonstração da docs
 * page mostra (`demonstration.labels.body`, pt-BR).
 *
 * Mora aqui, e não na fixture, porque este módulo é o único do par que não toca
 * o DOM: a suíte unitária roda em `node` e importar a fixture traria a fábrica
 * de botão junto. As stories o importam de volta, para que o painel Code e o
 * preview não possam divergir — que era o defeito: o snippet ensinava um texto
 * e o preview renderizava outro.
 */
export const SHEET_BODY_TEXT =
  'Conteúdo do painel: formulário, lista ou mensagem. É esta área que rola quando o conteúdo passa da altura da tela.';

/** O que as stories usam da `SheetOptions`, mais o corpo que cada uma monta. */
export type SheetSnippetOptions = {
  triggerLabel?: string;
  side?: SheetSide;
  title?: string;
  description?: string;
  body?: SheetBody;
  /** Rótulos do rodapé. `false` monta o painel SEM rodapé. */
  cancelLabel?: string | false;
  applyLabel?: string | false;
  /** Presença liga a linha do callback; string troca a expressão mostrada. */
  onOpenChange?: unknown;
  /** Idem, para o motivo do fechamento. */
  onClose?: unknown;
  /** Quantos parágrafos o corpo longo empilha. */
  paragrafos?: number;
  /** `false` monta o painel sem o X do canto — a saída passa a ser o rodapé. */
  showCloseButton?: boolean;
  /** Mostra o `destroy()` — quem tira o painel da página o chama. */
  mostrarDestroy?: boolean;
};

const CALLBACK_ABERTURA = '(aberto) => registrarPainel(aberto)';
const CALLBACK_FECHAMENTO = '(motivo) => registrarSaida(motivo)';

function expressao(value: unknown, padrao: string): string | undefined {
  if (!value) return undefined;
  return typeof value === 'string' ? value : padrao;
}

// ─── Corpos de demonstração ──────────────────────────────────────────────────
//
// O conteúdo é de quem consome — a fábrica não o inventa. Cada bloco abaixo é
// escrito com fábricas do design system ou com DOM curto, nunca com o
// `buildPlayground`/`makeBody` que só existe dentro do arquivo de story.

type Body = { imports: string[]; block: string };

function bodyText(): Body {
  return {
    imports: [],
    // Parágrafo, e não `div`: é o que o preview monta. O texto sai da mesma
    // constante que as stories usam.
    block: `const corpo = document.createElement('p');
corpo.className = 'nds-text-body nds-text-muted-foreground';
corpo.textContent = ${text(SHEET_BODY_TEXT)};`,
  };
}

function bodyParagrafos(total: number): Body {
  return {
    imports: [],
    // O corpo é quem rola: `.nds-sheet-body` já tem o teto de altura e o
    // `tabindex` que o torna alcançável por teclado. O rodapé fica onde está.
    block: `const corpo = document.createElement('div');
corpo.className = 'nds-stack nds-text-body nds-text-muted-foreground';
corpo.dataset.spacing = 'sm';
for (let i = 1; i <= ${total}; i++) {
  const paragrafo = document.createElement('p');
  paragrafo.textContent = \`Parágrafo \${i} dos termos de uso.\`;
  corpo.appendChild(paragrafo);
}`,
  };
}

/**
 * Fileira de ações — as TRÊS que `variants.compositions.bottomPanel` documenta.
 *
 * Escritas uma a uma, e não por laço: a destrutiva é a última e a única com a
 * variante que a anuncia, e um laço de rótulos apagaria justamente essa
 * diferença. Antes eram seis rótulos inventados aqui, todos `outline`.
 */
function bodyActions(): Body {
  return {
    imports: [importing('button', 'createButton')],
    block: `const corpo = document.createElement('div');
corpo.className = 'nds-cluster';
corpo.dataset.spacing = 'md';
corpo.append(
  createButton({ variant: 'outline', label: 'Compartilhar' }),
  createButton({ variant: 'outline', label: 'Duplicar' }),
  createButton({ variant: 'destructive', label: 'Excluir' }),
);`,
  };
}

function bodyNavigation(): Body {
  return {
    imports: [],
    // A lista de links é um marco: sem nome, o leitor de tela anuncia
    // "navegação" e mais nada. O nome é o do conteúdo compartilhado, e as
    // seções são as CINCO que ele descreve.
    block: `const corpo = document.createElement('nav');
corpo.className = 'nds-stack';
corpo.dataset.spacing = 'sm';
corpo.setAttribute('aria-label', 'Navegação secundária');
for (const rotulo of ['Dashboard', 'Projetos', 'Equipe', 'Configurações', 'Faturas']) {
  const link = document.createElement('a');
  link.href = '#';
  link.className = 'nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent';
  link.textContent = rotulo;
  corpo.appendChild(link);
}`,
  };
}

function bodyForm(): Body {
  return {
    imports: [importing('form', 'createFormField'), importing('input', 'createInput')],
    // `createFormField` é quem fecha o par rótulo ↔ controle e gera o id que
    // falta. Um `<label>` cru com um `<input>` cru pareceria igual e não faria
    // nenhuma das duas coisas.
    //
    // Os DOIS campos que `variants.compositions.advancedFilters` documenta: um
    // terceiro campo aqui ensinaria um filtro que a docs page não mostra.
    block: `const corpo = document.createElement('form');
corpo.className = 'nds-stack';
corpo.dataset.spacing = 'sm';
corpo.append(
  createFormField({ label: 'Categoria', input: createInput({ value: 'Eletrônicos' }) }),
  createFormField({ label: 'Preço mínimo', input: createInput({ type: 'number', value: '100' }) }),
);`,
  };
}

/**
 * Corpo da composição de edição de perfil — TRÊS campos, como o preview: Nome,
 * Nome de usuário e Bio, na ordem do conteúdo compartilhado.
 *
 * Separado de `bodyForm` porque o assunto é outro: lá são filtros de uma
 * listagem, aqui são dados de uma pessoa, e o snippet de cada composição tem de
 * mostrar o que aquele painel renderiza.
 */
function bodyProfile(): Body {
  return {
    imports: [importing('form', 'createFormField'), importing('input', 'createInput')],
    block: `const corpo = document.createElement('form');
corpo.className = 'nds-stack';
corpo.dataset.spacing = 'sm';
corpo.append(
  createFormField({ label: 'Nome', input: createInput({ value: 'Juliana Mucci' }) }),
  createFormField({ label: 'Nome de usuário', input: createInput({ value: '@julianamucci' }) }),
  createFormField({ label: 'Bio', input: createInput({ value: 'Designer de sistemas em São Paulo' }) }),
);`,
  };
}

function bodyOf(o: SheetSnippetOptions): Body {
  switch (o.body) {
    case 'paragraphs':
      return bodyParagrafos(o.paragrafos ?? 24);
    case 'actions':
      return bodyActions();
    case 'navigation':
      return bodyNavigation();
    case 'form':
      return bodyForm();
    case 'profile':
      return bodyProfile();
    default:
      return bodyText();
  }
}

/**
 * O rodapé.
 *
 * A fábrica não expõe um botão de fechar componível: o X do canto vem pronto, e
 * quem fecha pelos botões do rodapé é o overlay. É o que a linha do clique
 * mostra — sem ela, o snippet prometeria um `SheetClose` que não existe.
 */
function footer(o: SheetSnippetOptions): { block?: string; referencia?: string } {
  const cancelar = o.cancelLabel === false ? undefined : (o.cancelLabel ?? 'Cancelar');
  const aplicar = o.applyLabel === false ? undefined : (o.applyLabel ?? 'Aplicar filtros');
  if (!cancelar && !aplicar) return {};

  const buttons = [
    cancelar ? `createButton({ variant: 'outline', label: ${text(cancelar)} })` : undefined,
    aplicar ? `createButton({ label: ${text(aplicar)} })` : undefined,
  ].filter((b): b is string => Boolean(b));

  return {
    referencia: 'rodape',
    block: `const rodape = document.createElement('div');
rodape.className = 'nds-cluster';
rodape.dataset.spacing = 'md';
rodape.append(
${buttons.map((b) => `  ${b},`).join('\n')}
);
// A fábrica não expõe um botão de fechar componível: quem fecha por fora é o
// overlay, e é ele que os botões do rodapé acionam.
for (const botao of Array.from(rodape.children)) {
  botao.addEventListener('click', () => {
    document.querySelector<HTMLElement>('[data-slot="sheet-overlay"]')?.click();
  });
}`,
  };
}

function panelLines(o: SheetSnippetOptions, trigger: string, rodapeRef?: string): string[] {
  return options([
    ['trigger', trigger],
    // `right` é o padrão da fábrica e não entra no snippet.
    ['side', o.side && o.side !== 'right' ? text(o.side) : undefined],
    ['title', text(o.title ?? 'Filtros avançados')],
    [
      'description',
      o.description === ''
        ? undefined
        : text(o.description ?? 'Configure os filtros para refinar os resultados.'),
    ],
    ['content', 'corpo'],
    ['footer', rodapeRef],
    // Só quando é FALSO: `true` é o padrão da fábrica e não entra no snippet.
    ['showCloseButton', o.showCloseButton === false ? 'false' : undefined],
    ['onOpenChange', expressao(o.onOpenChange, CALLBACK_ABERTURA)],
    ['onClose', expressao(o.onClose, CALLBACK_FECHAMENTO)],
  ]);
}

/** A chamada real de `createSheet` com o gatilho, o corpo e o rodapé da story. */
export function sheetSnippet(o: SheetSnippetOptions = {}): string {
  const body = bodyOf(o);
  const pe = footer(o);
  const trigger = `createButton({ variant: 'outline', label: ${text(o.triggerLabel ?? 'Abrir filtros')} })`;

  return snippet(
    [importing('sheet', 'createSheet'), importing('button', 'createButton'), ...body.imports]
      .filter((line, i, all) => all.indexOf(line) === i)
      .join('\n'),
    body.block,
    pe.block,
    `const painel = ${callLine('createSheet', panelLines(o, trigger, pe.referencia))};`,
    appendLine('painel'),
    o.mostrarDestroy
      ? `// O painel mora no \`body\` e o ouvinte de teclado mora no \`document\`: quem
// tira o componente da página chama \`destroy()\` para não deixar nenhum dos
// dois para trás.
painel.destroy();`
      : undefined,
  );
}

/**
 * Abertura comandada de fora.
 *
 * Forma própria porque a fábrica NÃO expõe uma prop de estado: quem abre por
 * código aciona o gatilho interno e acompanha o painel por `onOpenChange`. Um
 * snippet com o gatilho visível esconderia exatamente isso.
 */
export function sheetControlledSnippet(o: SheetSnippetOptions = {}): string {
  const body = bodyOf(o);

  return snippet(
    [importing('sheet', 'createSheet'), importing('button', 'createButton'), ...body.imports]
      .filter((line, i, all) => all.indexOf(line) === i)
      .join('\n'),
    body.block,
    `// O gatilho da fábrica continua existindo, fora da tela e fora do percurso do
// teclado: é por ele que a abertura programática passa.
const gatilhoInterno = createButton({ variant: 'outline', label: 'Abrir painel' });
gatilhoInterno.classList.add('nds-sr-only');
gatilhoInterno.setAttribute('tabindex', '-1');
gatilhoInterno.setAttribute('aria-hidden', 'true');`,
    `let aberto = false;
const painel = ${callLine('createSheet', [
      'trigger: gatilhoInterno,',
      `title: ${text(o.title ?? 'Controlado pelo pai')},`,
      `description: ${text(o.description ?? 'Abertura programática pelo gatilho interno.')},`,
      'content: corpo,',
      'onOpenChange: (estado) => { aberto = estado; },',
    ])};`,
    `const externo = createButton({ label: ${text(o.triggerLabel ?? 'Abrir pelo estado externo')} });
externo.addEventListener('click', () => {
  if (!aberto) gatilhoInterno.click();
});`,
    `document.querySelector('#app')?.append(externo, painel);`,
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai no painel da direita com rodapé, que
 * é o uso canônico do componente.
 */
export const sheetSource: SourceTransform<SheetSnippetOptions> = (_gerado, ctx) =>
  sheetSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function sheetSourceWith(fixas: SheetSnippetOptions): SourceTransform<SheetSnippetOptions> {
  return (_gerado, ctx) => sheetSnippet({ ...ctx.args, ...fixas });
}

/** Transform de story para a abertura comandada de fora. */
export function sheetSourceControlled(
  fixas: SheetSnippetOptions = {},
): SourceTransform<SheetSnippetOptions> {
  return (_gerado, ctx) => sheetControlledSnippet({ ...ctx.args, ...fixas });
}
