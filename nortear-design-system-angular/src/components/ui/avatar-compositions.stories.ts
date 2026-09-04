import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, waitFor } from 'storybook/test';
import { NDS_AVATAR } from './avatar';
import { IMG_AVATAR } from './avatar.stories';

const meta: Meta = {
  title: 'Components/Display/Avatar/Compositions',
  tags: ['display'],
  decorators: [moduleMetadata({ imports: [...NDS_AVATAR] })],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composições canônicas do Avatar: com foto, com iniciais, com ícone genérico, em fila sobreposta e com indicador de status.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const WithPhoto: Story = {
  parameters: {
    covers: ['functional.item1', 'accessibility.item1'],
    docs: {
      description: {
        story: 'Foto com alternativa textual descritiva. O fallback fica oculto depois do load.',
      },
    },
  },
  render: () => ({
    props: { src: IMG_AVATAR },
    template: `
      <span ndsAvatar size="lg">
        <img ndsAvatarImage [src]="src" alt="Foto de perfil de Maria Rodrigues" />
        <span ndsAvatarFallback>MR</span>
      </span>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const img = canvasElement.querySelector<HTMLImageElement>('[data-slot="avatar-image"]')!;
    const fallback = canvasElement.querySelector<HTMLElement>('[data-slot="avatar-fallback"]')!;

    await step('Quem identifica a pessoa é a alternativa textual da foto', async () => {
      await expect(img.alt).toBe('Foto de perfil de Maria Rodrigues');
    });

    await step('As iniciais não são anunciadas junto', async () => {
      // Sem duplicação de voz, e sem aria-hidden: com a foto na tela o
      // componente já tira o fallback da árvore de acessibilidade, então o
      // atributo não evitava nada — e deixava o avatar MUDO no estado em que o
      // fallback é o único conteúdo. Ver a story Failed.
      await waitFor(async () => {
        await expect(getComputedStyle(fallback).display).toBe('none');
      }, { timeout: 5000 });
    });

    await step('Carregada a foto, o fallback sai de cena', async () => {
      await waitFor(async () => {
        await expect(img.style.display).toBe('');
        await expect(fallback.style.display).toBe('none');
      }, { timeout: 5000 });
    });
  },
};

export const WithInitials: Story = {
  parameters: {
    covers: ['functional.item3', 'accessibility.item3', 'visual.item2'],
    docs: {
      description: {
        story: 'Sem foto — duas letras maiúsculas, exibidas de imediato.',
      },
    },
  },
  render: () => ({
    template: `
      <span ndsAvatar size="lg">
        <span ndsAvatarFallback>JP</span>
      </span>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('As iniciais aparecem sem espera e sem imagem no DOM', async () => {
      await expect(canvas.getByText('JP')).toBeVisible();
      await expect(canvasElement.querySelector('img')).toBeNull();
    });

    await step('O fallback ocupa o círculo inteiro', async () => {
      // Se `.nds-avatar-fallback` sumisse, o texto continuaria na tela — só que
      // sem fundo e desalinhado. A medida é o que separa os dois casos.
      const root = canvasElement.querySelector<HTMLElement>('[data-slot="avatar"]')!;
      const fallback = canvasElement.querySelector<HTMLElement>('[data-slot="avatar-fallback"]')!;
      const rr = root.getBoundingClientRect();
      const rf = fallback.getBoundingClientRect();
      await expect(Math.abs(rf.width - rr.width)).toBeLessThan(0.5);
      await expect(Math.abs(rf.height - rr.height)).toBeLessThan(0.5);
    });
  },
};

export const WithIcon: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      description: {
        story:
          'Ícone genérico no lugar das iniciais, para usuário anônimo. O nome acessível vem do rótulo do fallback: um desenho decorativo não fala.',
      },
    },
  },
  render: () => ({
    // role="img" no fallback permite o aria-label — num <span> sem papel, o axe
    // acusa aria-prohibited-attr.
    template: `
      <span ndsAvatar size="lg">
        <span ndsAvatarFallback role="img" aria-label="Usuário genérico">
          <svg ndsAvatarIcon></svg>
        </span>
      </span>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O fallback tem nome acessível e o desenho não', async () => {
      const fallback = canvas.getByRole('img', { name: /Usuário genérico/i });
      await expect(fallback).toBeVisible();
      const icone = fallback.querySelector('svg')!;
      await expect(icone).toHaveAttribute('aria-hidden', 'true');
    });

    await step('O ícone é desenhado, não é um SVG vazio', async () => {
      // Os filhos vêm de `createElementNS` num effect; um effect que não roda
      // deixa um <svg> com caixa certa e nada dentro.
      const icone = canvasElement.querySelector<SVGSVGElement>('svg')!;
      await expect(icone.childElementCount).toBeGreaterThan(0);
      await expect(icone.getBoundingClientRect().width).toBeGreaterThan(0);
    });
  },
};

export const Group: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item4'],
    docs: {
      description: {
        story:
          'Fila de avatares sobrepostos com o contador do excedente fechando a linha. O recuo e a borda saem do container de grupo — empilhar na mão perderia os dois.',
      },
    },
  },
  render: () => ({
    props: { src: IMG_AVATAR },
    template: `
      <div ndsAvatarGroup role="group" aria-label="Participantes">
        <span ndsAvatar>
          <img ndsAvatarImage [src]="src" alt="" />
          <span ndsAvatarFallback>MR</span>
        </span>
        <span ndsAvatar>
          <img ndsAvatarImage [src]="src" alt="" />
          <span ndsAvatarFallback>JP</span>
        </span>
        <span ndsAvatar>
          <span ndsAvatarFallback>AS</span>
        </span>
        <div ndsAvatarGroupCount aria-hidden="true">+3</div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group', { name: /Participantes/i });
    const avatares = [...group.querySelectorAll<HTMLElement>('[data-slot="avatar"]')];

    await step('Os três avatares se sobrepõem', async () => {
      await expect(avatares).toHaveLength(3);
      // Medir a posição é o que prova o recuo: sem a regra do grupo, os
      // avatares ficariam encostados e nada mais mudaria na tela.
      const first = avatares[0].getBoundingClientRect();
      const segundo = avatares[1].getBoundingClientRect();
      await expect(segundo.left).toBeLessThan(first.right);
    });

    await step('O contador fecha a fila e sobrepõe igual', async () => {
      const counter = group.querySelector<HTMLElement>('[data-slot="avatar-group-count"]')!;
      await expect(counter.textContent?.trim()).toBe('+3');
      const rc = counter.getBoundingClientRect();
      await expect(rc.left).toBeLessThan(avatares[2].getBoundingClientRect().right);
      await expect(Math.abs(rc.width - avatares[2].getBoundingClientRect().width)).toBeLessThan(0.5);
    });
  },
};

export const WithStatus: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      description: {
        story:
          'Indicador de status como filho do avatar. O CSS o posiciona no canto e o faz acompanhar o diâmetro — não é preciso wrapper posicionado.',
      },
    },
  },
  render: () => ({
    props: { src: IMG_AVATAR },
    template: `
      <span ndsAvatar size="lg">
        <img ndsAvatarImage [src]="src" alt="Foto de perfil de Maria Rodrigues" />
        <span ndsAvatarFallback>MR</span>
        <span ndsAvatarBadge role="img" aria-label="online"></span>
      </span>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByRole('img', { name: /online/i });
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="avatar"]')!;

    await step('O ponto fica no canto inferior direito, dentro do avatar', async () => {
      const rb = badge.getBoundingClientRect();
      const rr = root.getBoundingClientRect();
      await expect(rb.width).toBeGreaterThan(0);
      await expect(Math.abs(rb.right - rr.right)).toBeLessThan(2);
      await expect(Math.abs(rb.bottom - rr.bottom)).toBeLessThan(2);
    });

    await step('E está de fato pintado, não recortado pelo círculo', async () => {
      // Recorte não muda layout: enquanto o root teve `overflow: hidden`, o
      // ponto ficava com a caixa certa e sem pintura nenhuma.
      const rb = badge.getBoundingClientRect();
      const target = document.elementFromPoint(rb.left + rb.width / 2, rb.top + rb.height / 2);
      await expect(badge.contains(target)).toBe(true);
    });

    await step('O estado não é comunicado só por cor', async () => {
      await expect(badge).toHaveAttribute('aria-label', 'online');
    });
  },
};
