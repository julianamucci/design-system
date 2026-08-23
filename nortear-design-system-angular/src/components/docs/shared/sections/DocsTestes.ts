import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { NdsCard } from '@/components/ui/card';
import { NdsBadge, type BadgeVariant } from '@/components/ui/badge';
import { prioridadeVariant } from '@shared/primitives/badge-priority';

export interface DocsTestItem { action: string; result: string; priority: string }
export interface DocsA11yTestItem { criterion: string; level: string; how: string }
export interface DocsVisualTestItem { story: string; priority: string }

export interface DocsTestesFunctional {
  title: string;
  description?: string;
  cols: { action: string; result: string; priority: string };
  items: DocsTestItem[];
}
export interface DocsTestesAccessibility {
  title: string;
  description?: string;
  cols: { criterion: string; level: string; how: string };
  items: DocsA11yTestItem[];
}
export interface DocsTestesVisual {
  title: string;
  description?: string;
  cols: { story: string; priority: string };
  items: DocsVisualTestItem[];
}

@Component({
  selector: 'nds-docs-testes',
  standalone: true,
  imports: [NdsCard, NdsBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section id="testes">
      <h2 class="nds-section-title">{{ title() }}</h2>

      <div class="nds-stack" data-spacing="xl">
        <!-- Funcionais -->
        <div class="nds-stack" data-spacing="sm">
          <h3 class="nds-text-base nds-font-semibold">{{ functional().title }}</h3>
          @if (functional().description) {
            <p class="nds-text-body nds-text-muted-foreground">{{ functional().description }}</p>
          }
          <div ndsCard class="nds-p-4 nds-overflow-x">
            <div class="nds-table-wrapper" tabindex="0">
              <table class="nds-table nds-w-full nds-text-body">
                <thead>
                  <tr class="nds-border-b nds-bg-muted-soft">
                    <th class="nds-p-2 nds-font-semibold">{{ functional().cols.action }}</th>
                    <th class="nds-p-2 nds-font-semibold">{{ functional().cols.result }}</th>
                    <th class="nds-p-2 nds-font-semibold">{{ functional().cols.priority }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of functional().items; track $index) {
                    <tr class="nds-border-b nds-hover-bg-muted-faint">
                      <td class="nds-p-2">{{ item.action }}</td>
                      <td class="nds-p-2 nds-text-muted-foreground">{{ item.result }}</td>
                      <td class="nds-p-2 nds-font-medium">
                        <span ndsBadge [variant]="prioridade(item.priority)">{{ item.priority }}</span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Acessibilidade -->
        <div class="nds-stack" data-spacing="sm">
          <h3 class="nds-text-base nds-font-semibold">{{ accessibility().title }}</h3>
          @if (accessibility().description) {
            <p class="nds-text-body nds-text-muted-foreground">{{ accessibility().description }}</p>
          }
          <div ndsCard class="nds-p-4 nds-overflow-x">
            <div class="nds-table-wrapper" tabindex="0">
              <table class="nds-table nds-w-full nds-text-body">
                <thead>
                  <tr class="nds-border-b nds-bg-muted-soft">
                    <th class="nds-p-2 nds-font-semibold">{{ accessibility().cols.criterion }}</th>
                    <th class="nds-p-2 nds-font-semibold">{{ accessibility().cols.level }}</th>
                    <th class="nds-p-2 nds-font-semibold">{{ accessibility().cols.how }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of accessibility().items; track $index) {
                    <tr class="nds-border-b nds-hover-bg-muted-faint">
                      <td class="nds-p-2">{{ item.criterion }}</td>
                      <td class="nds-p-2 nds-text-muted-foreground">{{ item.level }}</td>
                      <td class="nds-p-2 nds-text-muted-foreground">{{ item.how }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Visuais -->
        <div class="nds-stack" data-spacing="sm">
          <h3 class="nds-text-base nds-font-semibold">{{ visual().title }}</h3>
          @if (visual().description) {
            <p class="nds-text-body nds-text-muted-foreground">{{ visual().description }}</p>
          }
          <div ndsCard class="nds-p-4 nds-overflow-x">
            <div class="nds-table-wrapper" tabindex="0">
              <table class="nds-table nds-w-full nds-text-body">
                <thead>
                  <tr class="nds-border-b nds-bg-muted-soft">
                    <th class="nds-p-2 nds-font-semibold">{{ visual().cols.story }}</th>
                    <th class="nds-p-2 nds-font-semibold">{{ visual().cols.priority }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of visual().items; track $index) {
                    <tr class="nds-border-b nds-hover-bg-muted-faint">
                      <td class="nds-p-2">{{ item.story }}</td>
                      <td class="nds-p-2 nds-font-medium">
                        <span ndsBadge [variant]="prioridade(item.priority)">{{ item.priority }}</span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class NdsDocsTestes {
  readonly title = input.required<string>();
  readonly functional = input.required<DocsTestesFunctional>();
  readonly accessibility = input.required<DocsTestesAccessibility>();
  readonly visual = input.required<DocsTestesVisual>();

  /**
   * A prioridade escolhe uma VARIANTE do badge — alta é destructive, média é
   * warning, baixa é info. O mapeamento vive em @shared/primitives para cobrir
   * os três idiomas: um mapa só pt/en fazia "Media"/"Baja" caírem no outline.
   */
  protected prioridade(value: string): BadgeVariant {
    return prioridadeVariant(value) as BadgeVariant;
  }
}
