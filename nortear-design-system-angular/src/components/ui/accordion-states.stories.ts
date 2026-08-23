import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
  NdsAccordion,
  NdsAccordionContent,
  NdsAccordionItem,
  NdsAccordionTrigger,
} from './accordion';

const meta: Meta = {
  title: 'UI/Accordion/States',
  tags: ['disclosure'],
  decorators: [
    moduleMetadata({
      imports: [NdsAccordion, NdsAccordionItem, NdsAccordionTrigger, NdsAccordionContent],
    }),
  ],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

export const Closed: Story = {
  parameters: {
    covers: ['accessibility.item2', 'accessibility.item7', 'visual.item3'],
    docs: {
      description: {
        story: 'Estado padrão: `aria-expanded="false"` no gatilho e chevron apontando para baixo.',
      },
    },
  },
  render: () => ({
    template: `
      <div ndsAccordion class="nds-max-w-lg">
        <div ndsAccordionItem value="item-1">
          <button ndsAccordionTrigger>Item fechado (estado padrão)</button>
          <div ndsAccordionContent>Conteúdo oculto.</div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');

    await step('Gatilho tem aria-expanded=false', async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('O painel fechado permanece no documento', async () => {
      // `hidden="until-found"` é o que deixa o Ctrl+F achar a resposta dentro
      // de um item fechado; desmontar o painel mataria o recurso em silêncio. O
      // display entra junto porque um `display: none` de autor o anula sem
      // quebrar nada visível.
      const panel = await waitFor(() => {
        const el = canvasElement.querySelector<HTMLElement>('[data-slot="accordion-content"]');
        if (!el || !el.hasAttribute('hidden')) throw new Error('painel ainda assentando');
        return el;
      });
      await expect(panel.getAttribute('hidden')).toBe('until-found');
      await expect(getComputedStyle(panel).display).not.toBe('none');
    });

    await step('Fechado, o gatilho ainda aponta para o painel', async () => {
      // Sem `role="region"` no painel, o aria-controls é o ÚNICO vínculo entre
      // gatilho e conteúdo.
      const contentId = trigger.getAttribute('aria-controls');
      await expect(contentId).toBeTruthy();
      await expect(
        canvasElement.querySelector(`#${CSS.escape(contentId!)}`),
      ).toBeInTheDocument();
    });
  },
};

export const Open: Story = {
  parameters: {
    covers: ['accessibility.item2', 'visual.item3'],
    docs: {
      description: {
        story:
          'Estado aberto: `aria-expanded="true"`, chevron girado 180° e conteúdo com altura real.',
      },
    },
  },
  render: () => ({
    template: `
      <div ndsAccordion class="nds-max-w-lg" defaultValue="item-1">
        <div ndsAccordionItem value="item-1">
          <button ndsAccordionTrigger>Item aberto</button>
          <div ndsAccordionContent>
            Conteúdo visível. O chevron rotaciona 180° pelo CSS, a partir do estado do gatilho.
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');

    await step('Gatilho tem aria-expanded=true', async () => {
      await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'), {
        timeout: 500,
      });
    });

    await step('O painel aberto tem altura de verdade', async () => {
      // aria-expanded sozinho não prova que o painel apareceu: a altura vem da
      // animação de grid, e já houve regressão com gatilho aberto e painel
      // colapsado.
      await waitFor(() => {
        const panel = canvasElement.querySelector<HTMLElement>(
          '[data-slot="accordion-content"]:not([hidden])',
        );
        if (!panel || panel.getBoundingClientRect().height === 0) {
          throw new Error('painel ainda abrindo');
        }
      });
    });
  },
};

export const Disabled: Story = {
  parameters: {
    covers: ['functional.item5', 'accessibility.item5', 'visual.item5'],
    docs: {
      description: {
        story:
          'Item desabilitado. O gatilho continua focável e anuncia `aria-disabled="true"` — a ' +
          'paridade com o Base UI — e o CSS reduz a opacidade e corta o ponteiro.',
      },
    },
  },
  render: () => ({
    template: `
      <div ndsAccordion class="nds-max-w-lg">
        <div ndsAccordionItem value="item-1">
          <button ndsAccordionTrigger>Item habilitado</button>
          <div ndsAccordionContent>Este item funciona normalmente.</div>
        </div>
        <div ndsAccordionItem value="item-2" [disabled]="true">
          <button ndsAccordionTrigger>Item desabilitado</button>
          <div ndsAccordionContent>Este conteúdo não pode ser acessado.</div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O segundo gatilho está desabilitado', async () => {
      const triggers = canvas.getAllByRole('button');
      await expect(triggers[1]).toHaveAttribute('aria-disabled', 'true');
    });

    await step('Clicar no desabilitado não abre o item', async () => {
      // `pointerEventsCheck: 0` porque o CSS aplica `pointer-events: none` — a
      // ausência de efeito é justamente o que se prova aqui.
      const triggers = canvas.getAllByRole('button');
      await userEvent.click(triggers[1], { pointerEventsCheck: 0 });
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'false');
    });

    await step('As setas pulam o item desabilitado', async () => {
      // Item desabilitado fora da navegação: com um único item operável, a
      // seta faz laço nele mesmo.
      const triggers = canvas.getAllByRole('button');
      triggers[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(triggers[0]).toHaveFocus();
    });
  },
};

export const FocusVisible: Story = {
  parameters: {
    covers: ['accessibility.item3'],
    docs: {
      description: {
        story:
          'Navegação por teclado: Tab percorre os gatilhos e o anel de foco usa o token ' +
          '`--ring`. Enter e Space abrem e fecham o item focado.',
      },
    },
  },
  render: () => ({
    template: `
      <div ndsAccordion class="nds-max-w-lg" defaultValue="item-1">
        <div ndsAccordionItem value="item-1">
          <button ndsAccordionTrigger>Navegue com Tab para ver o anel de foco</button>
          <div ndsAccordionContent>Anel de foco visível na navegação por teclado.</div>
        </div>
        <div ndsAccordionItem value="item-2">
          <button ndsAccordionTrigger>Segundo item</button>
          <div ndsAccordionContent>Tab move o foco para este gatilho.</div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O gatilho recebe foco', async () => {
      const triggers = canvas.getAllByRole('button');
      triggers[0].focus();
      await expect(triggers[0]).toHaveFocus();
    });

    await step('Tab move para o gatilho seguinte', async () => {
      const triggers = canvas.getAllByRole('button');
      await userEvent.tab();
      await expect(triggers[1]).toHaveFocus();
    });
  },
};
