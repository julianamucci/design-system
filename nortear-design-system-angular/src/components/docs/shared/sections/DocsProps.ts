import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { NdsCard } from '@/components/ui/card';
import { NdsCodeBlock } from '@/components/ui/code-block';
import { sanitizeHtml } from '@/lib/utils';

export interface DocsPropItem {
  name: string;
  type: string;
  defaultValue: string;
  required: string;
  description: string;
}

export interface DocsPropsTableDef {
  title?: string;
  cols: { prop: string; type: string; default: string; required: string; description: string };
  items: DocsPropItem[];
}

@Component({
  selector: 'nds-docs-props',
  standalone: true,
  imports: [NdsCard, NdsCodeBlock],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section id="propriedades">
      <h2 class="nds-section-title">{{ title() }}</h2>

      <div class="nds-stack" data-spacing="xl">
        @for (def of tables(); track $index) {
          @if (def.title) {
            <h3 class="nds-text-base nds-font-semibold">{{ def.title }}</h3>
          }
          <nds-card class="nds-p-4 nds-overflow-x">
            <div class="nds-table-wrapper" tabindex="0">
              <table class="nds-table nds-w-full nds-text-body">
                <thead>
                  <tr class="nds-border-b nds-bg-muted-soft">
                    <th class="nds-p-2 nds-font-semibold">{{ def.cols.prop }}</th>
                    <th class="nds-p-2 nds-font-semibold">{{ def.cols.type }}</th>
                    <th class="nds-p-2 nds-font-semibold">{{ def.cols.default }}</th>
                    <th class="nds-p-2 nds-font-semibold">{{ def.cols.required }}</th>
                    <th class="nds-p-2 nds-font-semibold">{{ def.cols.description }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of def.items; track item.name) {
                    <tr class="nds-border-b nds-hover-bg-muted-faint">
                      <!-- lang="en": nome de prop e tipo são identificadores, não
                           português. Sem isto a voz do leitor em pt-BR tenta
                           pronunciá-los como português. WCAG 3.1.2. -->
                      <td class="nds-p-2 nds-font-mono nds-font-bold nds-text-primary" lang="en">{{ item.name }}</td>
                      <td class="nds-p-2 nds-font-mono nds-text-muted-foreground" lang="en">{{ item.type }}</td>
                      <td class="nds-p-2 nds-text-muted-foreground">{{ item.defaultValue }}</td>
                      <td class="nds-p-2 nds-text-muted-foreground">{{ item.required }}</td>
                      <td class="nds-p-2 nds-text-muted-foreground">{{ item.description }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </nds-card>
        }

        @if (interfaceCode()) {
          <nds-code-block
            [code]="interfaceCode()"
            [language]="language()"
            [showLineNumbers]="false"
            [copyLabel]="copyLabel()"
            [copiedLabel]="copiedLabel()"
          />
        }

        @if (extensibilityTitle()) {
          <div class="nds-stack" data-spacing="sm">
            <h3 class="nds-text-base nds-font-semibold">{{ extensibilityTitle() }}</h3>
            @if (safeExtensibilityNotes(); as notes) {
              <div
                class="nds-text-body nds-text-muted-foreground nds-leading-relaxed"
                [innerHTML]="notes"
              ></div>
            }
            @if (extensibilityCode()) {
              <nds-code-block
                [code]="extensibilityCode()"
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
export class NdsDocsProps {
  readonly title = input.required<string>();
  readonly tables = input.required<DocsPropsTableDef[]>();
  readonly interfaceCode = input<string>('');
  readonly extensibilityTitle = input<string>('');
  readonly extensibilityNotes = input<string>('');
  readonly extensibilityCode = input<string>('');
  readonly language = input<string>('ts');
  readonly copyLabel = input<string>('Copiar código');
  readonly copiedLabel = input<string>('Copiado!');

  protected readonly safeExtensibilityNotes = computed(() =>
    this.extensibilityNotes() ? sanitizeHtml(this.extensibilityNotes()) : '',
  );
}
