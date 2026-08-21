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
  title: 'UI/Accordion/Variants',
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

// Idempotentes: o painel Interactions reexecuta a play no MESMO DOM, então o
// estado de partida é o que a rodada anterior deixou. Um clique cego ALTERNA —
// a partir do estado errado ele inverte o resultado e a asserção falha.
const abrir = async (t: HTMLElement) => {
  if (t.getAttribute('aria-expanded') !== 'true') await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'true'));
};
const fechar = async (t: HTMLElement) => {
  if (t.getAttribute('aria-expanded') !== 'false') await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'false'));
};

export const Single: Story = {
  parameters: {
    covers: ['functional.item2', 'functional.item3', 'functional.item6', 'visual.item2'],
    docs: {
      description: {
        story:
          'Modo único (padrão — sem `multiple`). Apenas um item aberto por vez, e clicar no ' +
          'item ativo o fecha. Use para FAQ.',
      },
    },
  },
  render: () => ({
    template: `
      <div ndsAccordion class="nds-max-w-lg" defaultValue="item-1">
        <div ndsAccordionItem value="item-1">
          <button ndsAccordionTrigger>Como faço para redefinir minha senha?</button>
          <div ndsAccordionContent>
            Acesse a tela de login e clique em "Esqueci minha senha". Você receberá um link
            de redefinição no email cadastrado, válido por 24 horas.
          </div>
        </div>
        <div ndsAccordionItem value="item-2">
          <button ndsAccordionTrigger>Quais formas de pagamento são aceitas?</button>
          <div ndsAccordionContent>Aceitamos cartão de crédito, Pix e boleto bancário.</div>
        </div>
        <div ndsAccordionItem value="item-3">
          <button ndsAccordionTrigger>Como cancelo minha assinatura?</button>
          <div ndsAccordionContent>
            Você pode cancelar a qualquer momento em Configurações, Assinatura.
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Item 1 começa aberto via defaultValue', async () => {
      // Modo único guarda uma STRING — passar `['item-1']` aqui não abriria
      // nada, porque a comparação da raiz é direta.
      const gatilhos = canvas.getAllByRole('button');
      await waitFor(() => expect(gatilhos[0]).toHaveAttribute('aria-expanded', 'true'), {
        timeout: 500,
      });
    });

    await step('Abrir o item 2 fecha automaticamente o item 1', async () => {
      const gatilhos = canvas.getAllByRole('button');
      await abrir(gatilhos[1]);
      await expect(gatilhos[0]).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Clicar no item ativo o fecha', async () => {
      const gatilhos = canvas.getAllByRole('button');
      await fechar(gatilhos[1]);
    });
  },
};

/**
 * O fechar-ao-clicar-de-novo, medido sem nenhuma configuração.
 *
 * A raiz é montada com o modo único PADRÃO — nada é passado além dos itens. É
 * esse recorte que prova o contrato: o comportamento não depende de uma entrada
 * que quem consome precise lembrar de ligar. Enquanto existia um `collapsible`
 * na tabela compartilhada, esta story ficava vermelha na stack cuja lib o trazia
 * desligado por omissão — foi assim que a divergência foi medida.
 *
 * Sobrevive ao REPLAY: cada passo estabelece a própria precondição, e o par
 * `abrir`/`fechar` garante um clique real nesta rodada partindo de um estado
 * conhecido, em vez de alternar a partir do que a rodada anterior deixou.
 */
export const CloseOnSecondClick: Story = {
  parameters: {
    covers: ['functional.item2'],
    docs: {
      description: {
        story:
          'Modo único sem nenhuma configuração extra: clicar de novo no item aberto o fecha.',
      },
    },
  },
  render: () => ({
    template: `
      <div ndsAccordion class="nds-max-w-lg">
        <div ndsAccordionItem value="item-1">
          <button ndsAccordionTrigger>Como faço para redefinir minha senha?</button>
          <div ndsAccordionContent>
            Acesse a tela de login e clique em "Esqueci minha senha".
          </div>
        </div>
        <div ndsAccordionItem value="item-2">
          <button ndsAccordionTrigger>Quais formas de pagamento são aceitas?</button>
          <div ndsAccordionContent>Aceitamos cartão de crédito, Pix e boleto bancário.</div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Clicar de novo no item aberto o fecha', async () => {
      const gatilhos = canvas.getAllByRole('button');
      await abrir(gatilhos[0]);  // precondição própria: garantidamente aberto
      await fechar(gatilhos[0]); // clique real nesta rodada + asserção de estado
    });

    await step('O painel recolhe de fato, não só o atributo', async () => {
      // Atributo é promessa, altura é entrega. Sem esta asserção, um painel que
      // continuasse expandido com aria-expanded="false" passaria despercebido.
      // A tolerância de 1px cobre o arredondamento do grid em 0fr.
      await waitFor(() => {
        const expandidos = Array.from(
          canvasElement.querySelectorAll<HTMLElement>('[data-slot="accordion-content"]'),
        ).filter((p) => p.getBoundingClientRect().height > 1);
        expect(expandidos).toHaveLength(0);
      });
    });
  },
};

export const Multiple: Story = {
  parameters: {
    covers: ['functional.item4'],
    docs: {
      description: {
        story:
          'Modo múltiplo. Vários itens podem estar abertos ao mesmo tempo, e cada um fecha ' +
          'sozinho. Use para especificações comparáveis.',
      },
    },
  },
  render: () => ({
    template: `
      <div ndsAccordion class="nds-max-w-lg" [multiple]="true">
        <div ndsAccordionItem value="especificacoes">
          <button ndsAccordionTrigger>Especificações técnicas</button>
          <div ndsAccordionContent>CPU: Intel Core i7-12700, RAM: 16GB DDR5, SSD: 512GB NVMe</div>
        </div>
        <div ndsAccordionItem value="compatibilidade">
          <button ndsAccordionTrigger>Compatibilidade</button>
          <div ndsAccordionContent>Windows 11, macOS 14+, Ubuntu 22.04 LTS</div>
        </div>
        <div ndsAccordionItem value="garantia">
          <button ndsAccordionTrigger>Garantia e suporte</button>
          <div ndsAccordionContent>24 meses de garantia de fábrica. Suporte técnico 24/7.</div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Dois itens abertos ao mesmo tempo', async () => {
      const gatilhos = canvas.getAllByRole('button');
      await abrir(gatilhos[0]);
      await abrir(gatilhos[1]);
      await expect(gatilhos[0]).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Fechar um não mexe no outro', async () => {
      const gatilhos = canvas.getAllByRole('button');
      await fechar(gatilhos[0]);
      await expect(gatilhos[1]).toHaveAttribute('aria-expanded', 'true');
    });
  },
};

export const Controlled: Story = {
  parameters: {
    covers: ['functional.item6'],
    docs: {
      description: {
        story:
          'Modo controlado: `[(value)]` liga o estado a quem consome. O indicador acima do ' +
          'accordion lê o mesmo valor — útil para sincronizar com a URL ou outro estado.',
      },
    },
  },
  render: () => ({
    // `[(value)]` é a forma canônica aqui: `value` é um `model` do primitivo, e
    // o atalho de duas vias já cobre input e output.
    props: { valor: 'item-1' },
    template: `
      <div class="nds-stack nds-w-lg" data-spacing="sm">
        <p class="nds-text-caption nds-text-muted-foreground">
          Item aberto: <code>{{ valor || 'nenhum' }}</code>
        </p>
        <div ndsAccordion [(value)]="valor">
          <div ndsAccordionItem value="item-1">
            <button ndsAccordionTrigger>Item 1 — controlado</button>
            <div ndsAccordionContent>Estado gerenciado externamente por value.</div>
          </div>
          <div ndsAccordionItem value="item-2">
            <button ndsAccordionTrigger>Item 2 — controlado</button>
            <div ndsAccordionContent>
              Útil para sincronizar com a URL ou outro estado da aplicação.
            </div>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Item 1 começa aberto pelo valor inicial', async () => {
      const gatilhos = canvas.getAllByRole('button');
      await waitFor(() => expect(gatilhos[0]).toHaveAttribute('aria-expanded', 'true'), {
        timeout: 500,
      });
    });

    await step('Clicar no item 2 atualiza o estado externo', async () => {
      const gatilhos = canvas.getAllByRole('button');
      await abrir(gatilhos[1]);
      await waitFor(() => expect(canvasElement.textContent).toContain('item-2'));
    });
  },
};

export const DefaultOpen: Story = {
  parameters: {
    covers: ['functional.item6'],
    docs: {
      description: {
        story:
          '`defaultValue` abre um item na montagem sem tornar o componente controlado. ' +
          'Comum em documentação e onboarding.',
      },
    },
  },
  render: () => ({
    template: `
      <div ndsAccordion class="nds-max-w-lg" defaultValue="item-1">
        <div ndsAccordionItem value="item-1">
          <button ndsAccordionTrigger>Item aberto por padrão</button>
          <div ndsAccordionContent>
            Este item inicia expandido por <code>defaultValue</code>. Não é modo controlado —
            depois da montagem o estado interno assume.
          </div>
        </div>
        <div ndsAccordionItem value="item-2">
          <button ndsAccordionTrigger>Item fechado por padrão</button>
          <div ndsAccordionContent>Este item inicia colapsado.</div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Item 1 inicia expandido; item 2 não', async () => {
      const gatilhos = canvas.getAllByRole('button');
      await waitFor(() => expect(gatilhos[0]).toHaveAttribute('aria-expanded', 'true'), {
        timeout: 500,
      });
      await expect(gatilhos[1]).toHaveAttribute('aria-expanded', 'false');
    });
  },
};
