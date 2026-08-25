import {
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { NdsBadge } from '@/components/ui/badge';
import { NdsLanguageSwitcher } from '@/components/product/LanguageSwitcher';
import DOMPurify from 'dompurify';

/**
 * Id determinístico do `<h1>` da docs page. O `<main>` do DocsPageLayout aponta
 * para ele via `aria-labelledby`, para que o leitor de tela anuncie
 * "principal, <título da página>" ao chegar no conteúdo. A docs page é única
 * por iframe — não há colisão de id.
 */
export const DOCS_PAGE_TITLE_ID = 'docs-page-title';

@Component({
  selector: 'nds-docs-header',
  standalone: true,
  imports: [NdsBadge, NdsLanguageSwitcher],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <header
      class="ds-docs nds-stack nds-border-b-soft"
      data-spacing="md"
    >
      <div class="nds-cluster" data-spacing="sm">
        <span
          ndsBadge
          variant="default"
          class="nds-bg-primary-soft nds-text-primary nds-border-primary-soft nds-font-medium"
        >{{ category() }}</span>
        <span
          ndsBadge
          variant="info"
          class="nds-text-muted-foreground nds-font-normal"
        >{{ type() }}</span>
        <nds-language-switcher class="nds-spacer-start" />
      </div>

      <div class="nds-stack" data-spacing="sm">
        <h1 [id]="titleId" class="nds-text-h1 nds-text-foreground">{{ title() }}</h1>
        <p class="nds-text-lead nds-text-muted-foreground nds-max-w-prose">{{ description() }}</p>
      </div>

      @if (installNote()) {
        <div class="nds-cluster nds-text-body nds-text-muted-foreground" data-spacing="sm">
          <span class="nds-cluster" data-spacing="xs">
            <code class="nds-code-inline" [innerHTML]="DOMPurify.sanitize(installNote())"></code>
          </span>
        </div>
      }
    </header>
  `,
})
export class NdsDocsHeader {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly category = input.required<string>();
  readonly type = input.required<string>();
  readonly installNote = input<string>('');

  protected readonly titleId = DOCS_PAGE_TITLE_ID;
  // DOMPurify no escopo do template: a chamada precisa aparecer no próprio
  // binding [innerHTML] para o SAST reconhecer o sanitizador de taint
  // (guideline 09). Um computed `safe*` esconderia a chamada do fluxo.
  protected readonly DOMPurify = DOMPurify;
}
