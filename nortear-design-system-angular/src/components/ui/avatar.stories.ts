import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, waitFor } from 'storybook/test';
import { NDS_AVATAR, type AvatarSize } from './avatar';
import { NdsAvatarDocs } from '@/components/docs/AvatarDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

/**
 * Placeholder inline: evita rede no teste e mantém a story determinística.
 * Quadrado de propósito — o avatar recorta em círculo e uma imagem retangular
 * esconderia um `object-fit` errado.
 */
export const IMG_AVATAR =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128'%3E%3Crect width='128' height='128' fill='%2394a3b8'/%3E%3C/svg%3E";

/**
 * Imagem que falha de propósito: base64 válido, PNG inválido. O decodificador
 * do navegador dispara `error` sem sair para a rede — um `https://…invalid`
 * dependeria de DNS e tornaria o teste do fallback lento e instável.
 */
export const IMG_QUEBRADA = 'data:image/png;base64,AAAA';

/** Diâmetro de cada preset, em px, na densidade padrão. */
export const DIAMETER: Record<AvatarSize, number> = {
  sm: 24, md: 32, lg: 40, xl: 48, '2xl': 64,
};

type AvatarArgs = {
  src: string;
  alt: string;
  fallback: string;
  size: AvatarSize;
  delayMs: number;
  onStatusChange: (status: string) => void;
};

/** Ver a nota em separator.stories.ts. */
function playgroundSource(_gerado: string, ctx: { args?: Partial<AvatarArgs> }): string {
  const {
    alt = 'Foto de perfil de Maria Rodrigues',
    fallback = 'MR',
    size = 'md',
    delayMs = 600,
  } = ctx.args ?? {};
  // Só o que difere do default entra: snippet que repete valor padrão ensina
  // ruído. `size="md"` é o default do componente.
  const sizeAttr = size === 'md' ? '' : ` size="${size}"`;
  const delay = delayMs ? ` [delayMs]="${delayMs}"` : '';
  return `import { NDS_AVATAR } from '@/components/ui/avatar';

@Component({
  imports: [...NDS_AVATAR],
  template: \`
    <span ndsAvatar${sizeAttr}>
      <img ndsAvatarImage src="/maria.jpg" alt="${alt}" />
      <!-- aria-hidden porque o alt acima já identifica a pessoa:
           sem isso o leitor de tela anuncia o nome duas vezes. -->
      <span ndsAvatarFallback${delay}>${fallback}</span>
    </span>
  \`,
})
export class Exemplo {}`;
}

const meta: Meta<AvatarArgs> = {
  title: 'Primitives/Display/Avatar',
  tags: ['autodocs', 'display'],
  decorators: [moduleMetadata({ imports: [...NDS_AVATAR] })],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(NdsAvatarDocs) },
  },
  argTypes: {
    src: {
      control: 'text',
      description: 'URL da imagem. Vazio faz o carregamento falhar e o fallback ficar.',
    },
    alt: {
      control: 'text',
      description: 'Alternativa textual. Descreve a pessoa, ou vazia se a imagem for decorativa.',
    },
    fallback: {
      control: 'text',
      description: 'Iniciais exibidas enquanto a imagem carrega e quando ela falha.',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', '2xl'],
      description: 'Preset de diâmetro: sm 24, md 32 (padrão), lg 40, xl 48, 2xl 64.',
    },
    delayMs: {
      control: { type: 'number', min: 0, step: 100 },
      description: 'Atraso antes de mostrar o fallback. Evita o piscar das iniciais em imagem rápida.',
    },
    // Sem entrada aqui a função não chega ao template: o renderer Angular só
    // repassa em `props` o que tem argType, e o `(onLoadingStatusChange)`
    // ficaria ligado a nada — sem erro nenhum.
    onStatusChange: { control: false, table: { disable: true } },
  },
  args: {
    src: IMG_AVATAR,
    alt: 'Foto de perfil de Maria Rodrigues',
    fallback: 'MR',
    size: 'md',
    delayMs: 600,
    onStatusChange: fn(),
  },
};

export default meta;
type Story = StoryObj<AvatarArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: playgroundSource } },
    covers: ['functional.item1', 'accessibility.item1', 'accessibility.item4', 'visual.item1'],
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <span ndsAvatar [size]="size">
        <img
          ndsAvatarImage
          [src]="src"
          [alt]="alt"
          (onLoadingStatusChange)="onStatusChange($event)"
        />
        <span ndsAvatarFallback [delayMs]="delayMs">{{ fallback }}</span>
      </span>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="avatar"]')!;

    await step('O preset do control chega ao elemento e vira diâmetro', async () => {
      // Medir, e não só conferir o atributo: `data-size` correto com o CSS
      // ausente passaria igual. E é a medida que prova que o input chegou —
      // sob JIT, `[size]` cairia no default e só a linha de md passaria.
      await expect(root).toHaveAttribute('data-size', args.size);
      const { width, height } = root.getBoundingClientRect();
      await expect(Math.abs(width - DIAMETER[args.size])).toBeLessThan(0.5);
      await expect(Math.abs(height - DIAMETER[args.size])).toBeLessThan(0.5);
    });

    await step('A foto identifica a pessoa pelo alt', async () => {
      const img = canvasElement.querySelector<HTMLImageElement>('[data-slot="avatar-image"]')!;
      await expect(img.alt).toBe(args.alt);
    });

    await step('Carregada a imagem, o fallback sai de cena', async () => {
      const img = canvasElement.querySelector<HTMLImageElement>('[data-slot="avatar-image"]')!;
      const fallback = canvasElement.querySelector<HTMLElement>('[data-slot="avatar-fallback"]')!;
      await waitFor(async () => {
        await expect(img.style.display).toBe('');
        await expect(fallback.style.display).toBe('none');
      }, { timeout: 5000 });
    });

    await step('O status de carregamento chega a quem compõe', async () => {
      // É a contribuição do primitivo: quem monta a tela pode reagir ao ciclo
      // sem instrumentar `load`/`error` na mão.
      await waitFor(async () => {
        await expect(args.onStatusChange).toHaveBeenCalledWith('loaded');
      }, { timeout: 5000 });
    });
  },
};
