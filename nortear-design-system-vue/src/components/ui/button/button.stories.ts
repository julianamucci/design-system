import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, fn, userEvent, expect } from 'storybook/test';
import { Button } from './index';
import ButtonDocs from '@/components/docs/ButtonDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { buttonSource } from './button.source';

const meta: Meta<any> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs', 'form'],
  parameters: {
    design: figmaDesign('button'),
    docs: { page: withAutoDocsTab(ButtonDocs), source: { transform: buttonSource } },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'Variante visual do botão',
    },
    size: {
      control: 'select',
      options: ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'],
      description: 'Tamanho do botão',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita interação com o botão',
    },
    // A aba "API Reference" documenta a API real; o Playground não encaminha
    // estas três, então control ativo aqui seria controle morto.
    asChild: {
      control: false,
      description: 'Renderiza o elemento filho no lugar do <button>, mantendo os estilos.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    type: {
      control: false,
      description: 'Tipo HTML do botão. Use "submit" dentro de forms.',
      table: { type: { summary: '"button" | "submit" | "reset"' }, defaultValue: { summary: '"button"' } },
    },
    class: {
      control: false,
      description: 'Classes adicionais, mescladas com as da variante.',
      table: { type: { summary: 'string' } },
    },
    onClick: {
      control: false,
      description: 'Callback disparado ao clique. Não dispara quando desabilitado.',
      table: { type: { summary: '(e: MouseEvent) => void' } },
    },
  },
  args: {
    variant: 'default',
    size: 'default',
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item3',
      'functional.item4',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item5',
      'visual.item1',
    ],
  },
  args: {
    onClick: fn(),
  } as never,
  render: (args) => ({
    components: { Button },
    setup() { return { args }; },
    template: `
      <Button v-bind="args" @click="args.onClick">Botão</Button>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await step('Botão está presente e visível', async () => {
      await expect(button).toBeInTheDocument();
      await expect(button).toBeVisible();
    });

    await step('O botão nativo declara type=button', async () => {
      // Sem o atributo o navegador assume submit: dentro de um <form>, um
      // "Cancelar" envia a página. Medido nas cinco stacks, o Vue era a única
      // sem declarar — e nenhuma story monta form, então nada acusava.
      await expect(button).toHaveAttribute('type', 'button');
    });


    await step('Clique dispara onClick', async () => {
      await userEvent.click(button);
      await expect((args as { onClick: ReturnType<typeof fn> }).onClick).toHaveBeenCalledTimes(1);
    });

    await step('Tab leva o foco ao botão', async () => {
      // userEvent.tab() e não .focus(): o documentado é "recebe foco na ordem
      // natural do DOM". Forçar o foco passaria até com tabindex="-1".
      // O clique do passo anterior deixou o foco no botão; sem zerar, o Tab
      // sairia dele e a asserção mediria o contrário do que promete.
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(button).toHaveFocus();
    });

    await step('Enter dispara onClick', async () => {
      (button as HTMLElement).focus();
      await userEvent.keyboard('{Enter}');
      await expect((args as { onClick: ReturnType<typeof fn> }).onClick).toHaveBeenCalledTimes(2);
    });

    await step('Space dispara onClick', async () => {
      (button as HTMLElement).focus();
      await userEvent.keyboard(' ');
      await expect((args as { onClick: ReturnType<typeof fn> }).onClick).toHaveBeenCalledTimes(3);
    });
  },
};
