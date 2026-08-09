import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { NdsCard } from '@/components/ui/card';

export interface DocsAnalyticsEventItem { event: string; trigger: string; payload: string }

@Component({
  selector: 'nds-docs-analytics',
  standalone: true,
  imports: [NdsCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section id="analytics">
      <h2 class="nds-section-title">{{ title() }}</h2>

      <div ndsCard class="nds-p-4 nds-overflow-x">
        <div class="nds-table-wrapper" tabindex="0">
          <table class="nds-table nds-w-full nds-text-body">
            <thead>
              <tr class="nds-border-b nds-bg-muted-soft">
                <th class="nds-p-2 nds-font-semibold">{{ cols().event }}</th>
                <th class="nds-p-2 nds-font-semibold">{{ cols().trigger }}</th>
                <th class="nds-p-2 nds-font-semibold">{{ cols().payload }}</th>
              </tr>
            </thead>
            <tbody>
              @for (item of items(); track $index) {
                <tr class="nds-border-b nds-hover-bg-muted-faint">
                  <td class="nds-p-2 nds-font-mono nds-text-primary">{{ item.event }}</td>
                  <td class="nds-p-2 nds-text-muted-foreground">{{ item.trigger }}</td>
                  <td class="nds-p-2 nds-font-mono nds-text-caption nds-text-muted-foreground">
                    {{ item.payload }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `,
})
export class NdsDocsAnalytics {
  readonly title = input.required<string>();
  readonly cols = input.required<{ event: string; trigger: string; payload: string }>();
  readonly items = input.required<DocsAnalyticsEventItem[]>();
}
