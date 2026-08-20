import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, waitFor } from 'storybook/test';
import { User } from 'lucide';
import {
  createAvatar,
  createAvatarFallback,
  createAvatarRoot,
  createAvatarGroup,
  createAvatarGroupCount,
  createAvatarBadge,
} from './avatar';
import { IMG_MARIA } from './avatar.fixtures';
import {
  avatarEmGrupoSourceCom,
  avatarGranularSourceCom,
  avatarSource,
  avatarSourceCom,
} from './avatar.source';

const IMG_SECOND = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=faces';
const IMG_THIRD = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=160&h=160&fit=crop&crop=faces';

const meta: Meta = {
  tags: ['display'],
  title: 'UI/Avatar/Compositions',
  parameters: {
    design: [figmaDesign('avatar', 'Avatar'), figmaDesign('avatarGroup', 'Grupo')],
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: avatarSource },
      description: {
        component:
          'Composicoes canônicas do Avatar: com imagem, com iniciais, com ícone, agrupamento e com indicador de status.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createUserIconSvg(): SVGSVGElement {
  type LucideIconNode = [string, Record<string, string>];
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  // `.nds-icon-lg` (20px) em vez de style inline: inline vence a folha e sai do
  // tema, da densidade e da escala. A utilitária já existe em utilities.css e
  // era a única stack a usá-la aqui (Angular) — as outras quatro cravavam o
  // valor no atributo `style`.
  svg.setAttribute('class', 'nds-icon-lg');

  for (const [tag, attrs] of User as unknown as LucideIconNode[]) {
    const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
    svg.appendChild(child);
  }
  return svg;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const WithImage: Story = {
  parameters: {
    covers: ['functional.item1', 'accessibility.item1'],
    docs: {
      description: {
        story: 'Avatar com imagem carregada. O fallback fica oculto após o load.',
      },
    },
  },
  render: () => {
    const av = createAvatar({
      src: IMG_MARIA,
      alt: 'Foto de perfil de Maria Rodrigues',
      fallbackText: 'MR',
    });
    return av;
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-slot="avatar"]');
    await expect(root).not.toBeNull();
    // accessibility.item1 — quem identifica a pessoa é o alt da imagem.
    const img = canvasElement.querySelector<HTMLImageElement>('[data-slot="avatar-image"]');
    await expect(img).not.toBeNull();
    await expect(img!.alt).toBe('Foto de perfil de Maria Rodrigues');
    // functional.item1 — carregada a imagem, o fallback sai de cena.
    await waitFor(async () => {
      await expect(img!.style.display).toBe('');
      const fallback = canvasElement.querySelector<HTMLElement>('[data-slot="avatar-fallback"]');
      await expect(fallback!.style.display).toBe('none');
    }, { timeout: 5000 });
  },
};

export const WithInitials: Story = {
  parameters: {
    covers: ['functional.item3', 'accessibility.item3', 'visual.item2'],
    // Override de story: sem `src` o composto monta só o fallback, e com ele
    // saem também o `alt` — não há imagem para descrever.
    docs: {
      source: { transform: avatarSourceCom({ src: '', fallback: 'JP' }) },
      description: {
        story: 'Avatar sem imagem — o fallback com iniciais é exibido imediatamente.',
      },
    },
  },
  // Sem src: o composto monta só o fallback, que é o caminho que a docs page
  // ensina para avatar sem foto.
  render: () => createAvatar({ fallbackText: 'JP' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // functional.item3 — sem imagem, o fallback aparece na hora, sem espera.
    await expect(canvas.getByText('JP')).toBeVisible();
    const root = canvasElement.querySelector('[data-slot="avatar"]');
    await expect(root!.querySelector('img')).toBeNull();
  },
};

export const WithIcon: Story = {
  parameters: {
    covers: ['visual.item2'],
    // Override de story: fallback que não é texto só existe pelas fábricas
    // granulares — o composto recebe iniciais, não elementos.
    docs: {
      source: { transform: avatarGranularSourceCom({ iconLabel: 'Usuário genérico' }) },
      description: {
        story: 'Fallback com ícone genérico (User) para usuário anônimo ou placeholder.',
      },
    },
  },
  render: () => {
    const root = createAvatarRoot();
    const fallback = createAvatarFallback();
    // role="img" permite aria-label (senão axe aponta aria-prohibited-attr no <span>).
    fallback.setAttribute('role', 'img');
    fallback.setAttribute('aria-label', 'Usuário genérico');
    fallback.appendChild(createUserIconSvg());
    root.appendChild(fallback);
    return root;
  },

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // O nome acessível vem do rótulo, não do ícone: svg decorativo não fala.
    const fallback = canvas.getByRole('img', { name: /Usuário genérico/i });
    await expect(fallback).toBeVisible();
    const icone = fallback.querySelector('svg');
    await expect(icone).not.toBeNull();
    await expect(icone).toHaveAttribute('aria-hidden', 'true');
  },
};

export const Group: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item4'],
    // Override de story: a fila é composta por três fábricas, e o contador é o
    // último item dela — outra FORMA de snippet.
    docs: {
      source: { transform: avatarEmGrupoSourceCom({ label: 'Participantes', excedente: '+3' }) },
      description: {
        story:
          'Avatares sobrepostos com o contador do excedente fechando a fila. O recuo e a borda saem de <code>.nds-avatar-group</code>.',
      },
    },
  },
  render: () => {
    const grupo = createAvatarGroup({ label: 'Participantes' });

    for (const src of [IMG_MARIA, IMG_SECOND, IMG_THIRD]) {
      const av = createAvatar({ src, alt: '', fallbackText: '' });
      grupo.appendChild(av);
    }
    const contador = createAvatarGroupCount({ text: '+3' });
    contador.setAttribute('aria-hidden', 'true');
    grupo.appendChild(contador);

    return grupo;
  },

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const grupo = canvas.getByRole('group', { name: /Participantes/i });
    const avatares = Array.from(grupo.querySelectorAll('[data-slot="avatar"]'));
    await expect(avatares.length).toBe(3);

    // functional.item5 — a sobreposição é o que a composição promete. Medir a
    // posição prova o recuo; antes o grupo era montado com estilo inline na
    // story e a play só contava botões, que não existem aqui.
    const primeiro = avatares[0].getBoundingClientRect();
    const segundo = avatares[1].getBoundingClientRect();
    await expect(segundo.left).toBeLessThan(primeiro.right);

    // O contador fecha a fila e sobrepõe igual.
    const contador = grupo.querySelector('[data-slot="avatar-group-count"]');
    await expect(contador).not.toBeNull();
    await expect(contador!.textContent).toBe('+3');
    const rc = contador!.getBoundingClientRect();
    await expect(rc.left).toBeLessThan(avatares[2].getBoundingClientRect().right);
  },
};

export const WithStatus: Story = {
  parameters: {
    covers: ['visual.item4'],
    // Override de story: o ponto de status é uma sub-fábrica que entra como
    // filho do root, e é ela o assunto.
    docs: {
      source: { transform: avatarSourceCom({ status: 'Online', src: IMG_MARIA }) },
      description: {
        story:
          'Avatar com indicador de status. O ponto é filho do root — <code>.nds-avatar-badge</code> o posiciona no canto e acompanha o tamanho do avatar.',
      },
    },
  },
  render: () => {
    const avatar = createAvatar({
      src: IMG_MARIA,
      alt: 'Foto de perfil de Maria Rodrigues',
      fallbackText: 'MR',
    });
    avatar.appendChild(createAvatarBadge({ label: 'Online' }));
    return avatar;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByRole('img', { name: /Online/i });
    const root = canvasElement.querySelector('[data-slot="avatar"]')!;

    const rb = badge.getBoundingClientRect();
    const rr = root.getBoundingClientRect();
    await expect(rb.width).toBeGreaterThan(0);
    // Canto inferior direito, dentro do avatar.
    await expect(Math.abs(rb.right - rr.right)).toBeLessThan(2);
    await expect(Math.abs(rb.bottom - rr.bottom)).toBeLessThan(2);

    // elementFromPoint e não getBoundingClientRect sozinho: recorte não muda
    // layout. Enquanto o root tinha overflow:hidden, o ponto ficava com a caixa
    // certa e sem pintura nenhuma — invisível, e nenhuma medida acusava.
    const alvo = document.elementFromPoint(rb.left + rb.width / 2, rb.top + rb.height / 2);
    await expect(badge.contains(alvo)).toBe(true);
  },
};
