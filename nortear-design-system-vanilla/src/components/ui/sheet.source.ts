// Snippet do painel Code do Sheet — ver `@/lib/story-source`.

import {
  chamada,
  importing,
  montar,
  opcoes,
  snippet,
  texto,
  type SourceTransform,
} from '@/lib/story-source';
import type { SheetSide } from './sheet';

/** O que ocupa o `content` do painel. Muda o CORPO, não a chamada. */
export type SheetBody = 'texto' | 'paragrafos' | 'acoes' | 'navegacao' | 'formulario';

/** O que as stories usam da `SheetOptions`, mais o corpo que cada uma monta. */
export type SheetSnippetOptions = {
  triggerLabel?: string;
  side?: SheetSide;
  title?: string;
  description?: string;
  corpo?: SheetBody;
  /** Rótulos do rodapé. `false` monta o painel SEM rodapé. */
  cancelLabel?: string | false;
  applyLabel?: string | false;
  /** Presença liga a linha do callback; string troca a expressão mostrada. */
  onOpenChange?: unknown;
  /** Idem, para o motivo do fechamento. */
  onClose?: unknown;
  /** Quantos parágrafos o corpo longo empilha. */
  paragrafos?: number;
  /** Mostra o `destroy()` — quem tira o painel da página o chama. */
  mostrarDestroy?: boolean;
};

const CALLBACK_ABERTURA = '(aberto) => registrarPainel(aberto)';
const CALLBACK_FECHAMENTO = '(motivo) => registrarSaida(motivo)';

function expressao(valor: unknown, padrao: string): string | undefined {
  if (!valor) return undefined;
  return typeof valor === 'string' ? valor : padrao;
}

// ─── Corpos de demonstração ──────────────────────────────────────────────────
//
// O conteúdo é de quem consome — a fábrica não o inventa. Cada bloco abaixo é
// escrito com fábricas do design system ou com DOM curto, nunca com o
// `buildPlayground`/`makeBody` que só existe dentro do arquivo de story.

type Corpo = { imports: string[]; bloco: string };

function bodyText(): Corpo {
  return {
    imports: [],
    bloco: `const corpo = document.createElement('div');
corpo.className = 'nds-text-body nds-text-muted-foreground';
corpo.textContent = 'Conteúdo do painel (formulário, lista, mensagem).';`,
  };
}

function bodyParagrafos(total: number): Corpo {
  return {
    imports: [],
    // O corpo é quem rola: `.nds-sheet-body` já tem o teto de altura e o
    // `tabindex` que o torna alcançável por teclado. O rodapé fica onde está.
    bloco: `const corpo = document.createElement('div');
corpo.className = 'nds-stack nds-text-body nds-text-muted-foreground';
corpo.dataset.spacing = 'sm';
for (let i = 1; i <= ${total}; i++) {
  const paragrafo = document.createElement('p');
  paragrafo.textContent = \`Parágrafo \${i} dos termos de uso.\`;
  corpo.appendChild(paragrafo);
}`,
  };
}

function bodyActions(): Corpo {
  return {
    imports: [importing('button', 'createButton')],
    bloco: `const corpo = document.createElement('div');
corpo.className = 'nds-cluster';
corpo.dataset.spacing = 'sm';
for (const rotulo of ['Compartilhar', 'Copiar link', 'Editar', 'Arquivar']) {
  corpo.appendChild(createButton({ variant: 'outline', label: rotulo }));
}`,
  };
}

function bodyNavigation(): Corpo {
  return {
    imports: [],
    // A lista de links é um marco: sem nome, o leitor de tela anuncia
    // "navegação" e mais nada.
    bloco: `const corpo = document.createElement('nav');
corpo.className = 'nds-stack';
corpo.dataset.spacing = 'sm';
corpo.setAttribute('aria-label', 'Seções');
for (const rotulo of ['Dashboard', 'Projetos', 'Equipe', 'Configurações']) {
  const link = document.createElement('a');
  link.href = '#';
  link.className = 'nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent';
  link.textContent = rotulo;
  corpo.appendChild(link);
}`,
  };
}

function bodyForm(): Corpo {
  return {
    imports: [importing('form', 'createFormField'), importing('input', 'createInput')],
    // `createFormField` é quem fecha o par rótulo ↔ controle e gera o id que
    // falta. Um `<label>` cru com um `<input>` cru pareceria igual e não faria
    // nenhuma das duas coisas.
    bloco: `const corpo = document.createElement('form');
corpo.className = 'nds-stack';
corpo.dataset.spacing = 'sm';
corpo.append(
  createFormField({ label: 'Categoria', input: createInput({ value: 'Eletrônicos' }) }),
  createFormField({ label: 'Preço mínimo', input: createInput({ type: 'number', value: '100' }) }),
  createFormField({ label: 'Preço máximo', input: createInput({ type: 'number', value: '500' }) }),
);`,
  };
}

function bodyOf(o: SheetSnippetOptions): Corpo {
  switch (o.corpo) {
    case 'paragrafos':
      return bodyParagrafos(o.paragrafos ?? 24);
    case 'acoes':
      return bodyActions();
    case 'navegacao':
      return bodyNavigation();
    case 'formulario':
      return bodyForm();
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
function rodape(o: SheetSnippetOptions): { bloco?: string; referencia?: string } {
  const cancelar = o.cancelLabel === false ? undefined : (o.cancelLabel ?? 'Cancelar');
  const aplicar = o.applyLabel === false ? undefined : (o.applyLabel ?? 'Aplicar filtros');
  if (!cancelar && !aplicar) return {};

  const buttons = [
    cancelar ? `createButton({ variant: 'outline', label: ${texto(cancelar)} })` : undefined,
    aplicar ? `createButton({ label: ${texto(aplicar)} })` : undefined,
  ].filter((b): b is string => Boolean(b));

  return {
    referencia: 'rodape',
    bloco: `const rodape = document.createElement('div');
rodape.className = 'nds-cluster';
rodape.dataset.spacing = 'sm';
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

function panelLines(o: SheetSnippetOptions, gatilho: string, rodapeRef?: string): string[] {
  return opcoes([
    ['trigger', gatilho],
    // `right` é o padrão da fábrica e não entra no snippet.
    ['side', o.side && o.side !== 'right' ? texto(o.side) : undefined],
    ['title', texto(o.title ?? 'Filtros avançados')],
    [
      'description',
      o.description === ''
        ? undefined
        : texto(o.description ?? 'Configure os filtros para refinar os resultados.'),
    ],
    ['content', 'corpo'],
    ['footer', rodapeRef],
    ['onOpenChange', expressao(o.onOpenChange, CALLBACK_ABERTURA)],
    ['onClose', expressao(o.onClose, CALLBACK_FECHAMENTO)],
  ]);
}

/** A chamada real de `createSheet` com o gatilho, o corpo e o rodapé da story. */
export function sheetSnippet(o: SheetSnippetOptions = {}): string {
  const corpo = bodyOf(o);
  const pe = rodape(o);
  const gatilho = `createButton({ variant: 'outline', label: ${texto(o.triggerLabel ?? 'Abrir filtros')} })`;

  return snippet(
    [importing('sheet', 'createSheet'), importing('button', 'createButton'), ...corpo.imports]
      .filter((linha, i, todas) => todas.indexOf(linha) === i)
      .join('\n'),
    corpo.bloco,
    pe.bloco,
    `const painel = ${chamada('createSheet', panelLines(o, gatilho, pe.referencia))};`,
    montar('painel'),
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
  const corpo = bodyOf(o);

  return snippet(
    [importing('sheet', 'createSheet'), importing('button', 'createButton'), ...corpo.imports]
      .filter((linha, i, todas) => todas.indexOf(linha) === i)
      .join('\n'),
    corpo.bloco,
    `// O gatilho da fábrica continua existindo, fora da tela e fora do percurso do
// teclado: é por ele que a abertura programática passa.
const gatilhoInterno = createButton({ variant: 'outline', label: 'Abrir painel' });
gatilhoInterno.classList.add('nds-sr-only');
gatilhoInterno.setAttribute('tabindex', '-1');
gatilhoInterno.setAttribute('aria-hidden', 'true');`,
    `let aberto = false;
const painel = ${chamada('createSheet', [
      'trigger: triggerInterno,',
      `title: ${texto(o.title ?? 'Controlado pelo pai')},`,
      `description: ${texto(o.description ?? 'Abertura programática pelo gatilho interno.')},`,
      'content: corpo,',
      'onOpenChange: (estado) => { aberto = estado; },',
    ])};`,
    `const externo = createButton({ label: ${texto(o.triggerLabel ?? 'Abrir pelo estado externo')} });
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
