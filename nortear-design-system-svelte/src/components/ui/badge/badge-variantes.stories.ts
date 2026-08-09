import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import { Badge } from './index';
import BadgeStory from './BadgeStory.svelte';
import BadgeSemanticasStory from './BadgeSemanticasStory.svelte';

const meta: Meta = {
  title: 'UI/Badge/Variantes',
  component: Badge,
  tags: ['feedback'],
  parameters: {
    design: figmaDesign('badge'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Cada variante do Badge reflete um nível de hierarquia visual: default destaca, secondary informa, destructive alerta e outline oferece baixa ênfase.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * O que a variante promete é o desenho, e desenho se mede: cor de fundo, cor de
 * texto e borda. As plays antigas só perguntavam se algo tinha renderizado —
 * passavam com as quatro variantes idênticas.
 */
const pintura = (el: HTMLElement) => {
  const s = getComputedStyle(el);
  return {
    fundo: s.backgroundColor,
    texto: s.color,
    borda: s.borderTopColor,
    larguraBorda: s.borderTopWidth,
  };
};
const transparente = (cor: string) => cor === 'rgba(0, 0, 0, 0)' || cor === 'transparent';

export const Default: Story = {
  parameters: { covers: ['functional.item1', 'visual.item2'] },
  render: () => ({ Component: BadgeStory, props: { variant: 'default', label: 'Novo' } }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Novo');
    await expect(badge).toHaveAttribute('data-variant', 'default');
    // functional.item1 — fundo preenchido, texto contrastante, borda invisível.
    const { fundo, texto, borda } = pintura(badge);
    await expect(transparente(fundo)).toBe(false);
    await expect(fundo).not.toBe(texto);
    await expect(transparente(borda)).toBe(true);
  },
};

export const Secondary: Story = {
  parameters: { covers: ['functional.item2', 'visual.item2'] },
  render: () => ({ Component: BadgeStory, props: { variant: 'secondary', label: 'Beta' } }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Beta');
    await expect(badge).toHaveAttribute('data-variant', 'secondary');
    // functional.item2 — preenchida como a default, mas em outra cor: é isso
    // que faz a hierarquia entre as duas existir.
    const { fundo, borda } = pintura(badge);
    await expect(transparente(fundo)).toBe(false);
    await expect(transparente(borda)).toBe(true);

    const referencia = document.createElement('span');
    referencia.className = 'nds-badge nds-badge-default';
    canvasElement.appendChild(referencia);
    const fundoDefault = getComputedStyle(referencia).backgroundColor;
    referencia.remove();
    await expect(fundo).not.toBe(fundoDefault);
  },
};

export const Destructive: Story = {
  parameters: { covers: ['functional.item3', 'accessibility.item3', 'visual.item2'] },
  render: () => ({ Component: BadgeStory, props: { variant: 'destructive', label: 'Urgente' } }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Urgente');
    await expect(badge).toHaveAttribute('data-variant', 'destructive');
    // functional.item3 — fundo suave E borda colorida, com o texto no
    // --foreground. É a combinação que sustenta os 4.5:1 documentados: cor
    // sinaliza, contraste vem do texto neutro.
    const { fundo, texto, borda } = pintura(badge);
    await expect(transparente(fundo)).toBe(false);
    await expect(transparente(borda)).toBe(false);

    const referencia = document.createElement('span');
    referencia.className = 'nds-badge nds-badge-outline';
    canvasElement.appendChild(referencia);
    const textoNeutro = getComputedStyle(referencia).color;
    referencia.remove();
    await expect(texto).toBe(textoNeutro);
  },
};

export const Outline: Story = {
  parameters: { covers: ['functional.item4', 'visual.item2'] },
  render: () => ({ Component: BadgeStory, props: { variant: 'outline', label: 'Rascunho' } }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Rascunho');
    await expect(badge).toHaveAttribute('data-variant', 'outline');
    // functional.item4 — só borda: sem fundo é o que a diferencia das outras.
    const { fundo, borda, larguraBorda } = pintura(badge);
    await expect(transparente(fundo)).toBe(true);
    await expect(transparente(borda)).toBe(false);
    await expect(parseFloat(larguraBorda)).toBeGreaterThan(0);
  },
};

/**
 * As três semânticas numa story só: o que elas prometem não é cada uma isolada,
 * e sim serem DISTINGUÍVEIS entre si. Uma por story deixaria passar o erro mais
 * provável — copiar o bloco do destructive e esquecer de trocar o token, que é
 * como as três nasceriam iguais.
 */
export const Semanticas: Story = {
  parameters: {
    covers: ['functional.item7', 'visual.item5', 'accessibility.item3'],
    docs: {
      description: {
        story:
          'warning avisa, success confirma e info contextualiza. As três existiam no CSS como -high, -medium e -low, servindo só à tabela de prioridade das docs pages.',
      },
    },
  },
  render: () => ({ Component: BadgeSemanticasStory }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badges = {
      warning: canvas.getByText('Vence hoje'),
      success: canvas.getByText('Aprovado'),
      info: canvas.getByText('Novidade'),
    };

    // O texto neutro é medido de uma referência viva, e não cravado em rgb():
    // trocar o tema não pode reprovar o teste, mas trocar a REGRA pode.
    const referencia = document.createElement('span');
    referencia.className = 'nds-badge nds-badge-outline';
    canvasElement.appendChild(referencia);
    const textoNeutro = getComputedStyle(referencia).color;
    referencia.remove();

    const fundos: string[] = [];
    for (const [nome, badge] of Object.entries(badges)) {
      await expect(badge).toHaveAttribute('data-variant', nome);
      const { fundo, texto, borda } = pintura(badge);
      // functional.item7 — cor vem do fundo e da borda; o texto fica neutro,
      // que é o que sustenta 4.5:1 sem depender da variante escolhida.
      await expect(transparente(fundo)).toBe(false);
      await expect(transparente(borda)).toBe(false);
      await expect(texto).toBe(textoNeutro);
      fundos.push(fundo);
    }

    // Três cores, e não três nomes para a mesma: sem isto, copiar o bloco do
    // destructive nas três passaria.
    await expect(new Set(fundos).size).toBe(3);
  },
};
