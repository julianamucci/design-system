// ─── Editor — protótipo Vanilla ──────────────────────────────────────────────
//
// Editor de texto rico sobre `@tiptap/core`, com três marcas e um botão de
// fórmula. NÃO é um componente entregue: é a medição que decide se o Tiptap
// entra no design system, e o que ele custa.
//
// Por que Vanilla primeiro: `EditorOptions.element` do Tiptap aceita um
// `Element` qualquer, então o núcleo monta nas cinco stacks sem binding de
// framework — `@tiptap/react`, `@tiptap/vue-3` e afins são conveniência de
// ciclo de vida, não requisito. Provar isso na stack que não tem framework
// nenhum é o que sustenta a afirmação para as outras quatro.
//
// A folha do KaTeX é importada AQUI, e não na `globals.css`, de propósito: são
// dezenas de kB de CSS mais os arquivos de fonte, e quem não usa o editor não
// deve pagar por eles. Importada no módulo, ela viaja no mesmo pedaço que o
// editor e some do pacote das páginas que não o carregam.

import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Mathematics } from '@tiptap/extension-mathematics';
import DOMPurify from 'dompurify';
import { Bold, Italic, Strikethrough, Sigma } from 'lucide';
import 'katex/dist/katex.min.css';

import { cn } from '@/lib/utils';
import { createToggleGroup } from './toggle-group';
import { createInput } from './input';
import { createButton } from './button';
import { tornarDestruivel, type DestroyableElement } from '@/lib/destroy';

type LucideIconNode = [string, Record<string, string>];

/** As três marcas da barra. O StarterKit já traz as três — nada a configurar. */
export type EditorMark = 'bold' | 'italic' | 'strike';

export type EditorLabels = {
  /** Nome acessível da barra inteira. */
  toolbar: string;
  /**
   * Nome acessível do GRUPO das três marcas.
   *
   * Grupo dentro de barra sem nome próprio é anunciado como "grupo" e mais
   * nada — e esta barra tem dois blocos, o das marcas e o da fórmula.
   */
  marks: string;
  bold: string;
  italic: string;
  strike: string;
  /**
   * Nome acessível da ÁREA EDITÁVEL.
   *
   * A lib põe `role="textbox"` no elemento editável, e campo com papel de
   * campo e sem nome é violação de `aria-input-field-name` — o axe reprovou
   * na primeira rodada desta story. Não há rótulo visível a que apontar: a
   * moldura inteira é o campo.
   */
  editorField: string;
  /** Botão que abre a linha da fórmula. */
  formula: string;
  /** Rótulo do campo de LaTeX — vai em `aria-label`, não há rótulo visível. */
  formulaField: string;
  /** Botão que confirma a fórmula. Este tem texto visível. */
  formulaConfirm: string;
};

export type EditorOptions = {
  /**
   * Conteúdo inicial, em HTML. Passa por `DOMPurify` antes de chegar à lib: o
   * Tiptap monta o documento a partir de um nó criado por `innerHTML`, e
   * `<img onerror>` dispara mesmo em nó solto do documento. O esquema do
   * ProseMirror descartaria o nó depois — tarde demais.
   */
  content?: string;
  editable?: boolean;
  labels: EditorLabels;
  class?: string;
};

/**
 * A raiz devolvida carrega a instância da lib.
 *
 * Sem isso, story e teste só alcançariam o editor pelo DOM — e o estado que
 * importa (marca ativa, documento, transação) vive na instância, não no DOM.
 */
export type EditorRoot = DestroyableElement<HTMLDivElement> & { editor: Editor };

const MARK_ICONS: Record<EditorMark, LucideIconNode[]> = {
  bold: Bold as unknown as LucideIconNode[],
  italic: Italic as unknown as LucideIconNode[],
  strike: Strikethrough as unknown as LucideIconNode[],
};

/** Monta um SVG a partir dos nós do lucide — mesma forma do alert e do breadcrumb. */
function icone(nodes: LucideIconNode[]): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  for (const [tag, attrs] of nodes) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    svg.appendChild(node);
  }
  return svg;
}

export function createEditor(options: EditorOptions): EditorRoot {
  const { labels, editable = true } = options;

  const root = document.createElement('div');
  root.dataset.slot = 'editor';
  root.className = cn('nds-editor', options.class);

  // ─── Barra ────────────────────────────────────────────────────────────────
  const toolbar = document.createElement('div');
  toolbar.dataset.slot = 'editor-toolbar';
  toolbar.className = 'nds-editor-toolbar';
  toolbar.setAttribute('role', 'toolbar');
  toolbar.setAttribute('aria-label', labels.toolbar);

  const marcas: EditorMark[] = ['bold', 'italic', 'strike'];

  // As três marcas são um GRUPO, não três botões soltos: elas se aplicam ao
  // mesmo trecho e acumulam (negrito E itálico), que é exatamente `multiple`.
  //
  // `role: 'group'` porque o grupo está ANINHADO nesta barra, ao lado do botão
  // de fórmula, que não é alternador. Assim quem navega alcança a barra inteira
  // com as setas, em vez de ficar preso no trio.
  const grupo = createToggleGroup({
    type: 'multiple',
    role: 'group',
    'aria-label': labels.marks,
    items: marcas.map((m) => ({
      value: m,
      'aria-label': labels[m],
      children: icone(MARK_ICONS[m]),
    })),
  });
  const botoes = Array.from(grupo.querySelectorAll<HTMLButtonElement>('[data-slot="toggle"]'));

  const separador = document.createElement('span');
  separador.className = 'nds-editor-toolbar-separator';
  separador.setAttribute('aria-hidden', 'true');

  const botaoFormula = document.createElement('button');
  botaoFormula.type = 'button';
  botaoFormula.dataset.slot = 'editor-formula-toggle';
  botaoFormula.className = 'nds-toggle';
  botaoFormula.setAttribute('aria-label', labels.formula);
  botaoFormula.setAttribute('aria-expanded', 'false');
  botaoFormula.appendChild(icone(Sigma as unknown as LucideIconNode[]));

  toolbar.append(grupo, separador, botaoFormula);

  // ─── Linha da fórmula ─────────────────────────────────────────────────────
  const linha = document.createElement('div');
  linha.dataset.slot = 'editor-formula';
  linha.className = 'nds-editor-formula';
  linha.hidden = true;

  const campo = createInput({ placeholder: '\\frac{a}{b}' });
  campo.setAttribute('aria-label', labels.formulaField);
  const confirmar = createButton({ label: labels.formulaConfirm, size: 'sm' });
  linha.append(campo, confirmar);

  const idLinha = 'nds-editor-formula-' + Math.random().toString(36).slice(2, 9);
  linha.id = idLinha;
  botaoFormula.setAttribute('aria-controls', idLinha);

  // ─── Área editável ────────────────────────────────────────────────────────
  const area = document.createElement('div');
  area.dataset.slot = 'editor-content';
  area.className = 'nds-editor-content';

  root.append(toolbar, linha, area);

  const editor = new Editor({
    element: area,
    editable,
    extensions: [StarterKit, Mathematics],
    // O caminho suportado para escrever atributo no elemento editável: a lib
    // recria esse nó, e `setAttribute` de fora seria desfeito.
    editorProps: { attributes: { 'aria-label': labels.editorField } },
    content: options.content ? DOMPurify.sanitize(options.content) : undefined,
  });

  // ─── Estado dos botões ────────────────────────────────────────────────────
  //
  // `transaction` cobre o que `update` não cobre: mover o cursor não muda o
  // documento, mas muda a marca ativa. Ligar só em `update` deixava o botão
  // aceso depois de sair de um trecho em negrito.
  function sincronizar(): void {
    grupo.setValue(marcas.filter((m) => editor.isActive(m)));
  }
  editor.on('transaction', sincronizar);
  sincronizar();

  for (const btn of botoes) {
    btn.addEventListener('click', () => {
      const mark = btn.dataset.value as EditorMark;
      const chain = editor.chain().focus();
      if (mark === 'bold') chain.toggleBold().run();
      else if (mark === 'italic') chain.toggleItalic().run();
      else chain.toggleStrike().run();
    });
  }

  // ─── Abrir, fechar e inserir a fórmula ────────────────────────────────────
  function abrirFormula(aberta: boolean): void {
    linha.hidden = !aberta;
    botaoFormula.setAttribute('aria-expanded', String(aberta));
    botaoFormula.dataset.state = aberta ? 'on' : 'off';
    if (aberta) campo.focus();
  }

  function inserirFormula(): void {
    const latex = campo.value.trim();
    if (!latex) return;
    // `insertInlineMath` guarda o LaTeX num atributo do nó e deixa o KaTeX
    // renderizar. O texto nunca vira HTML: não há caminho de injeção por aqui,
    // e fórmula inválida cai no ramo de erro da própria lib.
    //
    // SEM `.focus()` na corrente, ao contrário dos botões de marca. O comando
    // de foco da lib chega depois do fim desta função — medido: o `focus()` do
    // botão rodava primeiro e a lib o tomava de volta em seguida, deixando o
    // foco no texto quando a linha da fórmula acabara de fechar. A inserção não
    // precisa do foco: a seleção guardada no documento é o ponto de entrada.
    editor.chain().insertInlineMath({ latex }).run();
    campo.value = '';
    abrirFormula(false);
    botaoFormula.focus();
  }

  // `hidden` é `boolean | string` no DOM moderno (`until-found`), então o
  // alternador pergunta pelo valor de verdade, não pelo booleano.
  botaoFormula.addEventListener('click', () => abrirFormula(Boolean(linha.hidden)));
  confirmar.addEventListener('click', inserirFormula);
  campo.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inserirFormula();
    } else if (e.key === 'Escape') {
      abrirFormula(false);
      botaoFormula.focus();
    }
  });

  // ─── Navegação por seta na barra ──────────────────────────────────────────
  //
  // `role="toolbar"` promete uma parada de tabulação só, com as setas andando
  // dentro. Sem isso, a barra promete um contrato que não cumpre — e o leitor
  // de tela anuncia o papel de qualquer jeito.
  const foco = [...botoes, botaoFormula];
  foco.forEach((b, i) => { b.tabIndex = i === 0 ? 0 : -1; });

  toolbar.addEventListener('keydown', (e) => {
    const atual = foco.indexOf(document.activeElement as HTMLButtonElement);
    if (atual < 0) return;
    let proximo: number;
    if (e.key === 'ArrowRight') proximo = (atual + 1) % foco.length;
    else if (e.key === 'ArrowLeft') proximo = (atual - 1 + foco.length) % foco.length;
    else if (e.key === 'Home') proximo = 0;
    else if (e.key === 'End') proximo = foco.length - 1;
    else return;
    e.preventDefault();
    foco[atual].tabIndex = -1;
    foco[proximo].tabIndex = 0;
    foco[proximo].focus();
  });

  const raiz = tornarDestruivel(root, root, () => {
    editor.destroy();
  }) as EditorRoot;
  raiz.editor = editor;
  return raiz;
}
