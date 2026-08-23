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
import DOMPurify from 'dompurify';
// Pacote `lucide` (agnóstico), NUNCA `lucide-angular`: este declara peer
// `@angular/core: 13.x - 21.x` e conflita com o Angular 22 deste pacote.
// Import nomeado, não `import * as`: o `wildcard_lucide_import` do auditor
// existe justamente para o bundle não perder o tree-shaking. Aqui sobram só os
// dois ícones do enfeite da página — o CATÁLOGO da galeria vem do JSON
// compartilhado, que entrega a mesma geometria em 521 KB contra 972 KB
// (medição no docblock de `lucide-catalog`).
import { Package, Search, type IconNode } from 'lucide';

import { NdsBadge } from '@/components/ui/badge';
import { NdsLanguageSwitcher } from '@/components/product/LanguageSwitcher';
import { getLocale, useTranslation } from '@/lib/i18n';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { mountDocsTracking } from '@/lib/docs-tracking';
import { DOCS_PAGE_TITLE_ID } from './shared/sections/DocsHeader';
import { NdsLucideGlyph } from './shared/LucideGlyph';
import iconsTranslations from '@shared/content/icons/translations.json';
import { CATALOGO_LUCIDE, ICON_NAMES } from '@shared/primitives/lucide-catalog';

/**
 * Icons — fundamento com LAYOUT PRÓPRIO.
 *
 * Não passa pelo `NdsFoundationPage`: o conteúdo de `docs/shared/content/icons/`
 * não tem seções de fundamento (nem `nav`, nem `seo`), é uma galeria com busca.
 * As outras quatro stacks também montam esta página à mão, pelo mesmo motivo —
 * daí o `<main>`, o `applySeo` e o `mountDocsTracking` aparecerem aqui, e não
 * herdados do renderer.
 *
 * ─── A grade inteira nasce uma vez ──────────────────────────────────────────
 *
 * São ~2000 ícones. Filtrar recriando a lista faria cada tecla digitada
 * destruir e reconstruir dois mil nós (e refazer dois mil SVGs). Aqui o `@for`
 * roda uma vez e a busca só liga `is-hidden` — é o que o Vanilla faz, e o
 * Vanilla é a referência de markup.
 */
const { t } = useTranslation(iconsTranslations as Record<string, unknown>);

/** Nome + geometria de cada ícone, na ordem em que o pacote os expõe. */
interface CatalogoIcon {
  name: string;
  no: IconNode;
}

const CATALOGO: CatalogoIcon[] = ICON_NAMES.map((name) => ({
  name,
  // O JSON guarda `[tag, atributos][]`, a mesma forma do IconNode; o cast só
  // reaperta a tag de `string` para o union de tags SVG que o tipo declara.
  no: CATALOGO_LUCIDE[name] as unknown as IconNode,
}));

/** Normaliza para a busca casar "arrowright", "arrow-right" e "Arrow Right". */
function normalizar(text: string): string {
  return text.trim().toLowerCase().replace(/[\s\-_]+/g, '');
}

// Os snippets são curtos de propósito: `.nds-docs-code` rola na horizontal, e
// região rolável sem foco é violação de axe (scrollable-region-focusable). A
// linha mais longa daqui cabe na coluna mais estreita em que a caixa aparece.
const EXEMPLO_IMPORTACAO = `import { Search, Settings, User } from 'lucide';

<svg [ndsLucideGlyph]="Search" class="nds-icon"></svg>`;

const EXEMPLO_SIZES = `nds-icon-sm   // 14px — badges, captions
nds-icon      // 16px — padrão em texto e botões
nds-icon-lg   // 20px — destaque em headers`;

const EXEMPLO_DECORATIVO = `<button ndsButton>
  <svg [ndsLucideGlyph]="Save" class="nds-icon"></svg>
  Salvar
</button>`;

const EXEMPLO_FUNCIONAL = `<button
  ndsButton
  size="icon"
  aria-label="Excluir produto"
>
  <svg [ndsLucideGlyph]="Trash2" class="nds-icon"></svg>
</button>`;

// Chave INTEIRA, e não o sufixo. Concatenar um prefixo literal com o sufixo
// dentro do template funciona em runtime — mas o auditor lê o FONTE: ele enxerga
// o prefixo solto, chave que não existe, e cobra `unresolved_i18n_key`. (Vale
// até para comentário: a regra varre o arquivo inteiro, não só o template.)
const REGRAS_DE_ACESSIBILIDADE = [
  'accessibility.rule1',
  'accessibility.rule2',
  'accessibility.rule3',
  'accessibility.rule4',
];

@Component({
  selector: 'nds-icons-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NdsBadge, NdsLanguageSwitcher, NdsLucideGlyph],
  template: `
    <div class="sb-unstyled nds-flex-1 nds-w-full nds-h-full nds-overflow-auto ds-docs">
      <!--
        Landmark de conteúdo. Esta página não passa pelo DocsPageLayout nem pelo
        FoundationPage, então o <main> nasce aqui — sem ele o "Ir para o
        conteúdo" não alcança nada. tabindex="-1" recebe foco programático sem
        entrar na ordem de tabulação.
      -->
      <main
        tabindex="-1"
        [attr.aria-labelledby]="idDoTitulo"
        class="nds-p-8 nds-stack nds-max-w-docs nds-mx-auto"
        data-spacing="xl"
      >
        <!-- ── Cabeçalho ────────────────────────────────────────────────── -->
        <header class="nds-stack nds-border-b-soft nds-pb-8">
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

          <div class="nds-cluster" data-spacing="sm" data-align="center">
            <span
              class="nds-badge nds-bg-muted nds-text-muted-foreground nds-font-mono nds-border-default"
            >
              <svg [ndsLucideGlyph]="glifoDoPacote" class="nds-icon"></svg>
              lucide
            </span>
            <!-- Sem opacity extra: --muted-foreground já é o tom secundário, e
                 o 0.7 que as stacks tinham derrubava o contraste para 3.03:1. -->
            <span class="nds-text-body nds-text-muted-foreground">{{ textoDeDisponiveis() }}</span>
          </div>
        </header>

        <!-- ── Como usar ─────────────────────────────────────────────────── -->
        <section class="nds-stack nds-docs-section-divider" data-spacing="lg">
          <h2 class="nds-text-h2 nds-text-foreground">{{ t('howToUse.title') }}</h2>
          <div class="nds-grid" data-spacing="md" data-cols="2">
            <div class="nds-stack" data-spacing="sm">
              <p class="nds-text-body nds-font-medium">{{ t('howToUse.individual.title') }}</p>
              <pre class="nds-docs-code"><code>{{ exemploDeImportacao }}</code></pre>
            </div>
            <div class="nds-stack" data-spacing="sm">
              <p class="nds-text-body nds-font-medium">{{ t('howToUse.sizes.title') }}</p>
              <pre class="nds-docs-code"><code>{{ exemploDeTamanhos }}</code></pre>
            </div>
          </div>
        </section>

        <!-- ── Acessibilidade ────────────────────────────────────────────── -->
        <section class="nds-stack nds-docs-section-divider" data-spacing="md">
          <h2 class="nds-text-h2 nds-text-foreground">{{ t('accessibility.title') }}</h2>
          <div class="nds-grid" data-spacing="sm" data-cols="2">
            <div class="nds-stack" data-spacing="sm">
              <p class="nds-text-body nds-font-medium">{{ t('accessibility.decorative.title') }}</p>
              <pre class="nds-docs-code"><code>{{ exemploDecorativo }}</code></pre>
            </div>
            <div class="nds-stack" data-spacing="sm">
              <p class="nds-text-body nds-font-medium">{{ t('accessibility.functional.title') }}</p>
              <pre class="nds-docs-code"><code>{{ exemploFuncional }}</code></pre>
            </div>
          </div>
          <ul
            class="nds-stack nds-text-body nds-text-muted-foreground nds-list-none nds-p-0 nds-m-0"
            data-spacing="xs"
          >
            @for (rule of rules; track rule) {
              <li class="nds-cluster nds-list-none" data-spacing="sm" data-align="start">
                <span class="nds-text-primary nds-shrink-0 nds-mt-0-5" aria-hidden="true">✓</span>
                <!-- O texto da regra traz <code> no conteúdo compartilhado;
                     sanitizado no próprio binding (guideline 09). -->
                <span [innerHTML]="DOMPurify.sanitize(t(rule))"></span>
              </li>
            }
          </ul>
        </section>

        <!-- ── Busca ─────────────────────────────────────────────────────── -->
        <section class="nds-stack nds-docs-section-divider" data-spacing="sm">
          <div class="nds-stack" data-spacing="xs">
            <h2 class="nds-text-h2 nds-text-foreground">{{ t('search.title') }}</h2>
            <p class="nds-text-body">{{ t('search.subtitle') }}</p>
          </div>
          <div class="nds-icon-search-wrap">
            <svg [ndsLucideGlyph]="glifoDaBusca" class="nds-icon-search-svg"></svg>
            <input
              type="search"
              class="nds-input nds-icon-search-input"
              [value]="search()"
              [placeholder]="t('search.placeholder')"
              [attr.aria-label]="t('search.placeholder')"
              (input)="aoBuscar($event)"
            />
          </div>
          <p class="nds-text-body" aria-live="polite" aria-atomic="true">
            {{ contagemText() }}
          </p>
        </section>

        <!-- ── Galeria ───────────────────────────────────────────────────── -->
        <!-- Sempre no DOM, visibilidade por classe — é o que o Vanilla faz. Com
             o bloco condicional o estado vazio entrava e saía da árvore, e o
             role="status" chegava junto com o texto: leitor de tela só anuncia
             live region que já estava lá quando o conteúdo mudou.
             (Sem crase neste comentário: o template é template literal.) -->
        <div class="nds-icon-empty-state" [class.is-visible]="noResults()" role="status">
          <svg
            [ndsLucideGlyph]="glifoDaBusca"
            class="nds-icon-empty-state-svg"
          ></svg>
          <p class="nds-font-medium">{{ t('search.noResults') }}</p>
          <p class="nds-text-body nds-text-muted-foreground">{{ t('search.noResultsSub') }}</p>
        </div>

        <ul
          class="nds-icon-grid"
          [class.is-hidden]="noResults()"
          [attr.aria-label]="textoDeDisponiveis()"
        >
          @for (icone of catalogo; track icone.name) {
            <li
              class="nds-icon-grid-item"
              [class.is-hidden]="!visiveis().has(icone.name)"
              [attr.data-icon-name]="icone.name"
            >
              <button
                type="button"
                class="nds-icon-tile"
                [attr.aria-label]="t('copy.tooltip') + ' ' + icone.name"
                (click)="copiar(icone.name)"
              >
                <span class="nds-icon-tile-svg">
                  <svg [ndsLucideGlyph]="icone.no" class="nds-icon-lg"></svg>
                </span>
                <span class="nds-icon-tile-name">{{ icone.name }}</span>
                <span
                  class="nds-icon-tile-tooltip"
                  [class.is-visible]="copiado() === icone.name"
                  aria-hidden="true"
                  >{{ copiado() === icone.name ? t('copy.copied') : t('copy.tooltip') }}</span
                >
              </button>
            </li>
          }
        </ul>
      </main>
    </div>
  `,
})
export class NdsIconsDocs implements OnInit, OnDestroy {
  protected readonly t = t;
  protected readonly idDoTitulo = DOCS_PAGE_TITLE_ID;
  // Módulo exposto ao template: a chamada precisa aparecer no próprio binding
  // [innerHTML] para o SAST reconhecer o sanitizador de taint (guideline 09).
  protected readonly DOMPurify = DOMPurify;

  protected readonly catalogo = CATALOGO;
  protected readonly rules = REGRAS_DE_ACESSIBILIDADE;
  protected readonly glifoDaBusca = Search;
  protected readonly glifoDoPacote = Package;
  protected readonly exemploDeImportacao = EXEMPLO_IMPORTACAO;
  protected readonly exemploDeTamanhos = EXEMPLO_SIZES;
  protected readonly exemploDecorativo = EXEMPLO_DECORATIVO;
  protected readonly exemploFuncional = EXEMPLO_FUNCIONAL;

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private limparTracking: (() => void) | undefined;
  private relogioDeCopia: ReturnType<typeof setTimeout> | undefined;

  // ─── Busca ────────────────────────────────────────────────────────────────

  protected readonly search = signal('');
  protected readonly copiado = signal<string | null>(null);

  /** Nomes que passam no filtro. Set, e não array: o template consulta 2000×. */
  protected readonly visiveis = computed(() => {
    const query = normalizar(this.search());
    if (!query) return new Set(CATALOGO.map((i) => i.name));
    return new Set(
      CATALOGO.filter((i) => normalizar(i.name).includes(query)).map((i) => i.name),
    );
  });

  protected readonly noResults = computed(() => this.visiveis().size === 0);

  protected readonly textoDeDisponiveis = computed(() =>
    t('iconsAvailable').replace('{count}', String(CATALOGO.length)),
  );

  protected readonly contagemText = computed(() => {
    const total = this.visiveis().size;
    const query = this.search().trim();
    if (!query) return t('search.count').replace('{count}', String(total));
    return t('search.results')
      .replace('{count}', String(total))
      .replace('{plural}', total !== 1 ? 's' : '')
      .replace('{query}', query);
  });

  protected aoBuscar(evento: Event): void {
    this.search.set((evento.target as HTMLInputElement).value);
  }

  protected copiar(name: string): void {
    navigator.clipboard
      .writeText(name)
      .then(() => {
        this.copiado.set(name);
        clearTimeout(this.relogioDeCopia);
        this.relogioDeCopia = setTimeout(() => this.copiado.set(null), 1500);
      })
      .catch(() => {
        // Área de transferência negada (permissão ou contexto inseguro): a
        // página segue navegável, só não confirma a cópia.
      });
  }

  // ─── SEO + analytics ──────────────────────────────────────────────────────

  constructor() {
    // Effect, e não ngOnInit: precisa reagir à troca de idioma, e o cleanup do
    // applySeo tem de rodar antes da próxima aplicação.
    effect((onCleanup) => {
      const idioma = getLocale();
      const clear = applySeo({
        // `seo.title` NÃO leva "· Design System": o applySeo acrescenta.
        title: `${t('title')} — ${t('category')}`,
        description: t('description'),
        aiSummary: t('seo.aiSummary'),
        aiEntities: t('seo.aiEntities'),
        locale: idioma,
        componentSlug: 'icons',
        // Galeria é guia, não componente: sem SoftwareSourceCode no JSON-LD.
        kind: 'guide',
      });

      track('docs_page_view', {
        component_name: 'icons',
        locale: idioma,
        page_title: `${t('title')} · Design System`,
      });

      onCleanup(clear);
    });
  }

  ngOnInit(): void {
    // Observer de cliques (data-track*) — mesmo mecanismo do DocsPageLayout.
    this.limparTracking = mountDocsTracking(this.hostRef.nativeElement, {
      componentSlug: 'icons',
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.relogioDeCopia);
    this.limparTracking?.();
  }
}
