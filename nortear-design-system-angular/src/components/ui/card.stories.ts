import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect } from 'storybook/test';
import { NDS_CARD, type CardSize } from './card';
import { NdsButton } from './button';
import { NdsCardDocs } from '@/components/docs/CardDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type CardArgs = {
  size: CardSize;
  title: string;
  description: string;
  content: string;
  withFooter: boolean;
  withAction: boolean;
};

/**
 * Ver a nota em separator.stories.ts. Aqui o andaime é maior: o template tem
 * dois `@if` (rodapé e ação) e cinco bindings de arg. O transform devolve o
 * uso real, com as partes que os controls ligaram.
 */
function playgroundSource(_gerado: string, ctx: { args?: Partial<CardArgs> }): string {
  const {
    size = 'default',
    title = 'Notebook Pro 14',
    description = 'M3 Pro · 18GB · 512GB SSD',
    content = 'Disponível em 3 cores. Entrega em até 5 dias úteis.',
    withFooter = false,
    withAction = false,
  } = ctx.args ?? {};

  const sizeAttr = size === 'default' ? '' : ` size="${size}"`;
  const acao = withAction
    ? `
      <div ndsCardAction>
        <button ndsButton variant="ghost" size="sm">Editar</button>
      </div>`
    : '';
  const rodape = withFooter
    ? `
    <div ndsCardFooter>
      <button ndsButton variant="outline">Cancelar</button>
      <button ndsButton>Salvar</button>
    </div>`
    : '';

  const usaButton = withAction || withFooter;
  const imports = usaButton ? 'NDS_CARD, NdsButton' : 'NDS_CARD';

  return `import { NDS_CARD } from '@/components/ui/card';${
    usaButton ? `\nimport { NdsButton } from '@/components/ui/button';` : ''
  }

@Component({
  imports: [${imports}],
  template: \`
    <div ndsCard${sizeAttr}>
      <div ndsCardHeader>
        <h3 ndsCardTitle>${title}</h3>
        <p ndsCardDescription>${description}</p>${acao}
      </div>
      <div ndsCardContent>${content}</div>${rodape}
    </div>
  \`,
})
export class Exemplo {}`;
}

const meta: Meta<CardArgs> = {
  title: 'UI/Card',
  tags: ['autodocs', 'layout'],
  decorators: [moduleMetadata({ imports: [...NDS_CARD, NdsButton] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsCardDocs) },
  },
  argTypes: {
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'sm'],
      description: 'Tamanho do Card. Propaga padding e tipografia para as partes internas.',
    },
    title: { control: 'text', description: 'Título do Card.' },
    description: { control: 'text', description: 'Texto secundário sob o título.' },
    content: { control: 'text', description: 'Corpo do Card.' },
    withFooter: { control: 'boolean', description: 'Exibe o rodapé com ações.' },
    withAction: { control: 'boolean', description: 'Exibe o slot de ação no canto do header.' },
  },
  args: {
    size: 'default',
    title: 'Notebook Pro 14',
    description: 'M3 Pro · 18GB · 512GB SSD',
    content: 'Disponível em 3 cores. Entrega em até 5 dias úteis.',
    withFooter: false,
    withAction: false,
  },
};

export default meta;
type Story = StoryObj<CardArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: playgroundSource } },
    // accessibility.item6 é 'sem violações axe-core': o addon-a11y roda em toda
    // story, mas o audit só enxerga o critério se alguma story o declarar.
    covers: ['functional.item1', 'functional.item2', 'accessibility.item1', 'accessibility.item6'],
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <div ndsCard [size]="size" class="nds-max-w-md">
        <div ndsCardHeader>
          <h3 ndsCardTitle>{{ title }}</h3>
          <p ndsCardDescription>{{ description }}</p>
          @if (withAction) {
            <div ndsCardAction>
              <button ndsButton variant="ghost" size="sm">Editar</button>
            </div>
          }
        </div>
        <div ndsCardContent>{{ content }}</div>
        @if (withFooter) {
          <div ndsCardFooter>
            <button ndsButton variant="outline">Cancelar</button>
            <button ndsButton>Salvar</button>
          </div>
        }
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('As partes do Card emitem os data-slot esperados', async () => {
      // data-slot é o contrato que story, teste e ferramenta usam para achar as
      // partes sem depender de classe — as cinco stacks emitem os mesmos.
      const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]');
      await expect(card).toBeTruthy();
      await expect(card!.querySelector('[data-slot="card-header"]')).toBeTruthy();
      await expect(card!.querySelector('[data-slot="card-title"]')).toBeTruthy();
      await expect(card!.querySelector('[data-slot="card-description"]')).toBeTruthy();
      await expect(card!.querySelector('[data-slot="card-content"]')).toBeTruthy();
    });

    await step('O markup é <div>, como nas outras stacks', async () => {
      // Diretiva de atributo e não elemento próprio: se alguém trocar por
      // <nds-card>, classe e data-slot continuam certos e só isto acusa.
      const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;
      await expect(card.tagName).toBe('DIV');
    });

    await step('O tamanho escolhido chega ao DOM', async () => {
      const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;
      await expect(card).toHaveAttribute('data-size', args.size);
    });

    await step('O título é um heading de verdade', async () => {
      // O CSS dá aparência de título; quem dá a semântica é o elemento. Buscar
      // por role garante que o leitor de tela também encontra.
      await expect(canvas.getByRole('heading', { name: args.title })).toBeTruthy();
    });
  },
};
