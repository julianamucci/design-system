import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { NdsComponentDemo } from '@/components/ComponentDemo';
import { NdsCodeBlock } from '@/components/ui/code-block';
import { sanitizeHtml } from '@/lib/utils';

@Component({
  selector: 'nds-docs-anatomy',
  standalone: true,
  imports: [NdsComponentDemo, NdsCodeBlock],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section id="anatomia">
      <h2 class="nds-section-title">{{ title() }}</h2>
      <nds-component-demo>
        <div class="nds-stack nds-w-full" data-spacing="md">
          <ol class="nds-stack nds-text-body nds-list-none" data-spacing="sm">
            @for (item of safeItems(); track $index; let i = $index) {
              <li class="nds-row nds-list-none" data-spacing="sm" data-align="start">
                <span class="nds-pill" data-tone="primary">{{ i + 1 }}</span>
                <span [innerHTML]="item"></span>
              </li>
            }
          </ol>

          <div>
            @if (structureLabel()) {
              <p class="nds-text-caption nds-text-muted-foreground nds-mb-2">{{ structureLabel() }}</p>
            }
            <nds-code-block
              [code]="structureCode()"
              [language]="language()"
              [showLineNumbers]="false"
              [copyLabel]="copyLabel()"
              [copiedLabel]="copiedLabel()"
            />
          </div>
        </div>
      </nds-component-demo>
    </section>
  `,
})
export class NdsDocsAnatomy {
  readonly title = input.required<string>();
  readonly items = input.required<string[]>();
  readonly structureCode = input.required<string>();
  readonly structureLabel = input<string>('');
  /** Linguagem do snippet de estrutura, repassada ao CodeBlock. */
  readonly language = input<string>('ts');
  readonly copyLabel = input<string>('Copiar código');
  readonly copiedLabel = input<string>('Copiado!');

  protected readonly safeItems = computed(() => this.items().map(sanitizeHtml));
}
