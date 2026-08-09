import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { NdsCard } from '@/components/ui/card';
import { NdsCodeBlock } from '@/components/ui/code-block';

export interface DocsTokenItem { token: string; value: string; description: string }

@Component({
  selector: 'nds-docs-tokens',
  standalone: true,
  imports: [NdsCard, NdsCodeBlock],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section id="tokens">
      <h2 class="nds-section-title">{{ title() }}</h2>

      <div class="nds-stack" data-spacing="lg">
        <div ndsCard class="nds-p-4 nds-overflow-x">
          <div class="nds-table-wrapper" tabindex="0">
            <table class="nds-table nds-w-full nds-text-body">
              <thead>
                <tr class="nds-border-b nds-bg-muted-soft">
                  <th class="nds-p-2 nds-font-semibold">{{ cols().token }}</th>
                  <th class="nds-p-2 nds-font-semibold">{{ cols().value }}</th>
                  <th class="nds-p-2 nds-font-semibold">{{ cols().description }}</th>
                </tr>
              </thead>
              <tbody>
                @for (item of items(); track item.token) {
                  <tr class="nds-border-b nds-hover-bg-muted-faint">
                    <!-- lang="en": token e seletor são identificadores CSS. -->
                    <td class="nds-p-2 nds-font-mono nds-text-primary" lang="en">{{ item.token }}</td>
                    <td class="nds-p-2 nds-font-mono nds-text-muted-foreground" lang="en">{{ item.value }}</td>
                    <td class="nds-p-2 nds-text-muted-foreground">{{ item.description }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        @if (customizationTitle()) {
          <div class="nds-stack" data-spacing="sm">
            <h3 class="nds-text-base nds-font-semibold">{{ customizationTitle() }}</h3>
            @if (customizationCode()) {
              <nds-code-block
                [code]="customizationCode()"
                [language]="language()"
                [showLineNumbers]="false"
                [copyLabel]="copyLabel()"
                [copiedLabel]="copiedLabel()"
              />
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class NdsDocsTokens {
  readonly title = input.required<string>();
  readonly cols = input.required<{ token: string; value: string; description: string }>();
  readonly items = input.required<DocsTokenItem[]>();
  readonly customizationTitle = input<string>('');
  readonly customizationCode = input<string>('');
  readonly language = input<string>('css');
  readonly copyLabel = input<string>('Copiar código');
  readonly copiedLabel = input<string>('Copiado!');
}
