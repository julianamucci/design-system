import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, waitFor } from 'storybook/test';
import { NDS_AVATAR } from './avatar';
import { IMG_AVATAR, IMG_QUEBRADA } from './avatar.stories';

const meta: Meta = {
  title: 'UI/Avatar/States',
  tags: ['display'],
  decorators: [moduleMetadata({ imports: [...NDS_AVATAR] })],
  parameters: {
    layout: 'centered',
    // Sem argTypes nesta story: o painel Controls ficaria vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Configurações do Avatar ao longo do ciclo de carregamento da imagem: carregada, aguardando o atraso, falhou e sem imagem. Quem mantém esse estado é o componente — a página só compõe.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Loaded: Story = {
  parameters: {
    covers: ['functional.item1', 'visual.item1'],
    docs: {
      description: { story: 'Imagem válida — a foto entra e o fallback sai de cena.' },
    },
  },
  render: () => ({
    props: { src: IMG_AVATAR },
    template: `
      <span ndsAvatar>
        <img ndsAvatarImage [src]="src" alt="Foto de perfil de Maria Rodrigues" />
        <span ndsAvatarFallback>MR</span>
      </span>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Depois do load, quem está na tela é a foto', async () => {
      const img = canvasElement.querySelector<HTMLImageElement>('[data-slot="avatar-image"]')!;
      const fallback = canvasElement.querySelector<HTMLElement>('[data-slot="avatar-fallback"]')!;
      await waitFor(async () => {
        await expect(img.style.display).toBe('');
        await expect(fallback.style.display).toBe('none');
      }, { timeout: 5000 });
    });

    await step('E é a foto que está pintada no centro do círculo', async () => {
      // Medida de caixa não bastaria: o fallback escondido continua com a mesma
      // caixa. Quem responde por um ponto é o que o leitor de fato vê.
      const root = canvasElement.querySelector<HTMLElement>('[data-slot="avatar"]')!;
      const r = root.getBoundingClientRect();
      const alvo = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      await expect(alvo && alvo.closest('[data-slot="avatar-image"]')).not.toBeNull();
    });
  },
};

export const AwaitingDelay: Story = {
  name: 'Loading (delayed)',
  parameters: {
    covers: ['functional.item4'],
    docs: {
      description: {
        story:
          'Dois avatares com a mesma imagem que falha: o da esquerda sem atraso, o da direita com atraso longo. É a comparação lado a lado que mostra o que o atraso faz — segurar as iniciais para elas não piscarem em conexão rápida.',
      },
    },
  },
  render: () => ({
    props: { src: IMG_QUEBRADA },
    // 2000ms e não os 600 do guia: o prazo curto vence antes de a asserção
    // rodar e a janela que a story existe para mostrar não seria observável.
    template: `
      <div class="nds-cluster" data-spacing="lg">
        <span ndsAvatar data-testid="sem-atraso">
          <img ndsAvatarImage [src]="src" alt="" />
          <span ndsAvatarFallback>MR</span>
        </span>
        <span ndsAvatar data-testid="com-atraso">
          <img ndsAvatarImage [src]="src" alt="" />
          <span ndsAvatarFallback [delayMs]="2000">JP</span>
        </span>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const noDelay = canvasElement
      .querySelector<HTMLElement>('[data-testid="sem-atraso"] [data-slot="avatar-fallback"]')!;
    const withDelay = canvasElement
      .querySelector<HTMLElement>('[data-testid="com-atraso"] [data-slot="avatar-fallback"]')!;

    await step('Sem atraso, as iniciais entram de imediato', async () => {
      await waitFor(async () => {
        await expect(noDelay.style.display).toBe('');
      }, { timeout: 3000 });
    });

    await step('Com atraso, elas ainda não estão lá', async () => {
      // A asserção é relativa, no mesmo instante: se `[delayMs]` não chegasse ao
      // componente — o defeito silencioso do JIT — os dois estariam visíveis
      // aqui e esta linha cairia.
      await expect(withDelay.style.display).toBe('none');
    });

    await step('Vencido o prazo, elas entram', async () => {
      await waitFor(async () => {
        await expect(withDelay.style.display).toBe('');
      }, { timeout: 5000 });
    });
  },
};

export const Failed: Story = {
  parameters: {
    covers: ['functional.item2', 'accessibility.item2'],
    docs: {
      description: {
        story: 'Imagem que não carrega — o fallback fica permanentemente, e a foto não entra.',
      },
    },
  },
  render: () => ({
    props: { src: IMG_QUEBRADA },
    template: `
      <span ndsAvatar>
        <img ndsAvatarImage [src]="src" alt="Foto de perfil de Maria Rodrigues" />
        <span ndsAvatarFallback>MR</span>
      </span>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('As iniciais aparecem no lugar da foto', async () => {
      await waitFor(async () => {
        await expect(canvas.getByText('MR')).toBeVisible();
      }, { timeout: 5000 });
    });

    await step('E a foto não está pintada por cima', async () => {
      const root = canvasElement.querySelector<HTMLElement>('[data-slot="avatar"]')!;
      const r = root.getBoundingClientRect();
      const alvo = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      await expect(alvo && alvo.closest('[data-slot="avatar-image"]')).toBeNull();
    });

    await step('As iniciais continuam legíveis para o leitor de tela', async () => {
      // Com a foto fora, o fallback é o ÚNICO conteúdo do avatar. Marcá-lo com
      // aria-hidden (que a regra antiga do conteúdo compartilhado mandava
      // fazer) deixava o avatar sem nome acessível nenhum. Medido pela sonda
      // nas cinco stacks.
      const fallback = canvasElement.querySelector<HTMLElement>('[data-slot="avatar-fallback"]')!;
      await expect(fallback).not.toHaveAttribute('aria-hidden', 'true');
      await expect(fallback).toHaveTextContent('MR');
    });
  },
};

export const WithoutImage: Story = {
  parameters: {
    covers: ['functional.item3'],
    docs: {
      description: {
        story: 'Sem elemento de imagem — o fallback aparece na hora, sem tentativa de carregamento.',
      },
    },
  },
  render: () => ({
    template: `
      <span ndsAvatar>
        <span ndsAvatarFallback>JP</span>
      </span>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O fallback é imediato e não há imagem no DOM', async () => {
      await expect(canvas.getByText('JP')).toBeVisible();
      await expect(canvasElement.querySelector('img')).toBeNull();
    });
  },
};
