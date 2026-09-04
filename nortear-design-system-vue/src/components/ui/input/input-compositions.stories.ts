import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect } from 'storybook/test';
import { XIcon } from 'lucide-vue-next';
import { Input } from './index';
import { Label } from '@/components/ui/label';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
  InputGroupText,
} from '@/components/ui/input-group';
import {
  inputAddonWithButtonSource,
  inputAlinhamentosSource,
  inputWithHelperSource,
  inputWithErrorSource,
  inputWithLabelSource,
  inputObrigatorioSource,
} from './input.source';

const meta = {
  title: 'Components/Form/Input/Compositions',
  component: Input,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: inputWithLabelSource },
      description: {
        component:
          'O Input deve ser sempre acompanhado de um rótulo acessível. Composicoes comuns: com Label, com texto de apoio, com mensagem de erro e dentro de um InputGroup, que envolve o campo com prefixos, sufixos e botões internos.',
      },
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithLabel: Story = {
  render: () => ({
    components: { Input, Label },
    template: `
      <div class="nds-stack nds-w-xs" data-spacing="xs">
        <Label for="nome-completo">Nome completo</Label>
        <Input id="nome-completo" type="text" placeholder="ex: João da Silva" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Label está visível', async () => {
      await expect(canvas.getByText('Nome completo')).toBeVisible();
    });

    await step('Input alcançável pelo rótulo', async () => {
      await expect(canvas.getByLabelText('Nome completo')).toBeVisible();
    });

    await step('Clicar no rótulo leva o foco ao campo', async () => {
      // É o que a seção Composições promete e nenhuma stack verificava: o par
      // `for`/`id` existir não garante que o clique chegue ao campo.
      await userEvent.click(canvas.getByText('Nome completo'));
      await expect(canvas.getByLabelText('Nome completo')).toHaveFocus();
    });

    await step('Digitar no campo associado ao rótulo funciona', async () => {
      const input = canvas.getByLabelText('Nome completo');
      await userEvent.clear(input);
      await userEvent.type(input, 'Maria Silva');
      await expect(input).toHaveValue('Maria Silva');
    });
  },
};

export const WithSupportText: Story = {
  // O apoio visível não basta: o `aria-describedby` que o liga ao campo é a
  // lição, e ele não existe na marcação do `meta`.
  parameters: { docs: { source: { transform: inputWithHelperSource } } },
  render: () => ({
    components: { Input, Label },
    template: `
      <div class="nds-stack nds-w-xs" data-spacing="xs">
        <Label for="email-apoio">Email</Label>
        <Input id="email-apoio" type="email" placeholder="ex: joao@empresa.com" aria-describedby="email-apoio-hint" />
        <p id="email-apoio-hint" class="nds-text-caption nds-text-muted-foreground">Usaremos este endereço para notificações.</p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Rótulo, campo e texto de apoio estão visíveis', async () => {
      await expect(canvas.getByLabelText('Email')).toBeVisible();
      await expect(canvas.getByText(/Usaremos este endereço/)).toBeVisible();
    });

    await step('O texto de apoio é lido junto com o campo', async () => {
      // Hint visível mas sem describedby não chega ao leitor de tela — era o
      // caso desta composição até esta rodada.
      const input = canvas.getByLabelText('Email');
      await expect(input).toHaveAttribute('aria-describedby', 'email-apoio-hint');
      await expect(canvasElement.ownerDocument.getElementById('email-apoio-hint')).not.toBeNull();
    });
  },
};

export const ErrorMessage: Story = {
  // `aria-invalid` mais a mensagem apontada por `aria-describedby`: a cor da
  // borda sozinha não alcança quem não enxerga.
  parameters: { docs: { source: { transform: inputWithErrorSource } } },
  render: () => ({
    components: { Input, Label },
    template: `
      <div class="nds-stack nds-w-xs" data-spacing="xs">
        <Label for="email-erro">Email</Label>
        <Input
          id="email-erro"
          type="email"
          placeholder="ex: joao@empresa.com"
          aria-invalid="true"
          aria-describedby="email-erro-msg"
        />
        <p id="email-erro-msg" class="nds-text-body nds-text-destructive">
          Email inválido. Use o formato nome@dominio.com
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText('Email');

    await step('Campo marcado como inválido', async () => {
      await expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    await step('aria-describedby aponta para a mensagem que existe', async () => {
      await expect(input).toHaveAttribute('aria-describedby', 'email-erro-msg');
      await expect(canvasElement.ownerDocument.getElementById('email-erro-msg')).not.toBeNull();
    });

    await step('Mensagem de erro visível', async () => {
      await expect(canvas.getByText(/Email inválido/)).toBeVisible();
    });
  },
};

export const RequiredField: Story = {
  // O par `aria-required` + asterisco fora da leitura é o que a story ensina, e
  // nenhum dos dois está no `meta`.
  parameters: { docs: { source: { transform: inputObrigatorioSource } } },
  render: () => ({
    components: { Input, Label },
    template: `
      <div class="nds-stack nds-w-xs" data-spacing="xs">
        <Label for="nome-obrig">
          Nome completo
          <span class="nds-text-destructive" aria-hidden="true">*</span>
        </Label>
        <Input id="nome-obrig" type="text" placeholder="ex: João da Silva" aria-required="true" />
        <p class="nds-text-caption nds-text-muted-foreground">Campos com * são obrigatórios.</p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Campo obrigatório é anunciado por ARIA', async () => {
      await expect(canvas.getByRole('textbox')).toHaveAttribute('aria-required', 'true');
    });

    await step('O asterisco decorativo fica fora da leitura', async () => {
      // Sem `aria-hidden` o leitor anunciaria "Nome completo asterisco", e a
      // obrigatoriedade já vem do `aria-required`.
      await expect(canvasElement.querySelector('[aria-hidden="true"]')?.textContent).toBe('*');
    });
  },
};

/**
 * Fecha `functional.item7` e `visual.item4`. Os três alinhamentos numa captura
 * só — e as asserções afirmam o PIXEL, não o atributo: quem posiciona é a
 * propriedade `order` no CSS, e um `align` no elemento errado passaria batido.
 */
export const Alignments: Story = {
  parameters: {
    covers: ['functional.item7', 'visual.item4'],
    // Outro componente em volta do campo (o grupo) e os três alinhamentos de
    // acessório: nada disso aparece no snippet do `meta`.
    docs: { source: { transform: inputAlinhamentosSource } },
  },
  render: () => ({
    components: { Label, InputGroup, InputGroupAddon, InputGroupInput, InputGroupText },
    template: `
      <div class="nds-stack nds-w-md" data-spacing="lg">
        <div class="nds-stack" data-spacing="xs">
          <Label for="ig-inicio">Buscar</Label>
          <InputGroup>
            <InputGroupAddon align="inline-start" data-testid="addon-inicio">
              <InputGroupText>@</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput id="ig-inicio" type="search" placeholder="Buscar" />
          </InputGroup>
        </div>

        <div class="nds-stack" data-spacing="xs">
          <Label for="ig-fim">Atalho</Label>
          <InputGroup>
            <InputGroupInput id="ig-fim" placeholder="Comando" />
            <InputGroupAddon align="inline-end" data-testid="addon-fim">
              <InputGroupText>Ctrl+K</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </div>

        <div class="nds-stack" data-spacing="xs">
          <Label for="ig-bloco">Mensagem</Label>
          <InputGroup>
            <InputGroupAddon align="block-start" data-testid="addon-bloco">
              <InputGroupText>Para: suporte</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput id="ig-bloco" placeholder="Assunto" />
          </InputGroup>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const q = <T extends HTMLElement>(sel: string) => canvasElement.querySelector<T>(sel)!;

    await step('O alinhamento vira data-align, que é o que o CSS lê', async () => {
      for (const [id, align] of [
        ['addon-inicio', 'inline-start'],
        ['addon-fim', 'inline-end'],
        ['addon-bloco', 'block-start'],
      ] as const) {
        await expect(q(`[data-testid="${id}"]`)).toHaveAttribute('data-align', align);
      }
    });

    await step('O addon fica DO LADO que o nome promete', async () => {
      await expect(q('[data-testid="addon-inicio"]').getBoundingClientRect().left)
        .toBeLessThan(q('#ig-inicio').getBoundingClientRect().left);
      await expect(q('[data-testid="addon-fim"]').getBoundingClientRect().left)
        .toBeGreaterThan(q('#ig-fim').getBoundingClientRect().left);
    });

    await step('block-start empilha: o grupo vira coluna', async () => {
      await expect(q('[data-testid="addon-bloco"]').getBoundingClientRect().bottom)
        .toBeLessThanOrEqual(q('#ig-bloco').getBoundingClientRect().top + 1);
    });

    await step('A moldura é do GRUPO; o campo interno fica nu', async () => {
      // É o ponto do componente: uma borda só em volta de tudo. Se o campo
      // mantivesse a própria, apareceria uma linha dupla no meio.
      const group = q('[data-slot="input-group"]');
      await expect(parseFloat(getComputedStyle(group).borderTopWidth)).toBeGreaterThan(0);
      await expect(parseFloat(getComputedStyle(q('#ig-inicio')).borderTopWidth)).toBe(0);
    });

    await step('O grupo é uma região só para o leitor de tela', async () => {
      await expect(q('[data-slot="input-group"]')).toHaveAttribute('role', 'group');
    });
  },
};

/** Fecha `functional.item8`. */
export const AddonClick: Story = {
  parameters: {
    covers: ['functional.item8'],
    // O botão dentro do acessório, com ícone e nome próprio, é a peça nova.
    docs: { source: { transform: inputAddonWithButtonSource } },
  },
  render: () => ({
    components: { Label, InputGroup, InputGroupAddon, InputGroupInput, InputGroupButton, InputGroupText, XIcon },
    // Ícone, e não a letra "x": o glifo sozinho dava um alvo de 19.8x21.5px e o
    // axe reprovava por target-size (WCAG 2.5.8, mínimo 24x24). O `.nds-button`
    // dimensiona pelo ícone, como nas demais stacks.
    template: `
      <div class="nds-stack nds-w-md" data-spacing="xs">
        <Label for="ig-clique">Usuário</Label>
        <InputGroup>
          <InputGroupAddon align="inline-start" data-testid="addon">
            <InputGroupText>@</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput id="ig-clique" placeholder="nome.usuario" />
          <InputGroupAddon align="inline-end">
            <InputGroupButton type="button" size="icon-sm" aria-label="Limpar">
              <XIcon aria-hidden="true" />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = () => canvasElement.querySelector<HTMLInputElement>('#ig-clique')!;

    await step('Clicar no addon leva o foco ao campo', async () => {
      // A área toda parece o campo. Quem mira o "@" espera começar a digitar.
      await userEvent.click(canvasElement.querySelector<HTMLElement>('[data-testid="addon"]')!);
      await expect(field()).toHaveFocus();
    });

    await step('Clicar no BOTÃO dentro do addon não devolve o foco ao campo', async () => {
      // Sem esta distinção, apertar "Limpar" devolveria o foco ao campo no meio
      // da ação — e quem navega por teclado perderia o lugar.
      await userEvent.click(canvas.getByRole('button', { name: 'Limpar' }));
      await expect(field()).not.toHaveFocus();
    });
  },
};
