import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { NdsResizable, NdsResizablePanel, NdsResizableHandle, type ResizableDirection } from './resizable';
import { NdsResizableDocs } from '@/components/docs/ResizableDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

/**
 * Rótulo do punho repetido nas stories.
 *
 * O aria-label é o nome acessível de um `role="separator"` focável — sem ele o
 * leitor de tela anuncia "separador" e nada mais. E ele diz o ATALHO, porque a
 * alternativa ao arrasto não tem nenhuma pista visual.
 */
const LABEL_HANDLE = 'Redimensionar painéis — use as setas para ajustar';

type ResizableArgs = {
  direction: ResizableDirection;
  withHandle: boolean;
  defaultSize: number;
  minSize: number;
};

/**
 * O painel Code imprime o `template` da story literalmente — com a caixa da
 * demo e os bindings nos args, que não é o que a pessoa deve escrever. Ver a
 * nota em `separator.stories.ts`.
 */
function playgroundSource(_gerado: string, ctx: { args?: Partial<ResizableArgs> }): string {
  const {
    direction = 'horizontal',
    withHandle = true,
    defaultSize = 30,
    minSize = 20,
  } = ctx.args ?? {};

  return `import { NdsResizable, NdsResizablePanel, NdsResizableHandle } from '@/components/ui/resizable';

@Component({
  imports: [NdsResizable, NdsResizablePanel, NdsResizableHandle],
  template: \`
    <div ndsResizable direction="${direction}" class="nds-min-h-50" (layout)="aoLayout($event)">
      <div ndsResizablePanel [defaultSize]="${defaultSize}" [minSize]="${minSize}" [maxSize]="60">
        <!-- Painel inicial -->
      </div>

      <div
        ndsResizableHandle
        ${withHandle ? '[withHandle]="true"\n        ' : ''}aria-label="${LABEL_HANDLE}"
      ></div>

      <div ndsResizablePanel [defaultSize]="${100 - defaultSize}" [minSize]="${minSize}">
        <!-- Painel seguinte -->
      </div>
    </div>
  \`,
})
export class Exemplo {
  aoLayout(tamanhos: number[]): void {
    // Porcentagens finais, uma emissão por gesto — não uma por pixel.
    console.log(tamanhos);
  }
}`;
}

const meta: Meta<ResizableArgs> = {
  title: 'UI/Resizable',
  tags: ['autodocs', 'layout'],
  decorators: [moduleMetadata({ imports: [NdsResizable, NdsResizablePanel, NdsResizableHandle] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsResizableDocs) },
  },
  argTypes: {
    direction: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
      description: 'Split lateral (horizontal) ou empilhado (vertical).',
    },
    withHandle: {
      control: 'boolean',
      description: 'Mostra o pegador visual centralizado no divisor.',
    },
    defaultSize: {
      control: { type: 'range', min: 20, max: 60, step: 5 },
      description: 'Tamanho inicial do primeiro painel, em porcentagem.',
    },
    minSize: {
      control: { type: 'range', min: 10, max: 40, step: 5 },
      description: 'Tamanho mínimo de cada painel, em porcentagem.',
    },
  },
  args: { direction: 'horizontal', withHandle: true, defaultSize: 30, minSize: 20 },
};

export default meta;
type Story = StoryObj<ResizableArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: playgroundSource } },
    covers: [
      'functional.item2',
      'accessibility.item1',
      'accessibility.item4',
      'accessibility.item5',
    ],
  },
  render: (args) => ({
    props: { ...args, label: LABEL_HANDLE },
    template: `
      <div ndsResizable [direction]="direction" class="nds-min-h-50 nds-w-full">
        <div ndsResizablePanel [defaultSize]="defaultSize" [minSize]="minSize" [maxSize]="60">
          <div class="nds-p-4">
            <p class="nds-text-body nds-font-semibold nds-m-0">Sidebar</p>
            <p class="nds-text-caption nds-text-muted-foreground nds-mt-1">Navegação do projeto</p>
          </div>
        </div>

        <div ndsResizableHandle [withHandle]="withHandle" [attr.aria-label]="label"></div>

        <div ndsResizablePanel [minSize]="minSize">
          <div class="nds-p-4">
            <p class="nds-text-body nds-font-semibold nds-m-0">Conteúdo principal</p>
            <p class="nds-text-caption nds-text-muted-foreground nds-mt-1">
              Arraste o divisor ou use as setas com ele focado.
            </p>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const punho = canvas.getByRole('separator', { name: LABEL_HANDLE });
    const panels = [...canvasElement.querySelectorAll<HTMLElement>('.nds-resizable-panel')];

    await step('O divisor é um separator com nome e valor', async () => {
      // accessibility.item4 e item5 — `getByRole` acima já falharia sem papel ou
      // sem nome. Aqui fica o valor, que é o que um separator FOCÁVEL precisa
      // ter para o leitor de tela anunciar o tamanho ao mover.
      await expect(punho).toHaveAttribute('aria-orientation', args.direction === 'horizontal' ? 'vertical' : 'horizontal');
      await expect(punho).toHaveAttribute('aria-valuemin', String(args.minSize));
      // Derivado do painel, e não do arg: `aria-valuenow` só serve se for o
      // tamanho REAL do painel anterior — anunciar o valor declarado seria
      // mentir assim que qualquer limite entrasse em ação.
      await expect(panels).toHaveLength(2);
      const ofPanel = Number(panels[0].style.getPropertyValue('--panel-size'));
      await expect(Number(punho.getAttribute('aria-valuenow'))).toBe(Math.round(ofPanel));
    });

    await step('O tamanho declarado chega ao painel pela custom property', async () => {
      // A porcentagem é consumida pelo CSS (`flex-grow: var(--panel-size)`).
      // Escrever largura inline aqui tiraria a medida do tema e da densidade.
      await expect(Number(panels[0].style.getPropertyValue('--panel-size'))).toBeCloseTo(
        args.defaultSize,
        1,
      );
      // E a medida resultante segue a proporção pedida — custom property certa
      // com o CSS ausente passaria na asserção acima e desenharia errado.
      const a = panels[0].getBoundingClientRect().width;
      const b = panels[1].getBoundingClientRect().width;
      await expect(a / (a + b)).toBeCloseTo(args.defaultSize / 100, 1);
    });

    await step('As setas movem o divisor — o equivalente por teclado do arrasto', async () => {
      // functional.item2. É a razão de o componente existir num design system:
      // sem isto, ajustar o layout seria um gesto de arrasto sem alternativa
      // (WCAG 2.1.1 e 2.5.7).
      const antes = Number(punho.getAttribute('aria-valuenow'));
      punho.focus();
      await expect(punho).toHaveFocus();

      const cresce = args.direction === 'horizontal' ? '{ArrowRight}' : '{ArrowDown}';
      const encolhe = args.direction === 'horizontal' ? '{ArrowLeft}' : '{ArrowUp}';

      // `waitFor`: o binding é reativo e esta stack roda sem zone — a detecção
      // de mudança é agendada, não síncrona ao evento.
      await userEvent.keyboard(cresce);
      await waitFor(() =>
        expect(Number(punho.getAttribute('aria-valuenow'))).toBeGreaterThan(antes),
      );

      await userEvent.keyboard(encolhe);
      await userEvent.keyboard(encolhe);
      await waitFor(() => expect(Number(punho.getAttribute('aria-valuenow'))).toBeLessThan(antes));
    });

    await step('A seta do outro eixo não é sequestrada', async () => {
      // Um separator vertical que consumisse ArrowUp roubaria a rolagem de
      // quem só está de passagem pelo foco.
      const antes = punho.getAttribute('aria-valuenow');
      await userEvent.keyboard(args.direction === 'horizontal' ? '{ArrowUp}' : '{ArrowLeft}');
      await expect(punho.getAttribute('aria-valuenow')).toBe(antes);
    });
  },
};
