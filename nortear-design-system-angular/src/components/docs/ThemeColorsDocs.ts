import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewEncapsulation,
} from '@angular/core';

import { NdsBadge } from '@/components/ui/badge';
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
import { getLocale, locale as localeSignal, useTranslation } from '@/lib/i18n';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { mountDocsTracking } from '@/lib/docs-tracking';
import { DOCS_PAGE_TITLE_ID } from './shared/sections/DocsHeader';
import { NDS_SWATCH } from './shared/Swatch';
import themeColorsTranslations from '@shared/content/theme-colors/translations.json';

/**
 * Cores e Temas — fundamento com LAYOUT PRÓPRIO.
 *
 * Não passa pelo `NdsFoundationPage`: o conteúdo de
 * `docs/shared/content/theme-colors/` não tem seções de fundamento, e cada uma
 * das quatro partes (paleta, marcas, modos, eixos) é desenho. As outras quatro
 * stacks montam esta página à mão pelo mesmo motivo.
 *
 * ─── O truque dos cartões ───────────────────────────────────────────────────
 *
 * As variantes escuras são `.dark.tema-X` — as DUAS classes no MESMO elemento.
 * A toolbar do Storybook coloca tema e modo no `<html>`, então cada cartão
 * recria a combinação que quer mostrar no próprio escopo: os de marca mostram o
 * SEU tema no modo atual da página; os de modo mostram o tema ATIVO num modo
 * fixo. Um MutationObserver na classe do `<html>` mantém isso em dia — e
 * aproveita para reler os valores HSL dos swatches, que só existem resolvidos.
 *
 * ─── Pendência de conteúdo ──────────────────────────────────────────────────
 *
 * `--chart-1` a `--chart-5` não têm variante escura em lugar nenhum (nem no
 * `:root`, nem nas três marcas). No tema escuro o grupo "Gráficos" desta página
 * mostra os mesmos valores do tema claro, e `--chart-5` (210 71% 23%) fica
 * quase invisível sobre fundo escuro. Não é defeito desta página: é decisão de
 * design pendente, registrada no CLAUDE.md desta stack.
 */
const { t } = useTranslation(themeColorsTranslations as Record<string, unknown>);

// Todos os itens carregam a chave de tradução INTEIRA, e não o sufixo. Montar
// a chave dentro do template, concatenando um prefixo literal com o campo do
// item, funciona em runtime — mas o auditor lê o FONTE: ele enxerga o prefixo
// solto, chave que não existe, e cobra `unresolved_i18n_key`.

/** Grupos da paleta semântica e seus tokens (sem o prefixo `--`). */
interface GrupoDaPaleta {
  chave: string;
  rotulo: string;
  tokens: string[];
}

const GRUPOS_DA_PALETA: GrupoDaPaleta[] = [
  {
    chave: 'surface',
    rotulo: 'palette.groups.surface',
    tokens: [
      'background', 'foreground', 'card', 'card-foreground', 'popover',
      'popover-foreground', 'muted', 'muted-foreground', 'accent', 'accent-foreground',
    ],
  },
  {
    chave: 'brand',
    rotulo: 'palette.groups.brand',
    tokens: ['primary', 'primary-foreground', 'secondary', 'secondary-foreground'],
  },
  {
    chave: 'feedback',
    rotulo: 'palette.groups.feedback',
    tokens: [
      'destructive', 'destructive-foreground', 'success', 'success-foreground',
      'warning', 'warning-foreground', 'info', 'info-foreground',
    ],
  },
  {
    chave: 'structure',
    rotulo: 'palette.groups.structure',
    tokens: ['border', 'input', 'input-background', 'ring'],
  },
  {
    chave: 'sidebar',
    rotulo: 'palette.groups.sidebar',
    tokens: [
      'sidebar', 'sidebar-foreground', 'sidebar-primary', 'sidebar-primary-foreground',
      'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring',
    ],
  },
  {
    chave: 'chart',
    rotulo: 'palette.groups.chart',
    tokens: ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'],
  },
];

/** Tokens exibidos como mini-swatches nos cartões de tema/modo. */
const TOKENS_DA_AMOSTRA = [
  'primary', 'secondary', 'accent', 'muted', 'destructive', 'success',
];

const TODOS_OS_TOKENS = GRUPOS_DA_PALETA.flatMap((g) => g.tokens);

interface ItemDeEixo {
  chave: string;
  rotulo: string;
  classe: string;
}

const TEMAS_DE_MARCA: ItemDeEixo[] = [
  { chave: 'default', rotulo: 'brand.themes.default', classe: 'tema-default' },
  { chave: 'warm', rotulo: 'brand.themes.warm', classe: 'tema-warm' },
  { chave: 'cold', rotulo: 'brand.themes.cold', classe: 'tema-cold' },
];

const MODOS: Array<{ chave: string; rotulo: string; escuro: boolean }> = [
  { chave: 'light', rotulo: 'modes.light', escuro: false },
  { chave: 'dark', rotulo: 'modes.dark', escuro: true },
];

const DENSIDADES: ItemDeEixo[] = [
  {
    chave: 'condensado',
    rotulo: 'axes.density.items.condensado',
    classe: 'densidade-condensado',
  },
  { chave: 'default', rotulo: 'axes.density.items.default', classe: 'densidade-default' },
  {
    chave: 'confortavel',
    rotulo: 'axes.density.items.confortavel',
    classe: 'densidade-confortavel',
  },
];

const FONTES: ItemDeEixo[] = [
  { chave: 'default', rotulo: 'axes.fonts.items.default', classe: 'fonte-default' },
  { chave: 'lexend', rotulo: 'axes.fonts.items.lexend', classe: 'fonte-lexend' },
  { chave: 'pt-serif', rotulo: 'axes.fonts.items.pt-serif', classe: 'fonte-pt-serif' },
  {
    chave: 'lxgw-wenkai',
    rotulo: 'axes.fonts.items.lxgw-wenkai',
    classe: 'fonte-lxgw-wenkai',
  },
];

/** Recorte tipado do conteúdo compartilhado — `t()` devolveria a chave. */
interface TabelaDeDensidade {
  tableCols: string[];
  tableRows: string[][];
}

@Component({
  selector: 'nds-theme-colors-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsBadge,
    NdsLanguageSwitcher,
    NdsTableWrapper,
    NdsTable,
    NdsTableHeader,
    NdsTableBody,
    NdsTableRow,
    NdsTableHead,
    NdsTableCell,
    ...NDS_SWATCH,
  ],
  template: `
    <div class="sb-unstyled nds-flex-1 nds-w-full nds-h-full nds-overflow-auto ds-docs">
      <!--
        Landmark de conteúdo. Esta página não passa pelo DocsPageLayout nem pelo
        FoundationPage, então o <main> nasce aqui — sem ele o "Ir para o
        conteúdo" não alcança nada.
      -->
      <main
        tabindex="-1"
        [attr.aria-labelledby]="idDoTitulo"
        class="nds-p-8 nds-stack nds-max-w-docs nds-mx-auto"
        data-spacing="xl"
      >
        <!-- ── Cabeçalho ────────────────────────────────────────────────── -->
        <header class="nds-stack nds-pb-8">
          <div class="nds-cluster nds-w-full" data-spacing="sm" data-align="center">
            <span
              ndsBadge
              variant="secondary"
              class="nds-bg-primary-soft nds-text-primary nds-border-primary-soft nds-font-medium"
              >{{ t('category') }}</span
            >
            <span ndsBadge variant="outline" class="nds-text-muted-foreground nds-font-normal">{{
              t('type')
            }}</span>
            <div class="nds-spacer-start">
              <nds-language-switcher />
            </div>
          </div>

          <h1
            [id]="idDoTitulo"
            class="nds-text-h1 nds-font-bold nds-tracking-tight nds-text-foreground"
          >
            {{ t('title') }}
          </h1>

          <p class="nds-text-muted-foreground nds-leading-relaxed nds-max-w-prose">
            {{ t('description') }}
          </p>
        </header>

        <!-- ── Paleta semântica ─────────────────────────────────────────── -->
        <section class="nds-stack nds-docs-section-divider" data-spacing="lg">
          <div class="nds-stack" data-spacing="xs">
            <h2 class="nds-text-h2 nds-text-foreground">{{ t('palette.title') }}</h2>
            <p class="nds-text-body">{{ t('palette.subtitle') }}</p>
          </div>

          @for (grupo of gruposDaPaleta; track grupo.chave) {
            <div class="nds-swatch-group">
              <h3 class="nds-swatch-group-title">{{ t(grupo.rotulo) }}</h3>
              <ul class="nds-swatch-grid">
                @for (token of grupo.tokens; track token) {
                  <li class="nds-swatch-grid-item">
                    <button
                      ndsSwatch
                      [token]="token"
                      [valor]="valoresDosTokens()[token] ?? ''"
                      [rotuloDeCopia]="t('copy.tooltip')"
                      [rotuloCopiado]="t('copy.copied')"
                    ></button>
                  </li>
                }
              </ul>
            </div>
          }
        </section>

        <!-- ── Temas de marca ───────────────────────────────────────────── -->
        <section class="nds-stack nds-docs-section-divider" data-spacing="md">
          <div class="nds-stack" data-spacing="xs">
            <h2 class="nds-text-h2 nds-text-foreground">{{ t('brand.title') }}</h2>
            <p class="nds-text-body">{{ t('brand.subtitle') }}</p>
          </div>
          <div class="nds-theme-card-grid">
            @for (tema of temasDeMarca; track tema.chave) {
              <div class="nds-theme-card">
                <!-- Cada cartão mostra o SEU tema no modo atual da página. -->
                <div [class]="escopoDaMarca()[tema.chave]">
                  <span class="nds-theme-card-label">{{ t(tema.rotulo) }}</span>
                  <div class="nds-miniswatch-row">
                    @for (token of tokensDaAmostra; track token) {
                      <div ndsMiniSwatch [token]="token"></div>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </section>

        <!-- ── Light e Dark ─────────────────────────────────────────────── -->
        <section class="nds-stack nds-docs-section-divider" data-spacing="md">
          <div class="nds-stack" data-spacing="xs">
            <h2 class="nds-text-h2 nds-text-foreground">{{ t('modes.title') }}</h2>
            <p class="nds-text-body">{{ t('modes.subtitle') }}</p>
          </div>
          <div class="nds-theme-card-grid">
            @for (modo of modos; track modo.chave) {
              <div class="nds-theme-card">
                <!-- Cada cartão mostra o tema ATIVO num modo fixo. -->
                <div [class]="escopoDoModo()[modo.chave]">
                  <span class="nds-theme-card-label">{{ t(modo.rotulo) }}</span>
                  <div class="nds-miniswatch-row">
                    @for (token of tokensDaAmostra; track token) {
                      <div ndsMiniSwatch [token]="token"></div>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </section>

        <!-- ── Densidade e Fontes ───────────────────────────────────────── -->
        <section class="nds-stack nds-docs-section-divider" data-spacing="lg">
          <div class="nds-stack" data-spacing="xs">
            <h2 class="nds-text-h2 nds-text-foreground">{{ t('axes.title') }}</h2>
            <p class="nds-text-body">{{ t('axes.subtitle') }}</p>
          </div>

          <!-- Densidade: a MESMA tabela em três escopos. Os paddings e alturas
               tokenizados escalam com --spacing-base, o que demonstra o eixo
               sem a ambiguidade de "tamanho de botão". -->
          <div class="nds-stack" data-spacing="md">
            <div class="nds-stack" data-spacing="xs">
              <h3 class="nds-text-body nds-font-medium">{{ t('axes.density.title') }}</h3>
              <p class="nds-text-body">{{ t('axes.density.subtitle') }}</p>
            </div>
            <div class="nds-axis-grid">
              @for (densidade of densidades; track densidade.chave) {
                <div class="nds-axis-sample">
                  <span class="nds-axis-sample-label">{{
                    t(densidade.rotulo)
                  }}</span>
                  <div [class]="escopoDeDensidade()[densidade.chave]">
                    <div ndsTableWrapper>
                      <table ndsTable class="nds-axis-density-table">
                        <thead ndsTableHeader>
                          <tr ndsTableRow>
                            @for (coluna of tabelaDeDensidade().tableCols; track $index) {
                              <th ndsTableHead>{{ coluna }}</th>
                            }
                          </tr>
                        </thead>
                        <tbody ndsTableBody>
                          @for (linha of tabelaDeDensidade().tableRows; track $index) {
                            <tr ndsTableRow>
                              @for (celula of linha; track $index) {
                                <td ndsTableCell>{{ celula }}</td>
                              }
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Fontes -->
          <div class="nds-stack" data-spacing="md">
            <div class="nds-stack" data-spacing="xs">
              <h3 class="nds-text-body nds-font-medium">{{ t('axes.fonts.title') }}</h3>
              <p class="nds-text-body">{{ t('axes.fonts.subtitle') }}</p>
            </div>
            <div class="nds-axis-grid" data-cols="4">
              @for (fonte of fontes; track fonte.chave) {
                <div class="nds-axis-sample">
                  <span class="nds-axis-sample-label">{{
                    t(fonte.rotulo)
                  }}</span>
                  <div [class]="fonte.classe">
                    <span class="nds-font-sample">Aa Bb Cc 123</span>
                  </div>
                </div>
              }
            </div>
          </div>
        </section>
      </main>
    </div>
  `,
})
export class NdsThemeColorsDocs implements OnInit, OnDestroy {
  protected readonly t = t;
  protected readonly idDoTitulo = DOCS_PAGE_TITLE_ID;

  protected readonly gruposDaPaleta = GRUPOS_DA_PALETA;
  protected readonly tokensDaAmostra = TOKENS_DA_AMOSTRA;
  protected readonly temasDeMarca = TEMAS_DE_MARCA;
  protected readonly modos = MODOS;
  protected readonly densidades = DENSIDADES;
  protected readonly fontes = FONTES;

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private limparTracking: (() => void) | undefined;
  private observadorDeTema: MutationObserver | undefined;

  // ─── Estado de tema/modo lido do <html> ───────────────────────────────────

  protected readonly marcaAtiva = signal('tema-default');
  protected readonly paginaEscura = signal(false);
  /** Valores HSL resolvidos, relidos a cada troca de classe do `<html>`. */
  protected readonly valoresDosTokens = signal<Record<string, string>>({});

  /**
   * Classe de cada cartão de MARCA: o tema do cartão + o modo atual da página.
   *
   * Mapa pronto em vez de função chamada no template — expressão de template
   * não tem globais nem argumentos livres, e um `computed` por cartão
   * multiplicaria o mesmo cálculo (armadilha 4 do CLAUDE.md).
   */
  protected readonly escopoDaMarca = computed<Record<string, string>>(() => {
    const sufixo = this.paginaEscura() ? ' dark' : '';
    return Object.fromEntries(
      TEMAS_DE_MARCA.map((tema) => [
        tema.chave,
        `nds-theme-card-scope ${tema.classe}${sufixo}`,
      ]),
    );
  });

  /** Classe de cada cartão de MODO: o tema ativo + o modo fixo do cartão. */
  protected readonly escopoDoModo = computed<Record<string, string>>(() => {
    const marca = this.marcaAtiva();
    return Object.fromEntries(
      MODOS.map((modo) => [
        modo.chave,
        `nds-theme-card-scope ${marca}${modo.escuro ? ' dark' : ''}`,
      ]),
    );
  });

  /** Classe de cada amostra de densidade — estática, mas no mesmo formato. */
  protected readonly escopoDeDensidade = computed<Record<string, string>>(() =>
    Object.fromEntries(
      DENSIDADES.map((item) => [item.chave, `nds-axis-scope ${item.classe}`]),
    ),
  );

  /**
   * Tabela da demonstração de densidade.
   *
   * Lida do JSON cru, e não por `t()`: `tableCols` e `tableRows` são arrays, e
   * o `t()` devolve a PRÓPRIA CHAVE quando ela não aponta para uma string.
   */
  protected readonly tabelaDeDensidade = computed<TabelaDeDensidade>(() => {
    const todos = themeColorsTranslations as Record<string, unknown>;
    const dicionario = (todos[localeSignal()] ?? todos['pt-BR']) as {
      axes: { density: TabelaDeDensidade };
    };
    return dicionario.axes.density;
  });

  // ─── SEO + analytics ──────────────────────────────────────────────────────

  constructor() {
    effect((onCleanup) => {
      const idioma = getLocale();
      const limpar = applySeo({
        // `seo.title` NÃO leva "· Design System": o applySeo acrescenta.
        title: `${t('title')} — ${t('category')}`,
        description: t('description'),
        aiSummary: t('seo.aiSummary'),
        aiEntities: t('seo.aiEntities'),
        locale: idioma,
        componentSlug: 'theme-colors',
        // Fundamento é guia, não componente: sem SoftwareSourceCode no JSON-LD.
        kind: 'guide',
      });

      track('docs_page_view', {
        component_name: 'theme-colors',
        locale: idioma,
        page_title: `${t('title')} · Design System`,
      });

      onCleanup(limpar);
    });
  }

  ngOnInit(): void {
    // Observer de cliques (data-track*) — mesmo mecanismo do DocsPageLayout.
    this.limparTracking = mountDocsTracking(this.hostRef.nativeElement, {
      componentSlug: 'theme-colors',
    });

    this.lerTema();
    this.observadorDeTema = new MutationObserver(() => this.lerTema());
    this.observadorDeTema.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  ngOnDestroy(): void {
    this.observadorDeTema?.disconnect();
    this.limparTracking?.();
  }

  /** Lê marca, modo e valores HSL resolvidos no `<html>`. */
  private lerTema(): void {
    const classes = document.documentElement.classList;
    const marca = TEMAS_DE_MARCA.find((tema) => classes.contains(tema.classe));
    this.marcaAtiva.set(marca ? marca.classe : 'tema-default');
    this.paginaEscura.set(classes.contains('dark'));

    const estilo = getComputedStyle(document.documentElement);
    const valores: Record<string, string> = {};
    for (const token of TODOS_OS_TOKENS) {
      valores[token] = estilo.getPropertyValue(`--${token}`).trim();
    }
    this.valoresDosTokens.set(valores);
  }
}
