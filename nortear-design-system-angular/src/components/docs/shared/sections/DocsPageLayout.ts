import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  ViewEncapsulation,
} from '@angular/core';
import { NdsDocsNav, type DocsNavGroup } from '../DocsNav';
import { DOCS_PAGE_TITLE_ID } from './DocsHeader';
import { mountDocsTracking } from '@/lib/docs-tracking';

/**
 * Casca da docs page: header (projetado), sidebar de navegação e `<main>`.
 *
 * Dois slots de projeção (`[docsHeader]` e `[docsMain]`) em vez do par
 * `headerSlot`/`main` que o Vanilla devolve num handle — no Angular o conteúdo
 * é declarado no template da docs page, não appendado depois.
 */
@Component({
  selector: 'nds-docs-page-layout',
  standalone: true,
  imports: [NdsDocsNav],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    // .sb-unstyled é a escape hatch oficial do Storybook que desliga o
    // prose-style emotion na subárvore (ver storybook-docs.css).
    // .nds-page = wrapper top-level: max-width + padding lateral + ritmo vertical.
    class: 'sb-unstyled ds-docs nds-page',
    '[attr.data-width]': '"wide"',
  },
  template: `
    <div>
      <ng-content select="[docsHeader]" />
    </div>

    <div class="nds-sidebar-layout" data-sidebar-sticky="true">
      <nav aria-label="Navegação das seções do componente" class="nds-stack" data-spacing="md">
        <nds-docs-nav
          [groups]="navGroups()"
          [activeSection]="activeSection()"
          [componentSlug]="componentSlug()"
        />
      </nav>

      <!--
        Landmark <main>:
        - tabindex="-1": recebe foco programático (skip link "Ir para o conteúdo")
          sem entrar na ordem de tabulação;
        - aria-labelledby → <h1> do DocsHeader: o leitor anuncia "principal,
          <título da página>" ao cair aqui, sem precisar mover o header no DOM.
      -->
      <main
        class="ds-docs nds-stack"
        data-spacing="2xl"
        tabindex="-1"
        [attr.aria-labelledby]="titleId"
      >
        <ng-content select="[docsMain]" />
      </main>
    </div>
  `,
})
export class NdsDocsPageLayout implements AfterViewInit, OnDestroy {
  readonly navGroups = input.required<DocsNavGroup[]>();
  readonly activeSection = input<string | undefined>(undefined);
  /** Slug do componente — habilita tracking automático via data-track*. */
  readonly componentSlug = input<string | undefined>(undefined);

  protected readonly titleId = DOCS_PAGE_TITLE_ID;

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private trackingCleanup: (() => void) | undefined;

  ngAfterViewInit(): void {
    // Depois da primeira renderização: o observer de clique precisa das seções
    // já no DOM para resolver `.closest('[data-track]')`.
    // Slug omitido → derivado do ?id= do iframe (mountDocsTracking).
    this.trackingCleanup = mountDocsTracking(this.hostRef.nativeElement, {
      componentSlug: this.componentSlug(),
    });
  }

  ngOnDestroy(): void {
    this.trackingCleanup?.();
  }
}
