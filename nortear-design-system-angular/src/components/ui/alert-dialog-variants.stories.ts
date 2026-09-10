import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, within } from 'storybook/test';
import { NDS_ALERT_DIALOG } from './alert-dialog';
import { NdsAlertIcon } from './alert';
import { NdsButton } from './button';
import { waitForPortal, FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';
import {
  LONG_DESCRIPTION,
  WITHOUT_DESCRIPTION_LABELS,
  destructiveLabels,
  neutralLabels,
} from './alert-dialog.fixtures';
import {
  alertDialogDestructiveSource,
  alertDialogExtraClassSource,
  alertDialogHeadingH3Source,
  alertDialogLongDescriptionSource,
  alertDialogNeutralSource,
  alertDialogWithMediaSource,
  alertDialogWithoutDescriptionSource,
} from './alert-dialog.source';

import { figmaDesign } from '@shared/figma/design-links';
// Variantes e formas do painel. Sem argTypes, então o painel Controls é
// desligado — do contrário apareceria vazio.
//
// Destructive e Neutral são as duas linhas de `variants.items` do conteúdo
// compartilhado; WithMedia e WithoutDescription exercitam peças opcionais da
// anatomia; LongDescription, Responsive e ExtraClass exercitam robustez, ponto
// de quebra e extensibilidade; HeadingH3, o nível do título. A ordem de export
// é a da barra lateral, e é a mesma nas cinco stacks.
//
// Todas nascem abertas: é o estado que a regressão visual precisa capturar, e
// o fechado já está em States. O `[defaultOpen]` é andaime de captura — cada
// story declara a transform que publica a composição comandada pelo gatilho.

const meta: Meta = {
  title: 'Components/Overlay/AlertDialog/Variants',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_ALERT_DIALOG, NdsButton, NdsAlertIcon] })],
  parameters: {
    design: figmaDesign('alertDialog'),
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    // Cada story declara a sua; esta é a queda, e é a composição canônica.
    docs: { source: { transform: alertDialogDestructiveSource } },
  },
};

export default meta;
type Story = StoryObj;

/**
 * O template de uma confirmação aberta, ligado a `labels` no objeto de props.
 *
 * Uma cópia só para as oito stories: o que cada uma muda — variante, mídia,
 * descrição, classe, nível do título — entra por opção, e o resto do markup é o
 * mesmo. O gatilho leva `data-testid` porque, com o painel aberto, ele fica sob
 * `inert` e sai das buscas por papel.
 */
function openTemplate(
  o: {
    triggerVariant?: 'destructive' | 'outline';
    tone?: 'destructive' | 'default';
    media?: boolean;
    mediaClass?: string;
    withoutDescription?: boolean;
    panelClass?: string;
    titleTag?: 'h2' | 'h3';
  } = {},
): string {
  const tone = o.tone ?? 'destructive';
  const tag = o.titleTag ?? 'h2';
  const actionVariant = tone === 'destructive' ? ' variant="destructive"' : '';
  const media = o.media
    ? `
          <div ndsAlertDialogMedia${o.mediaClass ? ` class="${o.mediaClass}"` : ''}>
            <svg ndsAlertIcon kind="warning"></svg>
          </div>`
    : '';
  const description = o.withoutDescription
    ? ''
    : `
          <p ndsAlertDialogDescription>{{ labels.description }}</p>`;

  return `
    <nds-alert-dialog [defaultOpen]="true"${o.panelClass ? ` panelClass="${o.panelClass}"` : ''}>
      <button
        ndsAlertDialogTrigger
        ndsButton
        variant="${o.triggerVariant ?? tone}"
        data-testid="trigger"
      >{{ labels.triggerLabel }}</button>

      <ng-template ndsAlertDialogContent>
        <div ndsAlertDialogHeader>${media}
          <${tag} ndsAlertDialogTitle>{{ labels.title }}</${tag}>${description}
        </div>
        <div ndsAlertDialogFooter>
          <button ndsAlertDialogCancel ndsButton variant="outline">{{ labels.cancelLabel }}</button>
          <button ndsAlertDialogAction ndsButton${actionVariant}>{{ labels.actionLabel }}</button>
        </div>
      </ng-template>
    </nds-alert-dialog>
  `;
}

// Mesmo exemplo da seção Variantes / destructive da docs page.
export const Destructive: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      source: { transform: alertDialogDestructiveSource },
      description: {
        story:
          'Gatilho e ação usam a variante destrutiva do Button. Use para ações irreversíveis.',
      },
    },
  },
  render: () => ({
    props: { labels: destructiveLabels() },
    template: openTemplate(),
  }),
  play: async ({ canvasElement, step }) => {
    const labels = destructiveLabels();

    await step('O painel abre com o nome acessível da confirmação destrutiva', async () => {
      const panel = await waitForPortal('alertdialog');
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAccessibleName(labels.title);
    });

    await step('Gatilho e ação compartilham a variante destrutiva', async () => {
      const panel = await waitForPortal('alertdialog');
      const trigger = canvasElement.querySelector<HTMLElement>('[data-testid="trigger"]');
      const action = within(panel).getByRole('button', { name: labels.actionLabel });
      await expect(trigger).toHaveTextContent(labels.triggerLabel);
      await expect(trigger).toHaveClass('nds-button-destructive');
      await expect(action).toHaveClass('nds-button-destructive');
    });

    await step('O Cancelar fica na hierarquia secundária', async () => {
      const panel = await waitForPortal('alertdialog');
      const cancel = within(panel).getByRole('button', { name: labels.cancelLabel });
      await expect(cancel).toHaveClass('nds-button-outline');
      await expect(cancel).not.toHaveClass('nds-button-destructive');
    });
  },
};

// Mesmo exemplo da seção Variantes / default da docs page.
export const Neutral: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      source: { transform: alertDialogNeutralSource },
      description: {
        story:
          'A ação fica na variante padrão do Button. Use para confirmações que não destroem nada — sair, arquivar, publicar.',
      },
    },
  },
  render: () => ({
    props: { labels: neutralLabels() },
    template: openTemplate({ triggerVariant: 'outline', tone: 'default' }),
  }),
  play: async ({ canvasElement, step }) => {
    const labels = neutralLabels();

    await step('O painel abre com o nome acessível da confirmação neutra', async () => {
      const panel = await waitForPortal('alertdialog');
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAccessibleName(labels.title);
    });

    await step('A confirmação neutra não usa a cor de perigo', async () => {
      // Vermelho reservado ao irreversível: usá-lo em "sair da conta" gasta o
      // sinal, e quando a exclusão real aparecer ele não vai mais alarmar.
      const panel = await waitForPortal('alertdialog');
      const action = within(panel).getByRole('button', { name: labels.actionLabel });
      await expect(action).toHaveClass('nds-button-default');
      await expect(action).not.toHaveClass('nds-button-destructive');
      const trigger = canvasElement.querySelector<HTMLElement>('[data-testid="trigger"]');
      await expect(trigger).toHaveClass('nds-button-outline');
    });

    await step('O Cancelar fica na hierarquia secundária', async () => {
      const panel = await waitForPortal('alertdialog');
      const cancel = within(panel).getByRole('button', { name: labels.cancelLabel });
      await expect(cancel).toHaveClass('nds-button-outline');
    });
  },
};

export const WithMedia: Story = {
  parameters: {
    covers: ['visual.item6'],
    docs: {
      source: { transform: alertDialogWithMediaSource },
      description: {
        story:
          'Caixa de ícone no topo do cabeçalho. No mobile a folha centraliza a caixa do ícone, e a partir de 40rem ela volta à esquerda; o texto do cabeçalho não depende dela.',
      },
    },
  },
  render: () => ({
    props: { labels: destructiveLabels() },
    template: openTemplate({ media: true }),
  }),
  play: async ({ step }) => {
    await step('A caixa de mídia é o primeiro filho do cabeçalho, acima do título', async () => {
      // É dessa ordem que dependem o `:has()` da folha e a leitura ícone →
      // título → descrição.
      const panel = await waitForPortal('alertdialog');
      const media = panel.querySelector<HTMLElement>('.nds-alert-dialog-media');
      const header = panel.querySelector<HTMLElement>('.nds-alert-dialog-header');
      const title = panel.querySelector<HTMLElement>('.nds-alert-dialog-title');
      await expect(media).not.toBeNull();
      await expect(header!.firstElementChild).toBe(media);
      await expect(media!.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        title!.getBoundingClientRect().top + 1,
      );
    });

    await step('O ícone não é anunciado, e quem sai da árvore é ele, não a caixa', async () => {
      // Num alertdialog o título é lido de imediato; um ícone anunciado ali
      // seria a terceira voz na mesma frase.
      const panel = await waitForPortal('alertdialog');
      const media = panel.querySelector<HTMLElement>('.nds-alert-dialog-media')!;
      await expect(media).not.toHaveAttribute('aria-hidden');
      await expect(media.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });
  },
};

// testes.accessibility.item8 — a descrição é opcional (anatomy.item6), e o
// caminho sem ela precisa de uma story: enquanto nenhuma omitia, a única prova
// de que o componente aguenta era a assinatura. O que se mede aqui não é a
// ausência do parágrafo — é que o painel deixa de declarar `aria-describedby`
// em vez de apontar para um id que não existe, o que o axe reprova em
// `aria-valid-attr-value` e o leitor de tela anuncia como nada.
export const WithoutDescription: Story = {
  parameters: {
    covers: ['accessibility.item8'],
    docs: {
      source: { transform: alertDialogWithoutDescriptionSource },
      description: {
        story:
          'Confirmação sem descrição: o título sozinho já diz o que se perde. O painel mantém o nome acessível e fica sem descrição acessível — sem referência pendurada.',
      },
    },
  },
  render: () => ({
    props: { labels: WITHOUT_DESCRIPTION_LABELS },
    template: openTemplate({ withoutDescription: true }),
  }),
  play: async ({ step }) => {
    await step('O painel abre sem descrição e mantém o nome acessível', async () => {
      const panel = await waitForPortal('alertdialog');
      await expect(panel).toBeVisible();
      await expect(panel.querySelector('.nds-alert-dialog-description')).toBeNull();
      await expect(panel).toHaveAccessibleName(WITHOUT_DESCRIPTION_LABELS.title);
    });

    await step('Nenhum aria-describedby pendurado', async () => {
      const panel = await waitForPortal('alertdialog');
      await expect(panel).not.toHaveAttribute('aria-describedby');
      await expect(panel).toHaveAccessibleDescription('');
    });

    await step('As duas saídas continuam presentes e alcançáveis', async () => {
      const panel = await waitForPortal('alertdialog');
      const scope = within(panel);
      await expect(
        scope.getByRole('button', { name: WITHOUT_DESCRIPTION_LABELS.cancelLabel }),
      ).toBeInTheDocument();
      await expect(
        scope.getByRole('button', { name: WITHOUT_DESCRIPTION_LABELS.actionLabel }),
      ).toBeInTheDocument();
    });
  },
};

// testes.visual.item4 — descrição longa (mais de uma linha) sem quebrar o painel.
export const LongDescription: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      source: { transform: alertDialogLongDescriptionSource },
      description: {
        story:
          'Descrição com duas frases completas. O painel cresce em altura e a descrição continua sendo a fonte do aria-describedby.',
      },
    },
  },
  render: () => ({
    props: { labels: { ...destructiveLabels(), description: LONG_DESCRIPTION } },
    template: openTemplate(),
  }),
  play: async ({ step }) => {
    await step('A descrição longa é a descrição acessível do painel', async () => {
      const panel = await waitForPortal('alertdialog');
      const description = panel.querySelector<HTMLElement>('.nds-alert-dialog-description');
      await expect(description).not.toBeNull();
      await expect(panel).toHaveAttribute('aria-describedby', description!.id);
      await expect(panel).toHaveAccessibleDescription(LONG_DESCRIPTION);
    });

    await step('Quebra em várias linhas sem estourar o painel', async () => {
      const panel = await waitForPortal('alertdialog');
      const description = panel.querySelector<HTMLElement>('.nds-alert-dialog-description')!;
      const lineHeight = Number.parseFloat(getComputedStyle(description).lineHeight);
      await expect(description.getBoundingClientRect().height).toBeGreaterThan(lineHeight * 1.5);
      // Nem para o lado — o texto quebra em vez de alargar a caixa —, nem para
      // baixo: não há altura cravada, e é o texto que dimensiona o painel.
      await expect(description.scrollWidth).toBeLessThanOrEqual(panel.clientWidth);
      await expect(description.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        panel.getBoundingClientRect().bottom,
      );
    });
  },
};

// testes.visual.item5 — layout responsivo. O empilhamento dos botões vem de
// `flex-direction: column-reverse` abaixo de 40rem (nds/alert-dialog.css), então
// a medição precisa acontecer numa janela estreita: o `globals` de viewport
// estreita o iframe da suíte, e o Chromatic captura em 375px. A `play` confere
// as duas pontas do invariante da categoria: a ORDEM no DOM (Cancelar primeiro,
// que é a de leitura e de tabulação) e o `column-reverse` que põe a ação em cima.
export const Responsive: Story = {
  globals: { viewport: { value: 'mobile1' } },
  parameters: {
    // Os dois sub-componentes que o Figma usa para simular o mobile: o eixo
    // Layout de cada um cobre o que aqui é media query.
    design: [
      figmaDesign('alertDialogHeader', 'Cabeçalho'),
      figmaDesign('alertDialogFooter', 'Rodapé'),
    ],
    covers: ['visual.item5'],
    chromatic: { viewports: [375] },
    docs: {
      // O empilhamento é media query: não há atributo para mostrar, e o snippet
      // é a composição canônica.
      source: { transform: alertDialogDestructiveSource },
      description: {
        story:
          'Abaixo de 40rem o rodapé empilha os botões em column-reverse e o cabeçalho centraliza. Acima disso os botões ficam lado a lado, alinhados à direita.',
      },
    },
  },
  render: () => ({
    props: { labels: destructiveLabels() },
    template: openTemplate(),
  }),
  play: async ({ step }) => {
    const labels = destructiveLabels();

    await step('A janela é estreita, e o rodapé empilha em column-reverse', async () => {
      const panel = await waitForPortal('alertdialog');
      const footer = panel.querySelector<HTMLElement>('.nds-alert-dialog-footer');
      await expect(footer).not.toBeNull();
      // Sem esta premissa, "empilhado" seria afirmar o que a story não produz.
      await expect(window.matchMedia('(min-width: 40rem)').matches).toBe(false);
      await expect(getComputedStyle(footer!).flexDirection).toBe('column-reverse');
    });

    await step('No DOM o Cancelar vem antes da ação; na tela, a ação fica em cima', async () => {
      const panel = await waitForPortal('alertdialog');
      const footer = panel.querySelector<HTMLElement>('.nds-alert-dialog-footer')!;
      const buttons = [...footer.querySelectorAll('button')];
      await expect(buttons.map((b) => b.textContent?.trim())).toEqual([
        labels.cancelLabel,
        labels.actionLabel,
      ]);
      const [cancel, action] = buttons.map((b) => b.getBoundingClientRect());
      await expect(action!.bottom).toBeLessThanOrEqual(cancel!.top + 1);
    });

    await step('O painel respeita a margem lateral da janela', async () => {
      const panel = await waitForPortal('alertdialog');
      const rect = panel.getBoundingClientRect();
      await expect(rect.width).toBeLessThanOrEqual(window.innerWidth);
      await expect(rect.left).toBeGreaterThanOrEqual(0);
    });
  },
};

// A extensibilidade por classe é documentada em props.extensibility, e esta é
// a story que a exercita. O painel é portalado de dentro do template do
// componente: classe posta em <nds-alert-dialog> cairia no host, que fica na
// página — por isso a entrada `panelClass` da raiz.
export const ExtraClass: Story = {
  parameters: {
    docs: {
      source: { transform: alertDialogExtraClassSource },
      description: {
        story:
          'Extensibilidade por classe: o painel recorta o conteúdo no próprio raio e a caixa de mídia deixa de encolher. Painel e peças aceitam classes de layout; largura, respiro e cor vêm do próprio CSS.',
      },
    },
  },
  render: () => ({
    props: { labels: destructiveLabels() },
    template: openTemplate({
      media: true,
      mediaClass: 'nds-shrink-0',
      panelClass: 'nds-overflow-hidden',
    }),
  }),
  play: async ({ step }) => {
    await step('A classe do call site chega ao painel E faz efeito', async () => {
      // As duas pontas: presença sozinha passaria com a classe inerte, e foi
      // assim que o panelClass do Sheet ensinou um botão que não ligava nada.
      const panel = await waitForPortal('alertdialog');
      await expect(panel).toHaveClass(/nds-overflow-hidden/);
      await expect(getComputedStyle(panel).overflow).toBe('hidden');
    });

    await step('A classe base não é substituída pela extra', async () => {
      const panel = await waitForPortal('alertdialog');
      await expect(panel).toHaveClass(/nds-alert-dialog-content/);
    });

    await step('A caixa de mídia também aceita classe, e ela pinta', async () => {
      const panel = await waitForPortal('alertdialog');
      const media = panel.querySelector<HTMLElement>('.nds-alert-dialog-media')!;
      await expect(media).toHaveClass('nds-shrink-0');
      await expect(getComputedStyle(media).flexShrink).toBe('0');
    });
  },
};

export const HeadingH3: Story = {
  parameters: {
    covers: ['accessibility.item2', 'accessibility.item9'],
    docs: {
      source: { transform: alertDialogHeadingH3Source },
      description: {
        story:
          'O painel aberto de dentro de uma página cuja seção já está em h2 pede o título em h3, ' +
          'para não repetir o degrau da hierarquia. Trocar a tag não pode romper o aria-labelledby: ' +
          'o vínculo sai do id real do título, nunca do nível do cabeçalho.',
      },
    },
  },
  render: () => ({
    props: { labels: destructiveLabels() },
    template: openTemplate({ titleTag: 'h3' }),
  }),
  play: async ({ step }) => {
    await step('O título em h3 continua sendo o nome acessível do painel', async () => {
      // A tag é do documento; o vínculo é do id. Consulta pela CLASSE e não por
      // `data-slot`: no Angular o host binding da diretiva disputa o atributo, e
      // a classe é o que existe em todas as stacks.
      const p = await waitForPortal('alertdialog');
      const id = p.getAttribute('aria-labelledby');
      await expect(id).toBeTruthy();
      const heading = document.getElementById(id!);
      await expect(heading).not.toBeNull();
      await expect(heading!.tagName).toBe('H3');
      await expect(heading!.classList.contains('nds-alert-dialog-title')).toBe(true);
      await expect(p).toHaveAccessibleName(heading!.textContent!.trim());
    });
  },
};
