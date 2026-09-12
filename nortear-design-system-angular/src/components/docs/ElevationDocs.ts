import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed } from '@angular/core';
import { NdsFoundationPage } from './shared/FoundationPage';
import { useTranslation } from '@/lib/i18n';
import translations from '@shared/content/foundations/elevacao-bordas-sombras/translations.json';

/**
 * Elevação, Bordas e Sombras — fundamento COM desenho próprio.
 *
 * Três amostras: a escada de sombra, os sete tokens de radius e o par
 * certo/errado de raio aninhado (Rᵢ = Rₑ − E).
 *
 * Sombra e raio já têm utilitário `.nds-*` no CSS compartilhado
 * (`nds-shadow-*`, `nds-rounded-*`), então nenhuma amostra precisa de style
 * inline nem de classe nova: cada uma escolhe a classe do seu degrau.
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
const { t, locale } = useTranslation(translations as Record<string, unknown>);

const CARTAO_DE_SOMBRA =
  'nds-bg-card nds-border-soft nds-rounded-lg nds-p-4 nds-text-caption nds-text-muted-foreground nds-text-center';

const CARTAO_DE_RAIO =
  'nds-bg-primary-soft nds-border-primary-soft nds-p-6 nds-text-caption nds-text-muted-foreground nds-text-center';

/**
 * A escada de elevação do mostruário é DERIVADA de `elevation.rows` do conteúdo
 * compartilhado — nunca recravada aqui. A lista cravada tinha quatro degraus e o
 * conteúdo passou a seis em 2026-09-12 (entrou `--elevation-xs`, relevo de
 * controle): a tabela mostrava o degrau novo e o mostruário não, e a página se
 * contradizia. Ordem, rótulo e token saem todos da mesma fonte.
 *
 * O `token` do nível plano é o travessão (`—`) no conteúdo; aqui ele vira
 * `null`, que é o que distingue "sem sombra" de "sombra deste token".
 */
interface ElevationDegrau {
  /** Chave da linha no conteúdo — `plano`, `controle`, `card`, … */
  key: string;
  /** Rótulo traduzido (`elevation.rows.<key>.level`). */
  label: string;
  /** Custom property da sombra, ou `null` no nível plano. */
  token: string | null;
  /** Classe pronta do cartão, degrau incluído. */
  classes: string;
}

/** Classe utilitária que pinta o degrau: `--elevation-md` → `.nds-shadow-md`. */
function shadowClass(token: string | null): string {
  return token ? `nds-shadow-${token.replace('--elevation-', '')}` : 'nds-shadow-none';
}

// A ORDEM e o conjunto de degraus vêm das chaves do dicionário; os textos vêm
// do `t()`, que já resolve locale e overrides. `computed` e não constante: o
// rótulo é traduzido, e a barra de idioma tem de repintar a escada.
const ELEVACOES = computed<ElevationDegrau[]>(() => {
  const dict = translations as Record<
    string,
    { elevation?: { rows?: Record<string, unknown> } } | undefined
  >;
  const rows = (dict[locale()] ?? dict['pt-BR'])?.elevation?.rows ?? {};
  return Object.keys(rows).map((key) => {
    const token = t(`elevation.rows.${key}.token`);
    const shadow = token.startsWith('--') ? token : null;
    return {
      key,
      label: t(`elevation.rows.${key}.level`),
      token: shadow,
      classes: `${CARTAO_DE_SOMBRA} ${shadowClass(shadow)}`,
    };
  });
});

/** Degrau da escala de radius. `label` é o que a amostra imprime. */
interface DegrauDeRadius {
  label: string;
  classes: string;
}

const RAIOS: DegrauDeRadius[] = [
  { label: '--radius-none', classes: `${CARTAO_DE_RAIO} nds-rounded-none` },
  { label: '--radius-xs', classes: `${CARTAO_DE_RAIO} nds-rounded-xs` },
  { label: '--radius-sm', classes: `${CARTAO_DE_RAIO} nds-rounded-sm` },
  { label: '--radius-md', classes: `${CARTAO_DE_RAIO} nds-rounded-md` },
  { label: '--radius-lg', classes: `${CARTAO_DE_RAIO} nds-rounded-lg` },
  { label: '--radius-xl', classes: `${CARTAO_DE_RAIO} nds-rounded-xl` },
  { label: '.nds-rounded-full', classes: `${CARTAO_DE_RAIO} nds-rounded-full` },
];

/** Um par de caixas aninhadas, com a legenda que explica o resultado. */
interface RaioNesting {
  externo: string;
  meio: string;
  interno: string;
  caption: string;
}

const ANINHAMENTOS: RaioNesting[] = [
  // Certo: 14 → 10 → 6, um inset de 4px (nds-p-1) por nível.
  {
    externo: 'nds-bg-primary-soft nds-p-1 nds-rounded-xl',
    meio: 'nds-bg-card nds-p-1 nds-rounded-lg',
    interno: 'nds-bg-primary-soft nds-p-6 nds-rounded-sm',
    caption: 'specimens.nestedOk',
  },
  // Errado: o mesmo raio nos três níveis — o canto interno fica pesado.
  {
    externo: 'nds-bg-primary-soft nds-p-1 nds-rounded-xl',
    meio: 'nds-bg-card nds-p-1 nds-rounded-xl',
    interno: 'nds-bg-primary-soft nds-p-6 nds-rounded-xl',
    caption: 'specimens.nestedBad',
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
            @for (level of elevacoes(); track level.key) {
              <div [class]="level.classes" [attr.data-elevation-step]="level.key">
                <div class="nds-font-medium nds-text-foreground nds-mb-1">{{ level.label }}</div>
                <code class="nds-specimen-token-code">{{ level.token ?? '—' }}</code>
              </div>
            }
          </div>
        </div>

        <!-- Radius -->
        <div class="nds-stack" data-spacing="sm">
          <h3 class="nds-text-body nds-font-medium">{{ t('specimens.radius') }}</h3>
          <div class="nds-grid nds-radius-grid" data-spacing="md">
            @for (raio of raios; track raio.label) {
              <div [class]="raio.classes">
                <code>{{ raio.label }}</code>
              </div>
            }
          </div>
        </div>

        <!-- Raio aninhado -->
        <div class="nds-stack" data-spacing="sm">
          <h3 class="nds-text-body nds-font-medium">{{ t('specimens.nested') }}</h3>
          <div class="nds-grid nds-radius-nested-grid" data-spacing="md">
            @for (aninhamento of aninhamentos; track aninhamento.caption) {
              <div class="nds-stack" data-spacing="xs">
                <div [class]="aninhamento.externo">
                  <div [class]="aninhamento.meio">
                    <div [class]="aninhamento.interno"></div>
                  </div>
                </div>
                <span class="nds-text-caption nds-text-muted-foreground">{{
                  t(aninhamento.caption)
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
