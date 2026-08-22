import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  NdsAccordion,
  NdsAccordionContent,
  NdsAccordionItem,
  NdsAccordionTrigger,
} from './accordion';
import { NdsAccordionDocs } from '@/components/docs/AccordionDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

type AccordionArgs = {
  multiple: boolean;
  disabled: boolean;
  onValueChange: (value: unknown) => void;
};

/**
 * O painel Code imprime o `template` da story literalmente — com o binding de
 * arg e o andaime. Não é o que a pessoa deve escrever. Ver separator.stories.ts.
 */
function playgroundSource(_gerado: string, ctx: { args?: Partial<AccordionArgs> }): string {
  const { multiple = false, disabled = false } = ctx.args ?? {};

  const attrs = [
    multiple ? '[multiple]="true"' : '',
    disabled ? '[disabled]="true"' : '',
    // Modo único guarda uma string; múltiplo, um array. Ver a tabela de props.
    multiple ? `[defaultValue]="['item-1']"` : `defaultValue="item-1"`,
    '(valueChange)="aoMudar($event)"',
  ].filter(Boolean).join('\n      ');

  return `import {
  NdsAccordion,
  NdsAccordionItem,
  NdsAccordionTrigger,
  NdsAccordionContent,
} from '@/components/ui/accordion';

@Component({
  imports: [NdsAccordion, NdsAccordionItem, NdsAccordionTrigger, NdsAccordionContent],
  template: \`
    <div ndsAccordion
      ${attrs}
    >
      <div ndsAccordionItem value="item-1">
        <button ndsAccordionTrigger>Como faço para redefinir minha senha?</button>
        <div ndsAccordionContent>
          Acesse a tela de login e clique em Esqueci minha senha.
        </div>
      </div>
      <div ndsAccordionItem value="item-2">
        <button ndsAccordionTrigger>Quais formas de pagamento são aceitas?</button>
        <div ndsAccordionContent>
          Aceitamos cartão de crédito, Pix e boleto bancário.
        </div>
      </div>
    </div>
  \`,
})
export class Exemplo {
  aoMudar(valor: string | string[] | undefined) {
    // Modo único: string. Modo múltiplo: array.
  }
}`;
}

const meta: Meta<AccordionArgs> = {
  title: 'UI/Accordion',
  tags: ['autodocs', 'disclosure'],
  decorators: [
    moduleMetadata({
      imports: [NdsAccordion, NdsAccordionItem, NdsAccordionTrigger, NdsAccordionContent],
    }),
  ],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsAccordionDocs) },
  },
  // Sem compodoc neste stack: a aba API Reference sai destes argTypes escritos
  // à mão. E função em `args` sem entrada aqui não chega ao template — é o que
  // deixaria o espião de `valueChange` ligado a nada.
  argTypes: {
    multiple: {
      control: 'boolean',
      description: 'Permite múltiplos itens abertos ao mesmo tempo.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita todos os itens de uma vez.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    onValueChange: { control: false, table: { disable: true } },
  },
  args: {
    multiple: false,
    disabled: false,
    onValueChange: fn(),
  },
};

export default meta;
type Story = StoryObj<AccordionArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: playgroundSource } },
    covers: [
      'functional.item1', 'functional.item3',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item4', 'accessibility.item6',
      'visual.item1',
    ],
  },
  render: (args) => ({
    props: {
      ...args,
      // Modo único compara o valor da raiz com a string do item; modo múltiplo
      // compara com um array. Passar a forma errada abriria nada, em silêncio.
      valueInitial: args.multiple ? ['item-1'] : 'item-1',
    },
    template: `
      <div
        ndsAccordion
        class="nds-max-w-lg"
        [multiple]="multiple"
        [disabled]="disabled"
        [defaultValue]="valueInitial"
        (valueChange)="onValueChange($event)"
      >
        <div ndsAccordionItem value="item-1">
          <button ndsAccordionTrigger>Como faço para redefinir minha senha?</button>
          <div ndsAccordionContent>
            Acesse a tela de login e clique em "Esqueci minha senha". Você receberá um link
            de redefinição no email cadastrado, válido por 24 horas.
          </div>
        </div>
        <div ndsAccordionItem value="item-2">
          <button ndsAccordionTrigger>Quais formas de pagamento são aceitas?</button>
          <div ndsAccordionContent>
            Aceitamos cartão de crédito, Pix e boleto bancário. Parcelamento disponível em
            até 12 vezes sem juros no cartão.
          </div>
        </div>
        <div ndsAccordionItem value="item-3">
          <button ndsAccordionTrigger>Como cancelo minha assinatura?</button>
          <div ndsAccordionContent>
            Você pode cancelar a qualquer momento em Configurações, Assinatura. O acesso
            permanece ativo até o fim do período já pago.
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    // Idempotentes de propósito: clicam SÓ se o estado atual já não for o
    // desejado. Um clique cego ALTERNA — a partir do estado errado ele inverte
    // o resultado. É o que faz a play passar no vitest (montagem limpa) e
    // falhar no painel Interactions, onde o replay reaproveita o DOM.
    const abrir = async (t: HTMLElement) => {
      if (t.getAttribute('aria-expanded') !== 'true') await userEvent.click(t);
      await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'true'));
    };
    const fechar = async (t: HTMLElement) => {
      if (t.getAttribute('aria-expanded') !== 'false') await userEvent.click(t);
      await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'false'));
    };

    await step('O markup é o do Vanilla: h3 > button > span + svg', async () => {
      // Sem esta asserção nada impede o cabeçalho semântico de sumir numa
      // refatoração — e a APG exige o gatilho dentro de um heading.
      const raiz = canvasElement.querySelector<HTMLElement>('[data-slot="accordion"]')!;
      await expect(raiz.classList.contains('nds-accordion')).toBe(true);
      await expect(raiz).toHaveAttribute('data-type', args.multiple ? 'multiple' : 'single');

      const item = canvasElement.querySelector<HTMLElement>('[data-slot="accordion-item"]')!;
      await expect(item.classList.contains('nds-accordion-item')).toBe(true);

      const header = item.querySelector<HTMLElement>('h3.nds-accordion-header')!;
      await expect(header).not.toBeNull();

      const gatilho = header.querySelector<HTMLButtonElement>('[data-slot="accordion-trigger"]')!;
      await expect(gatilho.tagName).toBe('BUTTON');
      await expect(gatilho.type).toBe('button');
      await expect(gatilho.classList.contains('nds-accordion-trigger')).toBe(true);
      // `role="button"` num <button> é ruído do primitivo; o markup das cinco
      // stacks não o tem.
      await expect(gatilho.hasAttribute('role')).toBe(false);
      await expect(gatilho.firstElementChild!.tagName).toBe('SPAN');

      // Classe estática em <svg>: `className` de SVG é SVGAnimatedString e não
      // aceita atribuição — se o Angular deixasse de usar setAttribute aqui, o
      // chevron perderia tamanho e cor sem nenhum erro.
      const icone = gatilho.querySelector('svg')!;
      await expect(icone.getAttribute('class')).toContain('nds-accordion-icon');
    });

    await step('O painel não é landmark e o corpo tem a classe de animação', async () => {
      const painel = canvasElement.querySelector<HTMLElement>('[data-slot="accordion-content"]')!;
      await expect(painel.classList.contains('nds-accordion-content')).toBe(true);
      // role="region" e aria-labelledby vêm do primitivo e são removidos: com o
      // painel sempre montado, um landmark por item proliferaria (axe
      // landmark-unique). A relação fica no aria-controls.
      await expect(painel.hasAttribute('role')).toBe(false);
      await expect(painel.hasAttribute('aria-labelledby')).toBe(false);
      await expect(
        painel.querySelector('.nds-accordion-content-body'),
      ).not.toBeNull();
    });

    await step('Modo único mantém um item aberto por vez', async () => {
      const triggers = canvas.getAllByRole('button');
      await abrir(triggers[0]);
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'false');
      await expect(triggers[2]).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Clicar no gatilho fechado abre o item', async () => {
      const triggers = canvas.getAllByRole('button');
      await fechar(triggers[1]);
      await abrir(triggers[1]);
      await expect(args.onValueChange).toHaveBeenCalled();
    });

    await step('Conteúdo aberto fica de fato visível, com altura real', async () => {
      // aria-expanded sozinho não prova que o painel apareceu: já houve
      // regressão em que o gatilho reportava aberto e o conteúdo ficava
      // colapsado. A abertura anima a ALTURA (0fr → 1fr), então medir no
      // primeiro quadro dá zero — daí o waitFor.
      const painel = await waitFor(() => {
        const el = canvasElement.querySelector<HTMLElement>(
          '[data-slot="accordion-content"][data-state="open"]',
        );
        if (!el || el.getBoundingClientRect().height === 0) {
          throw new Error('painel aberto ainda não assentou');
        }
        return el;
      });
      await expect(painel).toBeVisible();
    });

    await step('Gatilho aponta para o painel por aria-controls', async () => {
      const gatilho = canvas.getAllByRole('button')[0];
      await abrir(gatilho);
      const idPanel = gatilho.getAttribute('aria-controls');
      await expect(idPanel).toBeTruthy();
      await expect(canvasElement.querySelector(`#${CSS.escape(idPanel!)}`)).not.toBeNull();
      await expect(gatilho.id).toBeTruthy();
    });

    await step('Painel fechado continua no DOM, achável pelo Ctrl+F', async () => {
      // `hidden="until-found"` esconde por content-visibility, não por display —
      // é o que deixa a busca do navegador achar a resposta e abrir o item. O
      // display computado entra na asserção de propósito: uma regra de autor com
      // `display: none` anula o recurso sem quebrar nada visível.
      const gatilho = canvas.getAllByRole('button')[0];
      await abrir(gatilho);
      await fechar(gatilho);
      const painel = await waitFor(() => {
        const el = canvasElement.querySelector<HTMLElement>('[data-slot="accordion-content"]');
        if (!el || !el.hasAttribute('hidden')) throw new Error('painel ainda fechando');
        return el;
      });
      await expect(painel.getAttribute('hidden')).toBe('until-found');
      await expect(getComputedStyle(painel).display).not.toBe('none');
    });

    await step('Enter expande o item focado', async () => {
      const triggers = canvas.getAllByRole('button');
      await fechar(triggers[2]);
      triggers[2].focus();
      await expect(triggers[2]).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await waitFor(() => expect(triggers[2]).toHaveAttribute('aria-expanded', 'true'));
    });

    await step('Space colapsa o item focado', async () => {
      const triggers = canvas.getAllByRole('button');
      await abrir(triggers[2]);
      triggers[2].focus();
      await userEvent.keyboard(' ');
      await waitFor(() => expect(triggers[2]).toHaveAttribute('aria-expanded', 'false'));
    });

    await step('Setas movem o foco com laço; Home e End vão às pontas', async () => {
      // O Radix NG deprecou o roving focus do accordion — sem o handler da raiz
      // as setas rolariam a página, divergindo das outras quatro stacks.
      const triggers = canvas.getAllByRole('button');
      triggers[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(triggers[1]).toHaveFocus();
      await userEvent.keyboard('{ArrowUp}');
      await expect(triggers[0]).toHaveFocus();
      await userEvent.keyboard('{ArrowUp}');
      await expect(triggers[triggers.length - 1]).toHaveFocus();
      await userEvent.keyboard('{Home}');
      await expect(triggers[0]).toHaveFocus();
      await userEvent.keyboard('{End}');
      await expect(triggers[triggers.length - 1]).toHaveFocus();
    });

    await step('Tab e Shift+Tab movem o foco entre gatilhos', async () => {
      const triggers = canvas.getAllByRole('button');
      triggers[0].focus();
      await userEvent.tab();
      await expect(triggers[1]).toHaveFocus();
      await userEvent.tab({ shift: true });
      await expect(triggers[0]).toHaveFocus();
    });

    if (!args.multiple) {
      await step('Abrir um item fecha o anterior (modo único)', async () => {
        const triggers = canvas.getAllByRole('button');
        await abrir(triggers[1]);
        await abrir(triggers[2]);
        await expect(triggers[1]).toHaveAttribute('aria-expanded', 'false');
        await expect(triggers[0]).toHaveAttribute('aria-expanded', 'false');
      });
    }
  },
};
