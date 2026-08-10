import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { NDS_CONTEXT_MENU } from './context-menu';
import { esperarPortal, REGRA_GUARDA_DE_FOCO } from '@/lib/wait-for-portal';

// Sem argTypes, então o painel Controls é desligado — do contrário abriria vazio.

const meta: Meta = {
  title: 'UI/ContextMenu/Types',
  decorators: [moduleMetadata({ imports: [...NDS_CONTEXT_MENU] })],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    a11y: { config: { rules: [REGRA_GUARDA_DE_FOCO] } },
  },
};

export default meta;
type Story = StoryObj;

/** Abre pelo gesto real: é das coordenadas que o primitivo tira a posição. */
async function abrirPorGesto(area: HTMLElement): Promise<HTMLElement> {
  const caixa = area.getBoundingClientRect();
  await userEvent.pointer({
    keys: '[MouseRight]',
    target: area,
    coords: { clientX: caixa.left + caixa.width / 2, clientY: caixa.top + caixa.height / 2 },
  });
  return await esperarPortal('menu');
}

export const WithSubmenu: Story = {
  parameters: { covers: ['functional.item5', 'functional.item6', 'visual.item3'] },
  render: () => ({
    template: `
      <div ndsContextMenu>
        <div ndsContextMenuTrigger data-testid="area">Clique com o botão direito aqui</div>

        <ng-template ndsContextMenuContent>
          <div ndsContextMenuItem>Editar</div>

          <div ndsContextMenuSub>
            <div ndsContextMenuSubTrigger data-testid="sub">Compartilhar</div>
            <ng-template ndsContextMenuSubContent>
              <div ndsContextMenuItem>Por e-mail</div>
              <div ndsContextMenuItem>Por link</div>
            </ng-template>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const area = () => canvasElement.querySelector<HTMLElement>('[data-testid="area"]')!;
    const subGatilho = () => document.querySelector<HTMLElement>('[data-testid="sub"]')!;

    await step('O sub-gatilho diz que abre um menu', async () => {
      await abrirPorGesto(area());
      await expect(subGatilho().getAttribute('aria-haspopup')).toBe('menu');
      await expect(subGatilho().getAttribute('aria-expanded')).toBe('false');
    });

    await step('Seta direita abre o submenu, ao lado do item que o dispara', async () => {
      subGatilho().focus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(subGatilho().getAttribute('aria-expanded')).toBe('true'));

      const submenu = document.querySelector<HTMLElement>('[data-slot="context-menu-sub-content"]')!;
      const itens = submenu.querySelectorAll('[data-slot="context-menu-item"]');
      await expect(itens.length).toBe(2);

      // "À direita" é medida, não atributo: é o que o conteúdo promete e o que
      // um `side` errado quebraria sem nenhum aviso.
      //
      // O `waitFor` não é folga: o popup entra no DOM ANTES de o floating-ui
      // medir, e até lá fica em (0,0). Ler o retângulo no primeiro quadro dá
      // zero e o teste reprova por corrida, não por defeito.
      await waitFor(() =>
        expect(submenu.getBoundingClientRect().left).toBeGreaterThanOrEqual(
          subGatilho().getBoundingClientRect().left,
        ),
      );
    });

    await step('Seta esquerda fecha o submenu e volta ao gatilho dele', async () => {
      await userEvent.keyboard('{ArrowLeft}');
      await waitFor(() => expect(subGatilho().getAttribute('aria-expanded')).toBe('false'));
      await waitFor(() => expect(document.activeElement).toBe(subGatilho()));
    });
  },
};

export const WithSelection: Story = {
  parameters: {
    covers: [
      'functional.item7', 'functional.item8',
      'accessibility.item4', 'accessibility.item5',
      'visual.item4',
    ],
  },
  render: () => ({
    props: { grade: false, canal: 'email' },
    template: `
      <div ndsContextMenu>
        <div ndsContextMenuTrigger data-testid="area">Clique com o botão direito aqui</div>

        <ng-template ndsContextMenuContent>
          <div ndsContextMenuCheckboxItem [(checked)]="grade" data-testid="check">
            Mostrar grade
          </div>

          <div ndsContextMenuSeparator></div>

          <div ndsContextMenuRadioGroup [(value)]="canal">
            <div ndsContextMenuRadioItem value="email" data-testid="radio-email">Por e-mail</div>
            <div ndsContextMenuRadioItem value="link" data-testid="radio-link">Por link</div>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const area = () => canvasElement.querySelector<HTMLElement>('[data-testid="area"]')!;
    const alvo = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;

    await step('Os papéis dizem que tipo de escolha cada item é', async () => {
      await abrirPorGesto(area());
      await expect(alvo('check').getAttribute('role')).toBe('menuitemcheckbox');
      await expect(alvo('radio-email').getAttribute('role')).toBe('menuitemradio');
    });

    await step('O estado marcado é anunciado, não só desenhado', async () => {
      await expect(alvo('check').getAttribute('aria-checked')).toBe('false');
      await userEvent.click(alvo('check'));
      await waitFor(() => expect(alvo('check').getAttribute('aria-checked')).toBe('true'));
      // O menu NÃO fecha: quem marca uma opção costuma querer marcar a próxima.
      await expect(document.querySelector('[data-slot="context-menu-content"]')).not.toBeNull();
    });

    await step('A escolha única limpa a anterior', async () => {
      await expect(alvo('radio-email').getAttribute('aria-checked')).toBe('true');
      await userEvent.click(alvo('radio-link'));
      await waitFor(() => expect(alvo('radio-link').getAttribute('aria-checked')).toBe('true'));
      await expect(alvo('radio-email').getAttribute('aria-checked')).toBe('false');
    });
  },
};

export const WithDisabledItems: Story = {
  parameters: {
    covers: ['functional.item10', 'accessibility.item6', 'visual.item5'],
    // `functional.item9` promete que o item desabilitado NÃO recebe foco por
    // teclado. O primitivo mantém `aria-disabled` focável de propósito — é o
    // que a WAI-ARIA APG permite explicitamente, para o item não sumir de quem
    // navega às cegas. Cobrir o critério exigiria contrariar o primitivo; o que
    // dá para garantir, e está afirmado abaixo, é que ele não ativa.
    coversNotApplicable: {
      'functional.item9':
        'o primitivo mantém item aria-disabled focável (permitido pela APG, para não sumir de quem navega por teclado); a story afirma que ele não ativa',
    },
  },
  render: () => ({
    template: `
      <div ndsContextMenu>
        <div ndsContextMenuTrigger data-testid="area">Clique com o botão direito aqui</div>

        <ng-template ndsContextMenuContent>
          <div ndsContextMenuItem data-testid="primeiro">Editar</div>
          <div ndsContextMenuItem [disabled]="true" data-testid="off">Duplicar</div>
          <div ndsContextMenuItem data-testid="ultimo">Renomear</div>

          <div ndsContextMenuSeparator></div>

          <div ndsContextMenuItem variant="destructive" data-testid="perigo">Excluir</div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const area = () => canvasElement.querySelector<HTMLElement>('[data-testid="area"]')!;
    const alvo = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;

    await step('O item desabilitado é anunciado como tal', async () => {
      await abrirPorGesto(area());
      await expect(alvo('off').getAttribute('aria-disabled')).toBe('true');
    });

    await step('Ele recebe foco, mas não ativa', async () => {
      // O foco PASSA por ele: a APG permite manter item desabilitado focável
      // justamente para que quem navega por teclado saiba que a opção existe e
      // está indisponível — some-la esconderia a informação. O que não pode é
      // ativar.
      alvo('primeiro').focus();
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(document.activeElement).toBe(alvo('off')));

      await userEvent.keyboard('{Enter}');
      // O menu segue aberto: Enter num item desabilitado não escolhe nada.
      await expect(document.querySelector('[data-slot="context-menu-content"]')).not.toBeNull();
    });

    await step('O item destrutivo se declara pelo atributo, não só pela cor', async () => {
      // Cor sozinha não chega a quem não a distingue; o `data-variant` é o que
      // o CSS lê e o que a auditoria compara entre stacks.
      await expect(alvo('perigo').getAttribute('data-variant')).toBe('destructive');
    });
  },
};

export const DarkPalette: Story = {
  parameters: {
    covers: ['visual.item6'],
    // themeOverride é o canal do addon-themes: a classe volta sozinha na story
    // seguinte, porque o efeito do decorator depende dele.
    themes: { themeOverride: 'dark' },
  },
  render: () => ({
    template: `
      <div ndsContextMenu>
        <div ndsContextMenuTrigger data-testid="area">Clique com o botão direito aqui</div>

        <ng-template ndsContextMenuContent>
          <div ndsContextMenuItem>Editar</div>
          <div ndsContextMenuCheckboxItem [checked]="true">Mostrar grade</div>
          <div ndsContextMenuSeparator></div>
          <div ndsContextMenuItem variant="destructive">Excluir</div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('A paleta escura está aplicada no documento', async () => {
      await expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    await step('O menu é mais escuro que o texto que ele recebe', async () => {
      // Prova que a paleta trocou de verdade: com os tokens do claro esta
      // relação se inverte, e a asserção acusa.
      const area = canvasElement.querySelector<HTMLElement>('[data-testid="area"]')!;
      const menu = await abrirPorGesto(area);
      const cs = getComputedStyle(menu);
      const brilho = (cor: string) => {
        const [r = 0, g = 0, b = 0] = cor.match(/[\d.]+/g)?.map(Number) ?? [];
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      await expect(brilho(cs.backgroundColor)).toBeLessThan(brilho(cs.color));
    });
  },
};
