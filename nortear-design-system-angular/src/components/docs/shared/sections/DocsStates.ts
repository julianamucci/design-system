import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { NdsCard } from '@/components/ui/card';

export interface DocsStateItem { label: string; trigger: string; behavior: string }

@Component({
  selector: 'nds-docs-states',
  standalone: true,
  imports: [NdsCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section id="estados">
      <h2 class="nds-section-title">{{ title() }}</h2>

      <div ndsCard class="nds-p-4 nds-overflow-x">
        <div class="nds-table-wrapper" tabindex="0">
          <table class="nds-table nds-w-full nds-text-body">
            <thead>
              <tr class="nds-border-b nds-bg-muted-soft">
                <th class="nds-p-2 nds-font-semibold">{{ cols().state }}</th>
                <th class="nds-p-2 nds-font-semibold">{{ cols().trigger }}</th>
                <th class="nds-p-2 nds-font-semibold">{{ cols().behavior }}</th>
              </tr>
            </thead>
            <tbody>
              @for (item of items(); track $index) {
                <tr class="nds-border-b nds-hover-bg-muted-faint">
                  <td class="nds-p-2 nds-font-medium">{{ item.label }}</td>
                  <td class="nds-p-2 nds-text-muted-foreground">{{ item.trigger }}</td>
                  <td class="nds-p-2 nds-text-muted-foreground">{{ item.behavior }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `,
})
export class NdsDocsStates {
  readonly title = input.required<string>();
  readonly cols = input.required<{ state: string; trigger: string; behavior: string }>();
  readonly items = input.required<DocsStateItem[]>();
}
