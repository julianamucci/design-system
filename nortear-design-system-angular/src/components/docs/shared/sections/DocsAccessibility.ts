import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { NdsCard } from '@/components/ui/card';
import { sanitizeHtml } from '@/lib/utils';

export interface DocsKeyboardItem { key: string; description: string }

@Component({
  selector: 'nds-docs-accessibility',
  standalone: true,
  imports: [NdsCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section id="acessibilidade">
      <h2 class="nds-section-title">{{ title() }}</h2>

      <nds-card class="nds-p-4 nds-stack" data-spacing="lg">
        <div class="nds-stack" data-spacing="md">
          <p
            class="nds-text-body nds-text-muted-foreground nds-leading-relaxed"
            [innerHTML]="safeSummary()"
          ></p>
          <ul class="nds-stack nds-text-body nds-list-disc" data-spacing="sm">
            @for (item of safeItems(); track $index) {
              <li class="nds-leading-relaxed" [innerHTML]="item"></li>
            }
          </ul>
          @if (safeContrast(); as c) {
            <p class="nds-text-body nds-leading-relaxed" [innerHTML]="c"></p>
          }
        </div>

        <div>
          <h3 class="nds-text-base nds-font-semibold nds-mb-4">{{ keyboardTitle() }}</h3>
          <div class="nds-grid" data-cols="2" data-spacing="sm">
            @for (item of keyboardItems(); track item.key) {
              <nds-card
                class="nds-row nds-border-none nds-shadow-none nds-bg-muted-soft nds-p-4"
                data-spacing="sm"
                data-align="start"
              >
                <kbd class="nds-kbd">{{ item.key }}</kbd>
                <span class="nds-text-body nds-text-muted-foreground nds-leading-relaxed">
                  {{ item.description }}
                </span>
              </nds-card>
            }
          </div>
        </div>

        @if (safeScreenReaderItems().length > 0) {
          <div>
            @if (screenReaderTitle()) {
              <h3 class="nds-text-base nds-font-semibold nds-mb-4">{{ screenReaderTitle() }}</h3>
            }
            <ul class="nds-stack nds-text-body nds-list-disc" data-spacing="sm">
              @for (item of safeScreenReaderItems(); track $index) {
                <li class="nds-leading-relaxed" [innerHTML]="item"></li>
              }
            </ul>
          </div>
        }
      </nds-card>
    </section>
  `,
})
export class NdsDocsAccessibility {
  readonly title = input.required<string>();
  readonly summary = input.required<string>();
  readonly items = input.required<string[]>();
  readonly keyboardTitle = input.required<string>();
  readonly keyboardItems = input.required<DocsKeyboardItem[]>();
  /**
   * Anúncios de leitor de tela. As chaves de `accessibility.screenReader` variam
   * por componente (`closed/open/disabled`, `onOpen/onClose`, …), então o
   * container recebe só os valores — quem chama passa `Object.values(...)`.
   */
  readonly screenReaderTitle = input<string>('');
  readonly screenReaderItems = input<string[]>([]);
  /** Nota de contraste, quando o componente documenta uma. */
  readonly contrast = input<string>('');

  protected readonly safeSummary = computed(() => sanitizeHtml(this.summary()));
  protected readonly safeItems = computed(() => this.items().map(sanitizeHtml));
  protected readonly safeContrast = computed(() =>
    this.contrast() ? sanitizeHtml(this.contrast()) : '',
  );
  protected readonly safeScreenReaderItems = computed(() =>
    this.screenReaderItems().map(sanitizeHtml),
  );
}
