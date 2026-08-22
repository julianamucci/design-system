import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import { Badge } from './index';
import BadgeStory from './BadgeStory.svelte';
import {
  badgeComIconeSource,
  badgeContadorSource,
  badgeEmBotaoSource,
  badgeEmLinkSource,
  badgeSource,
} from './badge.source';

const meta: Meta = {
  title: 'UI/Badge/Compositions',
  component: Badge,
  tags: ['feedback'],
  parameters: {
    design: figmaDesign('badge'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      // Cascateia como piso; as quatro composições sobrescrevem com a marcação
      // que cada uma ensina.
      source: { transform: badgeSource },
      description: {
        component:
          'Configuracoes contextuais do Badge: combinado com ícone, como contador numérico, envolvido em <a> para navegação ou em <button> para trigger clicável.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const WithIcon: Story = {
  parameters: {
    covers: ['functional.item5', 'accessibility.item2', 'visual.item3'],
    docs: { source: { transform: badgeComIconeSource } },
  },
  render: () => ({
    Component: BadgeStory,
    props: { caso: 'comIcone', variant: 'default', label: 'Ativo' },
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
    const estilo = getComputedStyle(badge);
    await expect(estilo.display).toBe('inline-flex');
    await expect(parseFloat(estilo.columnGap)).toBeGreaterThan(0);
    await expect(getComputedStyle(icone!).marginRight).toBe('0px');
    await expect(parseFloat(estilo.paddingInlineStart)).toBeLessThan(
      parseFloat(estilo.paddingInlineEnd),
    );
  },
};

export const CountBadge: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: { source: { transform: badgeContadorSource } },
  },
  render: () => ({
    Component: BadgeStory,
    props: {
      caso: 'contador',
      variant: 'destructive',
      label: '12',
      ariaLabel: '12 notificações não lidas',
    },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // O contador fica AO LADO do sino, como a documentação descreve — e não
    // sobreposto: as classes de deslocamento usadas antes eram do Tailwind, que
    // saiu do projeto, então o badge nunca chegou a subir para o canto.
    const status = canvas.getByRole('status', { name: /12 notificações não lidas/i });
    const badge = canvas.getByText('12');
    const sino = status.querySelector('svg')!;
    await expect(status.contains(badge)).toBe(true);
    await expect(sino.getBoundingClientRect().right).toBeLessThanOrEqual(
      badge.getBoundingClientRect().left + 1,
    );
    // Quem carrega o significado é o rótulo do container: "12" sozinho não diz
    // do que é a contagem.
    await expect(badge).toHaveAttribute('data-slot', 'badge');
  },
};

export const AsLink: Story = {
  parameters: {
    covers: ['functional.item6', 'accessibility.item4', 'visual.item4'],
    docs: { source: { transform: badgeEmLinkSource } },
  },
  render: () => ({
    Component: BadgeStory,
    props: {
      caso: 'link',
      variant: 'secondary',
      label: 'Design',
      ariaLabel: 'Ver todos os itens da categoria Design',
    },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link', { name: /Ver todos os itens da categoria Design/i });
    // accessibility.item4 — quem é focável é o link; o badge fica decorativo
    // dentro dele, que é exatamente o que a documentação pede.
    const badge = link.querySelector('[data-slot="badge"]');
    await expect(badge).not.toBeNull();
    await expect(badge!.hasAttribute('tabindex')).toBe(false);
    link.focus();
    await expect(document.activeElement).toBe(link);
  },
};

export const AsButton: Story = {
  parameters: {
    covers: ['functional.item6', 'accessibility.item4', 'visual.item4'],
    docs: { source: { transform: badgeEmBotaoSource } },
  },
  render: () => ({
    Component: BadgeStory,
    props: {
      caso: 'botao',
      variant: 'outline',
      label: 'React',
      ariaLabel: 'Filtrar por React',
    },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const botao = canvas.getByRole('button', { name: /Filtrar por React/i });
    // functional.item6 — o pai recebe o foco e o badge não compete por ele.
    const badge = botao.querySelector('[data-slot="badge"]');
    await expect(badge).not.toBeNull();
    await expect(badge!.hasAttribute('tabindex')).toBe(false);
    botao.focus();
    await expect(document.activeElement).toBe(botao);
  },
};
