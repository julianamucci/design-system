import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';
import { NdsCodeBlock } from './code-block';
import {
  NdsTable,
  NdsTableBody,
  NdsTableCell,
  NdsTableHead,
  NdsTableHeader,
  NdsTableRow,
  NdsTableWrapper,
} from './table';
import {
  isSafeUrl,
  parseForRender,
  type MdBlockKind,
  type MdInline,
  type MdListItem,
  type MdNode,
} from '@shared/primitives/markdown-ast';

// ─── Markdown ────────────────────────────────────────────────────────────────
//
// Documento em Markdown desenhado a partir de uma ÁRVORE, nunca de HTML. O
// texto vem de fora do código — numa interface conversacional, de um modelo — e
// aqui não existe `innerHTML`: cada nó é um elemento do template e cada texto é
// uma interpolação. Não há superfície de XSS a sanitizar porque não há caminho
// para marcação.
//
// A árvore e a decisão de streaming vêm de @shared/primitives/markdown-ast, que
// as cinco stacks compartilham. O que é desta stack é só o desenho.
//
// A RECURSÃO é por `ngTemplateOutlet`, e não por componente que se importa: a
// árvore aninha (citação contendo blocos, ênfase dentro de link), e dois
// `ng-template` que chamam a si mesmos resolvem isso dentro de um componente
// só. É a forma canônica do Angular para árvore de profundidade desconhecida.
//
// Estrutura e cores em docs/shared/styles/nds/markdown.css.

/** O texto simples de um bloco, para quando só um rótulo cabe. */
function plainText(nodes: MdNode[]): string {
  const inline = (list: MdInline[]): string =>
    list
      .map((n) =>
        n.type === 'text' || n.type === 'inlineCode' ? n.value
        : n.type === 'image' ? n.alt
        : n.type === 'break' ? ' '
        : inline(n.children),
      )
      .join('');

  return nodes
    .map((n) =>
      n.type === 'paragraph' || n.type === 'heading' ? inline(n.children)
      : n.type === 'code' || n.type === 'raw' ? n.value
      : n.type === 'list' ? n.items.map((i) => plainText(i.children)).join(' ')
      : n.type === 'blockquote' ? plainText(n.children)
      : '',
    )
    .join(' ')
    .trim();
}

@Component({
  selector: 'nds-markdown',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    NdsCodeBlock,
    NdsTable,
    NdsTableBody,
    NdsTableCell,
    NdsTableHead,
    NdsTableHeader,
    NdsTableRow,
    NdsTableWrapper,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[attr.data-slot]': '"markdown"',
    // `data-streaming` como string: o contexto de expressão do template Angular
    // não expõe globais como String, então a conversão vem de um computed.
    '[attr.data-streaming]': 'streamingAttr()',
    '[attr.data-allow]': 'allowAttr()',
    // Ocupado enquanto gera, para quem ouve saber que o conteúdo ainda muda.
    //
    // E NÃO é região viva: anunciar a cada trecho tornaria a leitura
    // impossível. A resposta é anunciada uma vez, inteira, quando termina — que
    // é o que o leitor de tela faz sozinho ao encontrar o documento parado.
    '[attr.aria-busy]': 'busyAttr()',
    class: 'nds-markdown',
  },
  template: `
    @for (node of tree().children; track $index) {
      <ng-container *ngTemplateOutlet="blockTpl; context: { $implicit: node }" />
    }

    <!-- ── Bloco, recursivo ─────────────────────────────────────────────── -->
    <ng-template #blockTpl let-node>
      @switch (node.type) {
        @case ('paragraph') {
          <p class="nds-markdown-paragraph">
            <ng-container
              *ngTemplateOutlet="inlineTpl; context: { $implicit: node.children }"
            />
          </p>
        }
        @case ('heading') {
          <!-- O nível é o que o texto declarou; a escada de tipos tem quatro
               degraus e o documento aceita seis. -->
          @switch (node.depth) {
            @case (1) {
              <h1 class="nds-text-h1 nds-markdown-heading">
                <ng-container *ngTemplateOutlet="inlineTpl; context: { $implicit: node.children }" />
              </h1>
            }
            @case (2) {
              <h2 class="nds-text-h2 nds-markdown-heading">
                <ng-container *ngTemplateOutlet="inlineTpl; context: { $implicit: node.children }" />
              </h2>
            }
            @case (3) {
              <h3 class="nds-text-h3 nds-markdown-heading">
                <ng-container *ngTemplateOutlet="inlineTpl; context: { $implicit: node.children }" />
              </h3>
            }
            @case (4) {
              <h4 class="nds-text-h4 nds-markdown-heading">
                <ng-container *ngTemplateOutlet="inlineTpl; context: { $implicit: node.children }" />
              </h4>
            }
            @case (5) {
              <h5 class="nds-text-h4 nds-markdown-heading">
                <ng-container *ngTemplateOutlet="inlineTpl; context: { $implicit: node.children }" />
              </h5>
            }
            @default {
              <h6 class="nds-text-h4 nds-markdown-heading">
                <ng-container *ngTemplateOutlet="inlineTpl; context: { $implicit: node.children }" />
              </h6>
            }
          }
        }
        @case ('code') {
          <!-- Delegado: o CodeBlock já traz destaque de sintaxe pelos tokens do
               tema, numeração e o botão de copiar. -->
          <nds-code-block [code]="node.value" [language]="node.lang ?? undefined" />
        }
        @case ('blockquote') {
          <blockquote class="nds-markdown-quote">
            @for (child of node.children; track $index) {
              <ng-container *ngTemplateOutlet="blockTpl; context: { $implicit: child }" />
            }
          </blockquote>
        }
        @case ('list') {
          @if (node.ordered) {
            <ol class="nds-markdown-list" [attr.start]="startOf(node)">
              @for (item of node.items; track $index) {
                <ng-container *ngTemplateOutlet="itemTpl; context: { $implicit: item }" />
              }
            </ol>
          } @else {
            <ul class="nds-markdown-list">
              @for (item of node.items; track $index) {
                <ng-container *ngTemplateOutlet="itemTpl; context: { $implicit: item }" />
              }
            </ul>
          }
        }
        @case ('thematicBreak') {
          <hr class="nds-markdown-rule" />
        }
        @case ('table') {
          <div ndsTableWrapper>
            <table ndsTable class="nds-markdown-table">
              @if (hasHeader(node)) {
                <thead ndsTableHeader>
                  @for (row of headerRows(node); track $index) {
                    <tr ndsTableRow>
                      @for (cell of row.cells; track $index) {
                        <th ndsTableHead scope="col" [attr.data-align]="node.align[$index]">
                          <ng-container
                            *ngTemplateOutlet="inlineTpl; context: { $implicit: cell }"
                          />
                        </th>
                      }
                    </tr>
                  }
                </thead>
              }
              <tbody ndsTableBody>
                @for (row of bodyRows(node); track $index) {
                  <tr ndsTableRow>
                    @for (cell of row.cells; track $index) {
                      <td ndsTableCell [attr.data-align]="node.align[$index]">
                        <ng-container *ngTemplateOutlet="inlineTpl; context: { $implicit: cell }" />
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
        @case ('raw') {
          <!-- O que a lista branca recusou, o que o parser não estruturou e a
               construção ainda aberta durante o streaming. Sai como TEXTO:
               bloco que desaparece deixa quem lê sem saber que havia algo ali.

               A interpolação fica COLADA nas tags: este parágrafo desenha com
               white-space: pre-wrap, e recuo do template apareceria na tela. -->
          <p class="nds-markdown-raw">{{ node.value }}</p>
        }
      }
    </ng-template>

    <!-- ── Item de lista ────────────────────────────────────────────────── -->
    <ng-template #itemTpl let-item>
      <li class="nds-markdown-item" [class.nds-markdown-task]="item.checked !== null">
        <!-- Item de tarefa: a caixa é um checkbox desabilitado de verdade, e
             não um glifo — ela anuncia "marcada" ou "não marcada", que é a
             informação que o texto carregava.

             E toda caixa precisa de NOME. Sem ele o axe reprova por controle de
             formulário sem rótulo, e com razão: a caixa seria anunciada
             sozinha, sem dizer o que está marcado. O nome é o próprio texto do
             item, e por isso o texto vai DENTRO de um label — assim ele é o
             nome e o conteúdo ao mesmo tempo, sem ser lido duas vezes. -->
        @if (item.checked !== null && inlineOnly(item)) {
          <label class="nds-markdown-task-label">
            <input type="checkbox" [checked]="item.checked" disabled />
            <ng-container
              *ngTemplateOutlet="inlineTpl; context: { $implicit: inlineOnly(item) }"
            />
          </label>
        } @else {
          <!-- Item com mais de um bloco: label só aceita conteúdo de frase,
               então uma lista aninhada dentro dele seria markup inválido. Aqui
               o nome vem por atributo, com o texto simples do item. -->
          @if (item.checked !== null) {
            <input
              type="checkbox"
              [checked]="item.checked"
              disabled
              [attr.aria-label]="labelOf(item)"
            />
          }
          @if (inlineOnly(item)) {
            <ng-container
              *ngTemplateOutlet="inlineTpl; context: { $implicit: inlineOnly(item) }"
            />
          } @else {
            @for (child of item.children; track $index) {
              <ng-container *ngTemplateOutlet="blockTpl; context: { $implicit: child }" />
            }
          }
        }
      </li>
    </ng-template>

    <!-- ── Conteúdo de frase, recursivo ─────────────────────────────────── -->
    <!--
      A formatação é apertada de propósito: recuo entre a tag e o texto vira um
      espaço VISÍVEL, e no documento de demonstração a ênfase termina colada na
      vírgula (\`**texto**,\`).
    -->
    <ng-template #inlineTpl let-nodes
      >@for (node of nodes; track $index) {@switch (node.type) {@case ('text')
          {{{ node.value }}}@case ('strong')
          {<strong
              ><ng-container *ngTemplateOutlet="inlineTpl; context: { $implicit: node.children }"
            /></strong>}@case ('emphasis')
          {<em
              ><ng-container *ngTemplateOutlet="inlineTpl; context: { $implicit: node.children }"
            /></em>}@case ('delete')
          {<s
              ><ng-container *ngTemplateOutlet="inlineTpl; context: { $implicit: node.children }"
            /></s>}@case ('inlineCode')
          {<code class="nds-code-inline nds-markdown-inline-code">{{ node.value }}</code>}@case
          ('link')
          {<a
              class="nds-markdown-link"
              [attr.href]="safeHref(node.url)"
              [attr.rel]="isExternal(node.url) ? 'noreferrer' : null"
              (click)="onLinkClicked($event, node.url)"
              ><ng-container *ngTemplateOutlet="inlineTpl; context: { $implicit: node.children }"
            /></a>}@case ('image')
          {<img
              class="nds-markdown-image"
              [attr.src]="safeHref(node.url)"
              [attr.alt]="node.alt"
              loading="lazy"
            />}@case ('break') {<br />}}}</ng-template
    >
  `,
})
export class NdsMarkdown {
  /** O texto em Markdown. Vem de fora do código e é tratado como não confiável. */
  readonly content = input.required<string>();
  /** Ligue enquanto o texto ainda chega. */
  readonly streaming = input(false);
  /** Quais blocos podem ser estruturados. O que fica de fora vira texto. */
  readonly allow = input<readonly MdBlockKind[] | undefined>(undefined);
  /** Esquemas de endereço aceitos em link e imagem. */
  readonly allowedProtocols = input<readonly string[] | undefined>(undefined);

  /**
   * O clique num link, com o endereço já validado.
   *
   * `output()` e não prop de callback: é a forma que quem escreve Angular
   * espera. Divergência de API entre frameworks não se "alinha" — cada stack
   * usa a sua, e o conteúdo compartilhado descreve o CONCEITO.
   */
  readonly linkClick = output<string>();

  readonly tree = computed(() =>
    parseForRender(this.content(), {
      streaming: this.streaming(),
      allow: this.allow(),
      allowedProtocols: this.allowedProtocols(),
    }),
  );

  readonly streamingAttr = computed(() => String(this.streaming()));
  readonly allowAttr = computed(() => this.allow()?.join(' ') ?? null);
  readonly busyAttr = computed(() => (this.streaming() ? 'true' : null));

  /** Endereço absoluto sai do site — não vaze o referenciador para ele. */
  isExternal(url: string): boolean {
    return /^https?:/i.test(url);
  }

  /**
   * O parser já recusou o que não presta — link de esquema fora da lista nem
   * chega aqui como link. A pergunta é feita de novo no ponto em que o endereço
   * encosta no DOM: assim a garantia não depende de quem chamou o parser antes,
   * e fica onde uma varredura de segurança consegue vê-la.
   */
  safeHref(url: string): string | null {
    return isSafeUrl(url, this.allowedProtocols()) ? url : null;
  }

  onLinkClicked(event: Event, url: string): void {
    // Com ouvinte, quem navega é a aplicação — é o que permite empurrar a rota
    // sem recarregar. O `href` continua ali, então abrir em outra aba e copiar
    // o endereço seguem funcionando.
    event.preventDefault();
    this.linkClick.emit(url);
  }

  /** Início de lista ordenada, só quando não é 1. */
  startOf(node: Extract<MdNode, { type: 'list' }>): number | null {
    return node.start !== null && node.start !== 1 ? node.start : null;
  }

  hasHeader(node: Extract<MdNode, { type: 'table' }>): boolean {
    return node.rows.some((row) => row.header);
  }

  headerRows(node: Extract<MdNode, { type: 'table' }>) {
    return node.rows.filter((row) => row.header);
  }

  bodyRows(node: Extract<MdNode, { type: 'table' }>) {
    return node.rows.filter((row) => !row.header);
  }

  /**
   * Item de lista quase sempre tem um parágrafo só. Desembrulhá-lo evita uma
   * caixa a mais entre o marcador e o texto, e é o que faz a caixa de tarefa
   * ficar na mesma linha do conteúdo.
   */
  inlineOnly(item: MdListItem): MdInline[] | null {
    const blocks = item.children;
    if (blocks.length === 1 && blocks[0].type === 'paragraph') return blocks[0].children;
    return null;
  }

  labelOf(item: MdListItem): string {
    return plainText(item.children);
  }
}
