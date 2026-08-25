import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import { Badge, BadgeCounter } from './index';
import { Check } from 'lucide-vue-next';
import { backgroundEffective, ratio } from '@shared/testing/cor';
import {
  badgeWithIconSource,
  badgeAsButtonSource,
  badgeWithCounterSource,
} from './badge.source';

const meta = {
  title: 'UI/Badge/Compositions',
  component: Badge,
  tags: ['feedback'],
  parameters: {
    design: figmaDesign('badge'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: badgeWithIconSource },
      description: {
        component:
          'Configurações contextuais do Badge: combinado com ícone, com contador dentro da própria etiqueta e envolvido em <button> para virar gatilho clicável.',
      },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithIcon: Story = {
  parameters: { covers: ['functional.item5', 'accessibility.item2', 'visual.item3'] },
  render: () => ({
    components: { Badge, Check },
    template: `
      <Badge>
        <Check aria-hidden="true" data-icon="inline-start" />
        Ativo
      </Badge>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Ativo');

    // accessibility.item2 — o ícone é reforço visual: quem nomeia é o texto.
    const icone = badge.querySelector('svg');
    await expect(icone).not.toBeNull();
    await expect(icone).toHaveAttribute('aria-hidden', 'true');
    await expect(badge.textContent?.trim()).toBe('Ativo');

    // functional.item5 — o espaço entre ícone e texto é do container, não uma
    // margem na story: o .nds-badge declara gap, e o data-icon encurta o padding
    // daquele lado. Margem manual somaria ao gap e dobraria o respiro.
    const styles = getComputedStyle(badge);
    await expect(styles.display).toBe('inline-flex');
    await expect(parseFloat(styles.columnGap)).toBeGreaterThan(0);
    await expect(getComputedStyle(icone!).marginRight).toBe('0px');
    await expect(parseFloat(styles.paddingInlineStart)).toBeLessThan(
      parseFloat(styles.paddingInlineEnd),
    );
  },
};

/**
 * Contador DENTRO da etiqueta — a peça `.nds-badge-counter`, que qualquer
 * variante aceita. O número acompanha um rótulo, na mesma caixa: é a única
 * forma de contador que o design system oferece, depois que o contador avulso
 * ao lado de um ícone saiu por dizer a mesma coisa com mais peças.
 */
export const WithCounter: Story = {
  parameters: {
    covers: ['visual.item6'],
    // A do meta mostra o badge com ícone; o assunto aqui é a subparte.
    docs: { source: { transform: badgeWithCounterSource } },
  },
  render: () => ({
    components: { Badge, BadgeCounter },
    template: `
      <Badge variant="destructive">
        Urgente
        <BadgeCounter>12</BadgeCounter>
      </Badge>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText(/Urgente/);
    const counter = badge.querySelector<HTMLElement>('[data-slot="badge-counter"]')!;

    await step('A peça sai com a classe e o slot que a folha desenha', async () => {
      await expect(counter).not.toBeNull();
      await expect(badge.contains(counter)).toBe(true);
      await expect(counter.classList.contains('nds-badge-counter')).toBe(true);
    });

    await step('O número é lido junto do rótulo', async () => {
      // Nada de `aria-hidden` nem de texto por imagem: o contador é conteúdo, e
      // quem ouve a etiqueta ouve "Urgente 12".
      await expect(counter.textContent?.trim()).toBe('12');
      await expect(badge.textContent?.replace(/s+/g, ' ').trim()).toBe('Urgente 12');
      await expect(counter.getAttribute('aria-hidden')).toBeNull();
    });

    await step('O contador fica à DIREITA do texto, não antes dele', async () => {
      // O rótulo é nó de texto solto, sem caixa própria: quem dá o retângulo
      // dele é um Range. Sem isso a comparação seria contra a etiqueta inteira,
      // que contém o contador e sempre "começaria" antes.
      const label = [...badge.childNodes].find(
        (n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim(),
      )!;
      const range = badge.ownerDocument.createRange();
      range.selectNodeContents(label);
      const labelBox = range.getBoundingClientRect();
      await expect(labelBox.width).toBeGreaterThan(0);
      await expect(counter.getBoundingClientRect().left).toBeGreaterThanOrEqual(
        labelBox.right - 1,
      );
    });

    await step('O número alcança 4.5:1 contra o fundo do próprio contador', async () => {
      // A peça é neutra de propósito: pintada com a cor da variante, o número
      // cai abaixo de 4.5:1 em parte dos temas — é o que a folha documenta e o
      // que esta medição impede de voltar.
      const cs = getComputedStyle(counter);
      const background = backgroundEffective(counter);
      await expect(background).not.toBeNull();
      const contrast = ratio(cs.color, background!);
      await expect(contrast).not.toBeNull();
      await expect(contrast!.ratio).toBeGreaterThanOrEqual(4.5);
    });
  },
};

/**
 * A etiqueta como GATILHO clicável — a única forma interativa que restou. O
 * envoltório em `<a>` saiu: as duas composições ensinavam a mesma divisão de
 * papéis, e o que importa aqui é que o badge NÃO vira controle, seja qual for o
 * elemento por fora.
 */
export const AsButton: Story = {
  parameters: {
    covers: ['functional.item6', 'accessibility.item4', 'visual.item4'],
    // Quem é focável é o elemento de FORA: o snippet precisa mostrar o botão em
    // volta, que a do meta não tem.
    docs: { source: { transform: badgeAsButtonSource } },
  },
  render: () => ({
    components: { Badge },
    template: `
      <button
        type="button"
        aria-label="Filtrar por acessibilidade"
        class="nds-cluster nds-rounded-md nds-focus-ring-inset"
      >
        <Badge variant="info">Acessibilidade</Badge>
      </button>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /Filtrar por acessibilidade/i });
    // functional.item6 — o pai recebe o foco e o badge não compete por ele.
    const badge = button.querySelector('[data-slot="badge"]');
    await expect(badge).not.toBeNull();
    await expect(badge!.hasAttribute('tabindex')).toBe(false);
    button.focus();
    await expect(document.activeElement).toBe(button);
  },
};
