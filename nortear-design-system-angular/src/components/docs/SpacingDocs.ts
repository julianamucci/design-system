import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { NdsFoundationPage } from './shared/FoundationPage';
import { useTranslation } from '@/lib/i18n';
import translations from '@shared/content/foundations/espacamento/translations.json';

/**
 * Espaçamento e Grid — fundamento COM desenho próprio.
 *
 * A escala só se prova desenhada: uma tabela dizendo que `--spacing-6` vale
 * 24px não mostra a distância entre um degrau e o seguinte. O que mostra são as
 * treze barras empilhadas, cada uma com a largura do seu token.
 *
 * A largura NÃO vem de style inline (como nas outras stacks, onde o valor é
 * escolhido item a item dentro de um laço de JS): o conjunto de degraus é
 * fechado, então cada um tem seletor próprio por `data-token` em
 * `docs-specimens.css`. A barra passa a acompanhar a densidade ativa sem que
 * esta página saiba disso — `var(--spacing-*)` é recalculado pelo escopo
 * `densidade-*`, não por este arquivo.
 */
const { t } = useTranslation(translations as Record<string, unknown>);

/** Um degrau da escada. `token` é o sufixo lido pelo `data-token` do CSS. */
interface DegrauDeEspacamento {
  nome: string;
  token: string;
  px: string;
}

const DEGRAUS: DegrauDeEspacamento[] = [
  { nome: 'spacing-px', token: 'px', px: '1px' },
  { nome: 'spacing-0-5', token: '0-5', px: '2px' },
  { nome: 'spacing-1', token: '1', px: '4px' },
  { nome: 'spacing-2', token: '2', px: '8px' },
  { nome: 'spacing-4', token: '4', px: '16px' },
  { nome: 'spacing-6', token: '6', px: '24px' },
  { nome: 'spacing-8', token: '8', px: '32px' },
  { nome: 'spacing-10', token: '10', px: '40px' },
  { nome: 'spacing-12', token: '12', px: '48px' },
  { nome: 'spacing-14', token: '14', px: '56px' },
  { nome: 'spacing-16', token: '16', px: '64px' },
  { nome: 'spacing-20', token: '20', px: '80px' },
  { nome: 'spacing-24', token: '24', px: '96px' },
];

@Component({
  selector: 'nds-spacing-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NdsFoundationPage],
  template: `
    <nds-foundation-page slug="espacamento" [translations]="translations">
      <section class="nds-stack nds-docs-section-divider" data-spacing="md">
        <div class="nds-stack" data-spacing="xs">
          <h2 class="nds-text-h2 nds-text-foreground">{{ t('specimens.title') }}</h2>
          <p class="nds-text-body">{{ t('specimens.subtitle') }}</p>
        </div>

        <div
          class="nds-stack nds-bg-card nds-border-soft nds-rounded-lg nds-p-6"
          data-spacing="sm"
        >
          @for (degrau of degraus; track degrau.token) {
            <div class="nds-row" data-align="center" data-spacing="md">
              <code class="nds-text-caption nds-text-muted-foreground nds-shrink-0 nds-spacing-scale-name">{{
                degrau.nome
              }}</code>
              <!-- Gráfico puro: quem lê o nome do token já tem a informação, e
                   a barra repetiria a mesma coisa em forma de largura. -->
              <div
                class="nds-bg-primary nds-rounded-sm nds-shrink-0 nds-spacing-bar"
                [attr.data-token]="degrau.token"
                aria-hidden="true"
              ></div>
              <span class="nds-text-caption nds-text-muted-foreground">{{ degrau.px }}</span>
            </div>
          }
        </div>
      </section>
    </nds-foundation-page>
  `,
})
export class NdsSpacingDocs {
  protected readonly translations = translations as Record<string, unknown>;
  protected readonly t = t;
  protected readonly degraus = DEGRAUS;
}
