import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { deriveSlugFromUrl } from '@/lib/docs-tracking';

export interface DocsNavSection {
  id: string;
  label: string;
}

export interface DocsNavGroup {
  label: string;
  sections: DocsNavSection[];
}

/**
 * Leva o usuário até a seção: rola E move o foco.
 *
 * Só rolar deixava o foco no botão do menu — o cursor de leitura do leitor de
 * tela não acompanhava e o Tab seguinte ia para o próximo item do menu, não
 * para o conteúdo.
 *
 * `tabindex="-1"` é aplicado no momento do clique (não exige mexer no HTML de
 * cada seção) e `focus({ preventScroll: true })` deixa a rolagem suave
 * acontecer enquanto o foco já se moveu.
 */
function goToSection(id: string): void {
  const target = document.getElementById(id);
  if (!target) return;
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  target.focus({ preventScroll: true });
}

@Component({
  selector: 'nds-docs-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'nds-docs-nav' },
  template: `
    @for (group of groups(); track group.label) {
      <div class="nds-docs-nav-group">
        <p class="nds-docs-nav-label">{{ group.label }}</p>
        <ul class="nds-docs-nav-list">
          @for (section of group.sections; track section.id) {
            <li>
              <button
                type="button"
                class="nds-docs-nav-button"
                data-track="nav"
                [attr.data-track-id]="slug() + ':nav:' + section.id"
                [attr.data-track-label]="section.label"
                [attr.aria-current]="section.id === activeSection() ? 'location' : null"
                (click)="go(section.id)"
              >{{ section.label }}</button>
            </li>
          }
        </ul>
      </div>
    }
  `,
})
export class NdsDocsNav {
  readonly groups = input.required<DocsNavGroup[]>();
  readonly activeSection = input<string | undefined>(undefined);
  /**
   * Slug do componente — usado no data-track-id (ex: "button" →
   * `button:nav:anatomia`). Omitido, é derivado do `?id=` do iframe do
   * Storybook, o mesmo fallback que o `mountDocsTracking` já usa, para que o
   * `component` do evento e o 1º segmento do id continuem batendo.
   */
  readonly componentSlug = input<string | undefined>(undefined);

  protected readonly slug = computed(() => this.componentSlug() ?? deriveSlugFromUrl());

  protected go(id: string): void {
    goToSection(id);
  }
}
