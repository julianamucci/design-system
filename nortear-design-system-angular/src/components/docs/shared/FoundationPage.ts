/**
 * FoundationPage — renderer genérico das páginas de Foundations (Angular).
 *
 * Uma página de Foundations não tem componente para demonstrar: ela é o próprio
 * conteúdo compartilhado desenhado. Por isso não existe uma docs page por
 * fundamento com quinze seções escritas à mão, e sim ESTE renderer, que lê
 * `docs/shared/content/foundations/<slug>/translations.json` e deduz a forma de
 * cada seção a partir das chaves que ela traz. Cada página vira um arquivo de
 * poucas linhas, e as quatro outras stacks já funcionam assim.
 *
 * ─── Contrato de seção ──────────────────────────────────────────────────────
 *
 * METADADOS (chaves de topo que NÃO viram seção):
 *   title · category · type · description · seo · nav · specimens
 *   `specimens` fica de fora porque é visual próprio da página: entra por
 *   projeção de conteúdo (o equivalente ao `extraSection` do React).
 *
 * SEÇÃO = qualquer outra chave de topo cujo valor seja objeto. Dentro dela:
 *   title      → h2
 *   subtitle   → parágrafo logo abaixo do h2
 *   body       → parágrafo
 *   audience   → parágrafo
 *   note       → parágrafo, sempre por ÚLTIMO
 *   cols+rows  → tabela (cols objeto ou array; rows objeto, array de arrays ou
 *                objeto de arrays)
 *   items      → cartões (item objeto) ou lista de acento (item string)
 *   keys       → idem items (teclado)
 *   rules      → idem items
 *   <chave>Title → h3        (string solta)
 *   <chave>Code  → bloco de código (string solta; variante por stack já
 *                  resolvida — ver `codeResolveVariants`)
 *   outra string → parágrafo
 *   sub-objeto  → subgrupo (h3 + corpo + tabela/itens próprios), a menos que
 *                 seja uma "folha de cartão" (só strings + title/name/body/
 *                 description), caso em que vira cartão junto dos irmãos.
 *
 * ─── Decisões desta stack ───────────────────────────────────────────────────
 *
 * 1. O dicionário é normalizado em TypeScript e o template só itera. Expressão
 *    de template Angular não enxerga `Object.keys`, `Array.isArray` nem
 *    `String` (armadilha 4 do CLAUDE.md), então toda a decisão de forma vive
 *    aqui, em `computed`.
 * 2. `Bloco` tem todos os campos preenchidos (sem união discriminada com
 *    campos ausentes). É deliberado: `strictTemplates` não é validado pelo
 *    `tsc` deste projeto, só pelo compilador Angular na hora do build — um
 *    campo que só existe em um ramo é exatamente o tipo de erro que aparece
 *    tarde e caro.
 * 3. `DOMPurify.sanitize()` aparece no PRÓPRIO binding `[innerHTML]`. As
 *    strings do conteúdo trazem `<code>`, `<strong>`, `<em>`, `<kbd>` e `<a>`,
 *    então quase todo texto desta página passa por ali. Um `computed` `safe*`
 *    esconderia a chamada do SAST e viraria falso positivo permanente de XSS
 *    (guideline 09).
 * 4. Uma `<ng-content />` só, em posição fixa. Duas em ramos de `@if` não
 *    entregariam o conteúdo a nenhum dos dois (armadilha 8).
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
// NgTemplateOutlet PRECISA estar no `imports` abaixo. Sem ele o
// `[ngTemplateOutlet]` vira binding para propriedade inexistente: NG0303 no
// console, página renderizando, teste verde — e some só o que o outlet ia
// instanciar, que aqui é o corpo inteiro de toda seção (armadilha 12).
import { NgTemplateOutlet } from '@angular/common';
import DOMPurify from 'dompurify';

import { NdsBadge } from '@/components/ui/badge';
import { NDS_CARD } from '@/components/ui/card';
import {
  NdsTable,
  NdsTableBody,
  NdsTableCell,
  NdsTableHead,
  NdsTableHeader,
  NdsTableRow,
  NdsTableWrapper,
} from '@/components/ui/table';
import { NdsLanguageSwitcher } from '@/components/product/LanguageSwitcher';
import { getLocale, locale as localeSignal } from '@/lib/i18n';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { mountDocsTracking } from '@/lib/docs-tracking';
import { DOCS_PAGE_TITLE_ID } from './sections/DocsHeader';
import {
  isCodeVariantNode,
  resolveCodeVariant,
  type Stack,
} from '@shared/primitives/code-variants';

// ─── Tipos do modelo de visão ────────────────────────────────────────────────

type Registro = Record<string, unknown>;

/** Stack deste pacote — escolhe a variante das chaves `*Code`. */
const STACK: Stack = 'angular';

/** Cartão do grid de `items` — título, corpo e campos extras (metadados). */
export interface FoundationCartao {
  titulo: string;
  corpo: string;
  extras: string[];
}

export type BlockType =
  | 'paragrafo'
  | 'subtitulo'
  | 'codigo'
  | 'tabela'
  | 'lista'
  | 'cartoes';

/**
 * Um pedaço renderizável de seção.
 *
 * Todos os campos vêm preenchidos (vazios quando não se aplicam) para o
 * template não depender de estreitamento de união — ver decisão 2 no topo.
 */
export interface FoundationBlock {
  tipo: BlockType;
  html: string;
  colunas: string[];
  linhas: string[][];
  itens: string[];
  cartoes: FoundationCartao[];
}

/** Sub-objeto de uma seção: ganha h3 próprio e conteúdo próprio. */
export interface FoundationGroup {
  titulo: string;
  corpo: string;
  blocos: FoundationBlock[];
}

export interface FoundationSection {
  chave: string;
  titulo: string;
  subtitulo: string;
  corpo: string;
  audiencia: string;
  blocos: FoundationBlock[];
  grupos: FoundationGroup[];
  nota: string;
}

// ─── Helpers de forma ────────────────────────────────────────────────────────

function ehObjeto(v: unknown): v is Registro {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function texto(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function bloco(tipo: BlockType, parcial: Partial<FoundationBlock> = {}): FoundationBlock {
  return {
    tipo,
    html: '',
    colunas: [],
    linhas: [],
    itens: [],
    cartoes: [],
    ...parcial,
  };
}

/**
 * Troca cada nó `{ react: '…', angular: '…' }` pelo snippet deste stack.
 *
 * O `i18n.ts` faz isso ao achatar o dicionário, mas aqui o dicionário é
 * percorrido em ÁRVORE (a estrutura é que decide a forma da seção), então a
 * resolução tem de acontecer antes da varredura. Sem ela, um `*Code` com
 * variantes seria lido como sub-objeto e a página mostraria "react", "vue" e
 * "angular" como se fossem itens de conteúdo.
 */
function codeResolveVariants(no: unknown): unknown {
  if (Array.isArray(no)) return no.map(codeResolveVariants);
  if (!ehObjeto(no)) return no;
  const saida: Registro = {};
  for (const [chave, valor] of Object.entries(no)) {
    saida[chave] = isCodeVariantNode(chave, valor)
      ? (resolveCodeVariant(valor, STACK) ?? '')
      : codeResolveVariants(valor);
  }
  return saida;
}

// Chaves candidatas a título e a corpo de um cartão, na ordem de preferência.
const TITLE_KEYS = ['title', 'name', 'label'] as const;
const BODY_KEYS = ['body', 'description', 'usage', 'use', 'text'] as const;

function mountCartao(item: Registro): FoundationCartao {
  const keyTitle = TITLE_KEYS.find((k) => typeof item[k] === 'string');
  const keyBody = BODY_KEYS.find((k) => typeof item[k] === 'string');
  const extras = Object.entries(item)
    .filter(([k, v]) => typeof v === 'string' && k !== keyTitle && k !== keyBody)
    .map(([, v]) => String(v));
  return {
    titulo: keyTitle ? texto(item[keyTitle]) : '',
    corpo: keyBody ? texto(item[keyBody]) : '',
    extras,
  };
}

/** Pares chave→valor de um objeto OU de um array (índice como chave). */
function entries(valor: unknown): Array<[string, unknown]> {
  if (Array.isArray(valor)) return valor.map((v, i) => [String(i), v]);
  if (ehObjeto(valor)) return Object.entries(valor);
  return [];
}

/**
 * `items` / `keys` / `rules`: cartões quando há sub-objeto, lista de acento
 * quando são só strings. É a mesma regra das outras quatro stacks — uma lista
 * de frases não vira grid de cartões de uma linha só.
 */
function itemsBlock(valor: unknown): FoundationBlock {
  const pairs = entries(valor);
  const hasCartoes = pairs.some(([, v]) => ehObjeto(v));

  if (!hasCartoes) {
    return bloco('lista', { itens: pairs.map(([, v]) => String(v)) });
  }

  return bloco('cartoes', {
    cartoes: pairs.map(([, item]) =>
      ehObjeto(item)
        ? mountCartao(item)
        : { titulo: '', corpo: String(item), extras: [] },
    ),
  });
}

/**
 * Tabela a partir de `cols` + `rows`.
 *
 * `cols` pode ser objeto (chave→rótulo) ou array de rótulos; `rows` pode ser
 * objeto de objetos, objeto de arrays ou array de arrays. As três formas
 * existem hoje no conteúdo compartilhado, e é o `cols` que define a ORDEM das
 * células quando a linha é objeto.
 */
function tableBlock(cols: unknown, rows: unknown): FoundationBlock {
  const columnKeys = Array.isArray(cols)
    ? cols.map((_, i) => String(i))
    : Object.keys(ehObjeto(cols) ? cols : {});
  const rotulos = Array.isArray(cols)
    ? cols.map((c) => String(c))
    : Object.values(ehObjeto(cols) ? cols : {}).map((c) => String(c));

  const linhas = entries(rows).map(([, linha]) => {
    if (Array.isArray(linha)) return linha.map((c) => String(c ?? ''));
    if (ehObjeto(linha)) return columnKeys.map((k) => String(linha[k] ?? ''));
    return [String(linha)];
  });

  return bloco('tabela', { colunas: rotulos, linhas });
}

// Chaves com tratamento próprio dentro de uma seção — o resto é deduzido.
const TEXT_KEYS = ['title', 'subtitle', 'body', 'audience', 'note'];
const KEYS_RESERVADAS = [...TEXT_KEYS, 'cols', 'rows', 'items', 'keys', 'rules'];

/**
 * Sub-objeto que é "folha de cartão": traz título/corpo e só strings dentro.
 * Vira cartão junto dos irmãos em vez de subgrupo com h3 próprio — é o caso de
 * `testing.automated` / `testing.manual` na página de Acessibilidade.
 */
function cartaoEhSheet(v: Registro): boolean {
  const hasLabel = 'title' in v || 'name' in v || 'body' in v || 'description' in v;
  return hasLabel && Object.values(v).every((x) => typeof x === 'string');
}

function mountSubgrupo(valor: Registro): FoundationGroup {
  const titulo = texto(valor['title']);
  const corpo = texto(valor['subtitle']) || texto(valor['body']);
  const itens = valor['items'] ?? valor['rules'];
  const hasTable = valor['cols'] !== undefined && valor['rows'] !== undefined;

  const blocos: FoundationBlock[] = [];
  if (hasTable) blocos.push(tableBlock(valor['cols'], valor['rows']));
  if (itens !== undefined) blocos.push(itemsBlock(itens));
  // Mapa puro (sem título, sem itens, sem tabela): o próprio objeto é o conteúdo.
  if (!titulo && itens === undefined && !hasTable) blocos.push(itemsBlock(valor));

  return { titulo, corpo, blocos };
}

function mountSection(chave: string, dados: Registro): FoundationSection {
  const blocos: FoundationBlock[] = [];

  // Strings soltas primeiro, na ordem em que aparecem no JSON: são os passos de
  // um roteiro (`cloneTitle` → `cloneCode` → `installNote`), e a ordem é o
  // conteúdo.
  for (const [k, v] of Object.entries(dados)) {
    if (typeof v !== 'string' || TEXT_KEYS.includes(k)) continue;
    if (k.endsWith('Title')) blocos.push(bloco('subtitulo', { html: v }));
    else if (k.endsWith('Code')) blocos.push(bloco('codigo', { html: v }));
    else blocos.push(bloco('paragrafo', { html: v }));
  }

  const hasTable = dados['cols'] !== undefined && dados['rows'] !== undefined;
  if (hasTable) blocos.push(tableBlock(dados['cols'], dados['rows']));
  if (dados['items'] !== undefined) blocos.push(itemsBlock(dados['items']));

  // Sem `items`/`cols`/`rows`, as folhas de cartão soltas na seção viram o grid
  // que o `items` teria dado — é como `testing` (automated/manual) chega.
  const noStructureOwn =
    dados['items'] === undefined && dados['rows'] === undefined && dados['cols'] === undefined;
  if (noStructureOwn) {
    const folhas = Object.entries(dados).filter(
      ([k, v]) => !KEYS_RESERVADAS.includes(k) && ehObjeto(v) && cartaoEhSheet(v),
    );
    if (folhas.length > 0) blocos.push(itemsBlock(Object.fromEntries(folhas)));
  }

  if (dados['keys'] !== undefined) blocos.push(itemsBlock(dados['keys']));
  if (dados['rules'] !== undefined) blocos.push(itemsBlock(dados['rules']));

  const grupos = Object.entries(dados)
    .filter(([k, v]) => !KEYS_RESERVADAS.includes(k) && ehObjeto(v) && !cartaoEhSheet(v))
    .map(([, v]) => mountSubgrupo(v as Registro));

  return {
    chave,
    titulo: texto(dados['title']),
    subtitulo: texto(dados['subtitle']),
    corpo: texto(dados['body']),
    audiencia: texto(dados['audience']),
    blocos,
    grupos,
    nota: texto(dados['note']),
  };
}

/**
 * Chaves de topo que não viram seção visível.
 *
 * `specimens` está aqui porque é desenho próprio da página (tipografia,
 * espaçamento, elevação, motion) e entra por projeção de conteúdo.
 */
const METADADO_KEYS = new Set([
  'title',
  'category',
  'type',
  'description',
  'seo',
  'nav',
  'specimens',
]);

// ─── Componente ──────────────────────────────────────────────────────────────

@Component({
  selector: 'nds-foundation-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NgTemplateOutlet,
    NdsBadge,
    ...NDS_CARD,
    NdsTableWrapper,
    NdsTable,
    NdsTableHeader,
    NdsTableBody,
    NdsTableRow,
    NdsTableHead,
    NdsTableCell,
    NdsLanguageSwitcher,
  ],
  template: `
    <!-- Um único molde de bloco, instanciado tanto pela seção quanto pelos
         subgrupos. Duplicar a marcação nos dois lugares faria a próxima
         correção precisar acontecer duas vezes. -->
    <ng-template #tplBloco let-b>
      @switch (b.tipo) {
        @case ('subtitulo') {
          <h3 class="nds-text-h3 nds-text-foreground" [innerHTML]="DOMPurify.sanitize(b.html)"></h3>
        }
        @case ('codigo') {
          <div class="nds-docs-code">
            <span class="nds-whitespace-pre" [innerHTML]="DOMPurify.sanitize(b.html)"></span>
          </div>
        }
        @case ('tabela') {
          <div ndsTableWrapper>
            <table ndsTable>
              <thead ndsTableHeader>
                <tr ndsTableRow>
                  @for (coluna of b.colunas; track $index) {
                    <th ndsTableHead>{{ coluna }}</th>
                  }
                </tr>
              </thead>
              <tbody ndsTableBody>
                @for (linha of b.linhas; track $index) {
                  <tr ndsTableRow>
                    @for (celula of linha; track $index) {
                      <td ndsTableCell [innerHTML]="DOMPurify.sanitize(celula)"></td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
        @case ('lista') {
          <ul class="nds-stack nds-list-none" data-spacing="md">
            @for (item of b.itens; track $index) {
              <li
                class="nds-text-body nds-leading-relaxed nds-accent-start"
                [innerHTML]="DOMPurify.sanitize(item)"
              ></li>
            }
          </ul>
        }
        @case ('cartoes') {
          <div class="nds-grid" data-cols="2" data-fixed="true" data-spacing="md">
            @for (cartao of b.cartoes; track $index) {
              <div ndsCard>
                <div ndsCardHeader>
                  @if (cartao.titulo) {
                    <h3 ndsCardTitle [innerHTML]="DOMPurify.sanitize(cartao.titulo)"></h3>
                  }
                  @if (cartao.corpo) {
                    <div ndsCardDescription [innerHTML]="DOMPurify.sanitize(cartao.corpo)"></div>
                  }
                </div>
                @if (cartao.extras.length) {
                  <div ndsCardContent class="nds-stack" data-spacing="xs">
                    @for (extra of cartao.extras; track $index) {
                      <p
                        class="nds-text-caption nds-text-muted-foreground nds-m-0"
                        [innerHTML]="DOMPurify.sanitize(extra)"
                      ></p>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
        @default {
          <p class="nds-text-body nds-leading-relaxed" [innerHTML]="DOMPurify.sanitize(b.html)"></p>
        }
      }
    </ng-template>

    <div class="sb-unstyled nds-flex-1 nds-w-full nds-h-full nds-overflow-auto ds-docs">
      <!--
        Landmark de conteúdo. As Foundations não passam pelo DocsPageLayout,
        então o <main> precisa nascer aqui, senão o "Ir para o conteúdo" não
        alcança nada. tabindex="-1" recebe foco programático sem entrar na
        ordem de tabulação; aria-labelledby aponta para o <h1> abaixo, e o
        leitor anuncia "principal, <título da página>".
      -->
      <main
        tabindex="-1"
        [attr.aria-labelledby]="idDoTitulo"
        class="nds-p-8 nds-stack nds-max-w-docs nds-mx-auto"
        data-spacing="xl"
      >
        <header class="nds-stack nds-pb-8">
          <div class="nds-cluster nds-w-full" data-spacing="sm" data-align="center">
            <span
              ndsBadge
              variant="secondary"
              class="nds-bg-primary-soft nds-text-primary nds-border-primary-soft nds-font-medium"
              >{{ categoria() }}</span
            >
            <span ndsBadge variant="outline" class="nds-text-muted-foreground nds-font-normal">{{
              tipo()
            }}</span>
            <div class="nds-spacer-start">
              <nds-language-switcher />
            </div>
          </div>

          <h1 [id]="idDoTitulo" class="nds-text-h1 nds-text-foreground">{{ titulo() }}</h1>

          <p
            class="nds-text-muted-foreground nds-leading-relaxed nds-max-w-prose"
            [innerHTML]="DOMPurify.sanitize(descricao())"
          ></p>
        </header>

        <!-- Specimens visuais da página (tipografia, espaçamento, elevação,
             motion). Uma <ng-content /> só, em posição fixa: duas em ramos de
             @if não entregariam o conteúdo a nenhuma das duas. -->
        <ng-content />

        @for (secao of secoes(); track secao.chave) {
          <section class="nds-stack nds-docs-section-divider" data-spacing="md">
            @if (secao.titulo || secao.subtitulo) {
              <div class="nds-stack" data-spacing="xs">
                @if (secao.titulo) {
                  <h2
                    class="nds-text-h2 nds-text-foreground"
                    [innerHTML]="DOMPurify.sanitize(secao.titulo)"
                  ></h2>
                }
                @if (secao.subtitulo) {
                  <p class="nds-text-body" [innerHTML]="DOMPurify.sanitize(secao.subtitulo)"></p>
                }
              </div>
            }

            @if (secao.corpo) {
              <p
                class="nds-text-body nds-leading-relaxed"
                [innerHTML]="DOMPurify.sanitize(secao.corpo)"
              ></p>
            }

            @if (secao.audiencia) {
              <p
                class="nds-text-body nds-leading-relaxed"
                [innerHTML]="DOMPurify.sanitize(secao.audiencia)"
              ></p>
            }

            @for (b of secao.blocos; track $index) {
              <ng-container
                [ngTemplateOutlet]="tplBloco"
                [ngTemplateOutletContext]="{ $implicit: b }"
              />
            }

            @for (grupo of secao.grupos; track $index) {
              <div class="nds-stack" data-spacing="sm">
                @if (grupo.titulo) {
                  <h3
                    class="nds-text-h3 nds-text-foreground"
                    [innerHTML]="DOMPurify.sanitize(grupo.titulo)"
                  ></h3>
                }
                @if (grupo.corpo) {
                  <p
                    class="nds-text-body nds-leading-relaxed"
                    [innerHTML]="DOMPurify.sanitize(grupo.corpo)"
                  ></p>
                }
                @for (b of grupo.blocos; track $index) {
                  <ng-container
                    [ngTemplateOutlet]="tplBloco"
                    [ngTemplateOutletContext]="{ $implicit: b }"
                  />
                }
              </div>
            }

            @if (secao.nota) {
              <p
                class="nds-text-body nds-leading-relaxed"
                [innerHTML]="DOMPurify.sanitize(secao.nota)"
              ></p>
            }
          </section>
        }
      </main>
    </div>
  `,
})
export class NdsFoundationPage implements OnInit, OnDestroy {
  /** Slug do fundamento — usado em SEO e analytics (ex.: `acessibilidade`). */
  readonly slug = input.required<string>();
  /** `translations.json` do fundamento, trilíngue. */
  readonly translations = input.required<Registro>();

  protected readonly idDoTitulo = DOCS_PAGE_TITLE_ID;
  // O módulo exposto ao template: `DOMPurify.sanitize()` precisa aparecer no
  // próprio binding [innerHTML] para o SAST reconhecer o sanitizador de taint.
  protected readonly DOMPurify = DOMPurify;

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private limparTracking: (() => void) | undefined;

  /**
   * Dicionário do locale corrente, com as variantes de código já resolvidas.
   *
   * Lê `localeSignal()`, então trocar de idioma recalcula a página inteira —
   * é a reatividade por signal desta stack, sem o `subscribe` + rebuild manual
   * do Vanilla.
   */
  private readonly dicionario = computed<Registro>(() => {
    const todos = this.translations();
    const bruto = (todos[localeSignal()] ?? todos['pt-BR'] ?? {}) as Registro;
    return codeResolveVariants(bruto) as Registro;
  });

  protected readonly titulo = computed(() => texto(this.dicionario()['title']));
  protected readonly descricao = computed(() => texto(this.dicionario()['description']));
  protected readonly categoria = computed(() => texto(this.dicionario()['category']));
  protected readonly tipo = computed(() => texto(this.dicionario()['type']));

  protected readonly secoes = computed<FoundationSection[]>(() => {
    const d = this.dicionario();
    return Object.keys(d)
      .filter((k) => !METADADO_KEYS.has(k) && ehObjeto(d[k]))
      .map((k) => mountSection(k, d[k] as Registro));
  });

  constructor() {
    // Effect, e não ngOnInit: precisa reagir à troca de idioma, e o cleanup do
    // applySeo tem de rodar antes da próxima aplicação. Ler `slug()` aqui é
    // seguro — um effect roda depois de os inputs estarem ligados, ao
    // contrário do construtor (armadilha 9).
    effect((onCleanup) => {
      const d = this.dicionario();
      const seo = (ehObjeto(d['seo']) ? d['seo'] : {}) as Registro;
      const idioma = getLocale();

      const clear = applySeo({
        // `seo.title` NÃO leva "· Design System": o applySeo acrescenta.
        title: texto(seo['title']) || texto(d['title']),
        description: texto(seo['description']) || texto(d['description']),
        locale: idioma,
        componentSlug: this.slug(),
        // Fundamento é guia, não componente: sem SoftwareSourceCode no JSON-LD.
        kind: 'guide',
        aiSummary: texto(seo['aiSummary']),
        aiEntities: texto(seo['aiEntities']),
      });

      track('docs_page_view', {
        component_name: this.slug(),
        locale: idioma,
        page_title: `${texto(d['title'])} · Design System`,
      });

      onCleanup(clear);
    });
  }

  ngOnInit(): void {
    // Observer de cliques (data-track*) — mesmo mecanismo do DocsPageLayout.
    // O listener é delegado ao host, então não precisa esperar as seções.
    this.limparTracking = mountDocsTracking(this.hostRef.nativeElement, {
      componentSlug: this.slug(),
    });
  }

  ngOnDestroy(): void {
    this.limparTracking?.();
  }
}
