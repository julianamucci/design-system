import {
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { NdsCard } from '@/components/ui/card';
import DOMPurify from 'dompurify';

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

      <div ndsCard class="nds-p-4 nds-stack" data-spacing="lg">
        <div class="nds-stack" data-spacing="md">
          <p
            class="nds-text-body nds-text-muted-foreground nds-leading-relaxed"
            [innerHTML]="DOMPurify.sanitize(summary())"
          ></p>
          <ul class="nds-stack nds-text-body nds-list-disc" data-spacing="sm">
            @for (item of items(); track $index) {
              <li class="nds-leading-relaxed" [innerHTML]="DOMPurify.sanitize(item)"></li>
            }
          </ul>
          @if (contrast(); as c) {
            <p class="nds-text-body nds-leading-relaxed" [innerHTML]="DOMPurify.sanitize(c)"></p>
          }
        </div>

        <div>
          <h3 class="nds-text-base nds-font-semibold nds-mb-4">{{ keyboardTitle() }}</h3>
          <div class="nds-grid" data-cols="2" data-spacing="sm">
            @for (item of keyboardItems(); track item.key) {
              <div ndsCard
                class="nds-row nds-border-none nds-shadow-none nds-bg-muted-soft nds-p-4 nds-card-nested"
                data-spacing="sm"
                data-align="start"
              >
                <kbd class="nds-kbd">{{ item.key }}</kbd>
                <span class="nds-text-body nds-text-muted-foreground nds-leading-relaxed">
                  {{ item.description }}
                </span>
              </div>
            }
          </div>
        </div>

        @if (screenReaderItems().length > 0) {
          <div>
            @if (screenReaderTitle()) {
              <h3 class="nds-text-base nds-font-semibold nds-mb-4">{{ screenReaderTitle() }}</h3>
            }
            <ul class="nds-stack nds-text-body nds-list-disc" data-spacing="sm">
              @for (item of screenReaderItems(); track $index) {
                <li class="nds-leading-relaxed" [innerHTML]="DOMPurify.sanitize(item)"></li>
              }
            </ul>
          </div>
        }
      </div>
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

  // DOMPurify no escopo do template: a chamada precisa aparecer no próprio
  // binding [innerHTML] para o SAST reconhecer o sanitizador de taint
  // (guideline 09). Um computed `safe*` esconderia a chamada do fluxo.
  protected readonly DOMPurify = DOMPurify;
}
