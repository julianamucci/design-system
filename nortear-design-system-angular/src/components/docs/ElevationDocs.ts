import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { NdsFoundationPage } from './shared/FoundationPage';
import { useTranslation } from '@/lib/i18n';
import translations from '@shared/content/foundations/elevacao-bordas-sombras/translations.json';

/**
 * Elevação, Bordas e Sombras — fundamento COM desenho próprio.
 *
 * Três amostras: os cinco degraus de sombra, os sete tokens de radius e o par
 * certo/errado de raio aninhado (Rᵢ = Rₑ − E).
 *
 * Sombra e raio já têm utilitário `.nds-*` no CSS compartilhado
 * (`nds-shadow-*`, `nds-rounded-*`), então nenhuma amostra precisa de style
 * inline nem de classe nova: cada uma escolhe a classe do seu degrau. O único
 * degrau que faltava era o `nds-shadow-xl` (nível 4, tooltip), criado em
 * `colors.css` junto dos irmãos — esta é a única página que desenha os cinco
 * lado a lado.
 *
 * A lista de classes vem INTEIRA do TypeScript, sem `class="…"` estático no
 * mesmo elemento. Misturar atributo estático com `[class]` depende de uma
 * mesclagem que este projeto só tem verificada para host binding; aqui o
 * degrau é a única coisa que varia, e uma string só torna a regra desnecessária.
 *
 * `--radius-lg` e `--radius` valem os mesmos 10px (a tabela desta própria
 * página diz "10px (=base)"), por isso o nível do meio do aninhamento certo usa
 * `nds-rounded-lg` — é o utilitário do valor que as outras stacks escrevem como
 * `var(--radius)`.
 */
const { t } = useTranslation(translations as Record<string, unknown>);

const CARTAO_DE_SOMBRA =
  'nds-bg-card nds-border-soft nds-rounded-lg nds-p-4 nds-text-caption nds-text-muted-foreground nds-text-center';

const CARTAO_DE_RAIO =
  'nds-bg-primary-soft nds-border-primary-soft nds-p-6 nds-text-caption nds-text-muted-foreground nds-text-center';

/** Degrau da escada de elevação. */
interface ElevationDegrau {
  rotulo: string;
  token: string;
  classes: string;
}

const ELEVACOES: ElevationDegrau[] = [
  { rotulo: '0 — Plano', token: '—', classes: `${CARTAO_DE_SOMBRA} nds-shadow-none` },
  { rotulo: '1 — Card', token: '--elevation-sm', classes: `${CARTAO_DE_SOMBRA} nds-shadow-sm` },
  { rotulo: '2 — Dropdown', token: '--elevation-md', classes: `${CARTAO_DE_SOMBRA} nds-shadow-md` },
  { rotulo: '3 — Dialog', token: '--elevation-lg', classes: `${CARTAO_DE_SOMBRA} nds-shadow-lg` },
  { rotulo: '4 — Tooltip', token: '--elevation-xl', classes: `${CARTAO_DE_SOMBRA} nds-shadow-xl` },
];

/** Degrau da escala de radius. `rotulo` é o que a amostra imprime. */
interface DegrauDeRadius {
  rotulo: string;
  classes: string;
}

const RAIOS: DegrauDeRadius[] = [
  { rotulo: '--radius-none', classes: `${CARTAO_DE_RAIO} nds-rounded-none` },
  { rotulo: '--radius-xs', classes: `${CARTAO_DE_RAIO} nds-rounded-xs` },
  { rotulo: '--radius-sm', classes: `${CARTAO_DE_RAIO} nds-rounded-sm` },
  { rotulo: '--radius-md', classes: `${CARTAO_DE_RAIO} nds-rounded-md` },
  { rotulo: '--radius-lg', classes: `${CARTAO_DE_RAIO} nds-rounded-lg` },
  { rotulo: '--radius-xl', classes: `${CARTAO_DE_RAIO} nds-rounded-xl` },
  { rotulo: '.nds-rounded-full', classes: `${CARTAO_DE_RAIO} nds-rounded-full` },
];

/** Um par de caixas aninhadas, com a legenda que explica o resultado. */
interface RaioNesting {
  externo: string;
  meio: string;
  interno: string;
  legenda: string;
}

const ANINHAMENTOS: RaioNesting[] = [
  // Certo: 14 → 10 → 6, um inset de 4px (nds-p-1) por nível.
  {
    externo: 'nds-bg-primary-soft nds-p-1 nds-rounded-xl',
    meio: 'nds-bg-card nds-p-1 nds-rounded-lg',
    interno: 'nds-bg-primary-soft nds-p-6 nds-rounded-sm',
    legenda: 'specimens.nestedOk',
  },
  // Errado: o mesmo raio nos três níveis — o canto interno fica pesado.
  {
    externo: 'nds-bg-primary-soft nds-p-1 nds-rounded-xl',
    meio: 'nds-bg-card nds-p-1 nds-rounded-xl',
    interno: 'nds-bg-primary-soft nds-p-6 nds-rounded-xl',
    legenda: 'specimens.nestedBad',
  },
];

@Component({
  selector: 'nds-elevation-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NdsFoundationPage],
  template: `
    <nds-foundation-page slug="elevacao-bordas-sombras" [translations]="translations">
      <section class="nds-stack nds-docs-section-divider" data-spacing="md">
        <div class="nds-stack" data-spacing="xs">
          <h2 class="nds-text-h2 nds-text-foreground">{{ t('specimens.title') }}</h2>
          <p class="nds-text-body">{{ t('specimens.subtitle') }}</p>
        </div>

        <!-- Sombras -->
        <div class="nds-stack" data-spacing="sm">
          <h3 class="nds-text-body nds-font-medium">{{ t('specimens.shadows') }}</h3>
          <div class="nds-grid nds-elevation-grid nds-p-6 nds-rounded-lg" data-spacing="lg">
            @for (level of elevacoes; track level.rotulo) {
              <div [class]="level.classes">
                <div class="nds-font-medium nds-text-foreground nds-mb-1">{{ level.rotulo }}</div>
                <code class="nds-specimen-token-code">{{ level.token }}</code>
              </div>
            }
          </div>
        </div>

        <!-- Radius -->
        <div class="nds-stack" data-spacing="sm">
          <h3 class="nds-text-body nds-font-medium">{{ t('specimens.radius') }}</h3>
          <div class="nds-grid nds-radius-grid" data-spacing="md">
            @for (raio of raios; track raio.rotulo) {
              <div [class]="raio.classes">
                <code>{{ raio.rotulo }}</code>
              </div>
            }
          </div>
        </div>

        <!-- Raio aninhado -->
        <div class="nds-stack" data-spacing="sm">
          <h3 class="nds-text-body nds-font-medium">{{ t('specimens.nested') }}</h3>
          <div class="nds-grid nds-radius-nested-grid" data-spacing="md">
            @for (aninhamento of aninhamentos; track aninhamento.legenda) {
              <div class="nds-stack" data-spacing="xs">
                <div [class]="aninhamento.externo">
                  <div [class]="aninhamento.meio">
                    <div [class]="aninhamento.interno"></div>
                  </div>
                </div>
                <span class="nds-text-caption nds-text-muted-foreground">{{
                  t(aninhamento.legenda)
                }}</span>
              </div>
            }
          </div>
        </div>
      </section>
    </nds-foundation-page>
  `,
})
export class NdsElevationDocs {
  protected readonly translations = translations as Record<string, unknown>;
  protected readonly t = t;
  protected readonly elevacoes = ELEVACOES;
  protected readonly raios = RAIOS;
  protected readonly aninhamentos = ANINHAMENTOS;
}
