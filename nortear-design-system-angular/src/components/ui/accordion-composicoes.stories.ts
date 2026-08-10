import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
  NdsAccordion,
  NdsAccordionContent,
  NdsAccordionItem,
  NdsAccordionTrigger,
} from './accordion';
import { NdsBadge } from './badge';

const meta: Meta = {
  title: 'UI/Accordion/Compositions',
  tags: ['disclosure'],
  decorators: [
    moduleMetadata({
      imports: [
        NdsAccordion,
        NdsAccordionItem,
        NdsAccordionTrigger,
        NdsAccordionContent,
        NdsBadge,
      ],
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

const abrir = async (t: HTMLElement) => {
  if (t.getAttribute('aria-expanded') !== 'true') await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'true'));
};

export const WithIconInTrigger: Story = {
  parameters: {
    covers: ['functional.item1', 'visual.item4'],
    docs: {
      description: {
        story:
          'Ícone ao lado do texto do gatilho. O texto continua autoexplicativo — o ícone ' +
          'reforça a categoria e leva `aria-hidden="true"`, senão o leitor de tela o anuncia ' +
          'como parte do nome do botão.',
      },
    },
  },
  render: () => ({
    template: `
      <div ndsAccordion class="nds-max-w-lg">
        <div ndsAccordionItem value="info">
          <button ndsAccordionTrigger>
            <span class="nds-cluster" data-spacing="xs">
              <svg class="nds-icon-sm nds-shrink-0" xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
              </svg>
              Informação
            </span>
          </button>
          <div ndsAccordionContent>
            Ícones facilitam a identificação rápida do tipo de conteúdo.
          </div>
        </div>
        <div ndsAccordionItem value="aviso">
          <button ndsAccordionTrigger>
            <span class="nds-cluster" data-spacing="xs">
              <svg class="nds-icon-sm nds-shrink-0" xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
                <path d="M12 9v4" /><path d="M12 17h.01" />
              </svg>
              Aviso
            </span>
          </button>
          <div ndsAccordionContent>
            Sinalize categorias distintas com ícones semânticos.
          </div>
        </div>
        <div ndsAccordionItem value="confirmacao">
          <button ndsAccordionTrigger>
            <span class="nds-cluster" data-spacing="xs">
              <svg class="nds-icon-sm nds-shrink-0" xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
              </svg>
              Confirmação
            </span>
          </button>
          <div ndsAccordionContent>
            Use ícones consistentes entre itens do mesmo accordion.
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Os ícones ficam fora do nome acessível', async () => {
      // Com o ícone sem aria-hidden, o nome do botão viraria "Informação" mais
      // o que o leitor inventasse do SVG — e o gatilho deixaria de ser
      // localizável pelo próprio rótulo.
      const gatilho = canvas.getByRole('button', { name: 'Informação' });
      await expect(gatilho).not.toBeNull();
      for (const svg of canvasElement.querySelectorAll('.nds-icon-sm')) {
        await expect(svg.getAttribute('aria-hidden')).toBe('true');
      }
    });

    await step('Clicar no gatilho abre o item', async () => {
      await abrir(canvas.getByRole('button', { name: 'Informação' }));
    });
  },
};

export const WithBadgeInTrigger: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      description: {
        story:
          'Badge ao lado do rótulo sinalizando status. É decorativo: não recebe foco nem ' +
          'clique próprios, senão haveria um alvo interativo dentro de um botão.',
      },
    },
  },
  render: () => ({
    template: `
      <div ndsAccordion class="nds-max-w-lg">
        <div ndsAccordionItem value="novo">
          <button ndsAccordionTrigger>
            <span class="nds-cluster" data-spacing="xs">
              Novidades da versão 3.0
              <span ndsBadge>Novo</span>
            </span>
          </button>
          <div ndsAccordionContent>Confira o que mudou nesta release.</div>
        </div>
        <div ndsAccordionItem value="beta">
          <button ndsAccordionTrigger>
            <span class="nds-cluster" data-spacing="xs">
              Funcionalidades em beta
              <span ndsBadge variant="secondary">Beta</span>
            </span>
          </button>
          <div ndsAccordionContent>Recursos em teste — sujeitos a mudanças.</div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O badge não é um alvo interativo dentro do botão', async () => {
      // Um elemento focável aninhado num botão é exatamente o que a regra
      // `nested-interactive` do axe proíbe.
      const badges = canvasElement.querySelectorAll('[data-slot="badge"]');
      await expect(badges.length).toBe(2);
      for (const b of badges) {
        await expect(b.tagName).toBe('SPAN');
        await expect(b.hasAttribute('tabindex')).toBe(false);
      }
    });

    await step('O rótulo do badge entra no nome acessível do gatilho', async () => {
      await expect(
        canvas.getByRole('button', { name: /Novidades da versão 3\.0\s+Novo/ }),
      ).not.toBeNull();
    });
  },
};

export const ConteudoRico: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item4'],
    docs: {
      description: {
        story:
          'O conteúdo aceita qualquer HTML. Dado tabular vai em `<table>` de verdade — grid ' +
          'de duas colunas colapsaria para uma dentro do accordion e perderia a semântica.',
      },
    },
  },
  render: () => ({
    template: `
      <div ndsAccordion class="nds-max-w-lg nds-text-body" [multiple]="true">
        <div ndsAccordionItem value="specs">
          <button ndsAccordionTrigger>Especificações técnicas</button>
          <div ndsAccordionContent>
            <table class="nds-w-full nds-text-body nds-border-collapse">
              <tbody>
                <tr class="nds-border-b">
                  <td class="nds-py-1 nds-pr-4">CPU</td>
                  <td class="nds-py-1">Intel Core i7-12700</td>
                </tr>
                <tr class="nds-border-b">
                  <td class="nds-py-1 nds-pr-4">RAM</td>
                  <td class="nds-py-1">16GB DDR5</td>
                </tr>
                <tr>
                  <td class="nds-py-1 nds-pr-4">SSD</td>
                  <td class="nds-py-1">512GB NVMe</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div ndsAccordionItem value="inclui">
          <button ndsAccordionTrigger>O que está incluso</button>
          <div ndsAccordionContent>
            <ul class="nds-stack nds-text-body nds-list-disc" data-spacing="xs">
              <li>Cabo de alimentação</li>
              <li>Manual do usuário</li>
              <li>Garantia de 24 meses</li>
            </ul>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Os dois itens abrem juntos e o conteúdo rico aparece', async () => {
      const gatilhos = canvas.getAllByRole('button');
      await abrir(gatilhos[0]);
      await abrir(gatilhos[1]);
      await expect(gatilhos[0]).toHaveAttribute('aria-expanded', 'true');
      await expect(canvas.getByRole('table')).toBeVisible();
      await expect(canvas.getAllByRole('listitem').length).toBe(3);
    });
  },
};

export const FAQ: Story = {
  parameters: {
    covers: ['functional.item1', 'functional.item3'],
    docs: {
      description: {
        story:
          'Padrão canônico de Perguntas Frequentes: um `h2` acima do accordion, perguntas ' +
          'interrogativas completas no gatilho e respostas objetivas em duas ou três linhas.',
      },
    },
  },
  render: () => ({
    template: `
      <div class="nds-stack nds-w-full nds-max-w-lg" data-spacing="xs">
        <h2 class="nds-text-base nds-font-semibold">Perguntas frequentes</h2>
        <div ndsAccordion>
          <div ndsAccordionItem value="senha">
            <button ndsAccordionTrigger>Como redefinir minha senha?</button>
            <div ndsAccordionContent>
              Acesse a tela de login e clique em "Esqueci minha senha".
            </div>
          </div>
          <div ndsAccordionItem value="pagamento">
            <button ndsAccordionTrigger>Quais formas de pagamento são aceitas?</button>
            <div ndsAccordionContent>Cartão de crédito, Pix e boleto bancário.</div>
          </div>
          <div ndsAccordionItem value="cancelamento">
            <button ndsAccordionTrigger>Como cancelar minha assinatura?</button>
            <div ndsAccordionContent>Acesse Configurações, Assinatura, Cancelar.</div>
          </div>
          <div ndsAccordionItem value="dados">
            <button ndsAccordionTrigger>Como excluir meus dados?</button>
            <div ndsAccordionContent>Envie uma solicitação pelo canal de privacidade.</div>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Cada pergunta é um gatilho dentro de um heading', async () => {
      // O `h2` da seção e o `h3` de cada item mantêm a hierarquia de títulos —
      // é como quem navega por headings encontra a pergunta.
      await expect(canvas.getByRole('heading', { level: 2 })).toBeVisible();
      await expect(canvas.getAllByRole('heading', { level: 3 }).length).toBe(4);
    });

    await step('Abrir uma pergunta fecha a anterior (modo único)', async () => {
      const gatilhos = canvas.getAllByRole('button');
      await abrir(gatilhos[0]);
      await abrir(gatilhos[1]);
      await expect(gatilhos[0]).toHaveAttribute('aria-expanded', 'false');
    });
  },
};
