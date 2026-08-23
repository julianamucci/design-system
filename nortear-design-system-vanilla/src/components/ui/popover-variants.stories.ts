import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent } from 'storybook/test';
import {
  createPopover,
  createPopoverDescription,
  createPopoverHeader,
  createPopoverTitle,
} from './popover';
import { open, centralizar, panel } from './popover.fixtures';
import { popoverSource, popoverSourceWith, popoverSourceForm } from './popover.source';
import { createButton } from './button';
import { createInput } from './input';
import { createLabel } from './label';

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/Popover/Variants',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: popoverSource },
      description: {
        component:
          'Conteúdo livre, cabeçalho com título e descrição, e formulário inline. ' +
          'O painel sempre precisa de nome acessível: com título ele vem do ' +
          'aria-labelledby, sem título ele herda o texto do gatilho.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  parameters: {
    covers: ['visual.item1'],
    // Override de story: aqui o conteúdo é texto puro, e o snippet do meta
    // mostraria as sub-fábricas de cabeçalho que esta story não usa.
    docs: {
      source: {
        transform: popoverSourceWith({
          triggerLabel: 'Ver atalhos',
          text: 'Use Ctrl + K para abrir a busca em qualquer tela.',
        }),
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Ver atalhos' });

    const content = document.createElement('p');
    content.className = 'nds-text-body';
    content.textContent = 'Use Ctrl + K para abrir a busca em qualquer tela.';

    const el = createPopover({ trigger, content });
    queueMicrotask(() => trigger.click());
    return centralizar(el);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /ver atalhos/i });

    await step('Sem título, o painel herda o nome acessível do gatilho', async () => {
      // `role="dialog"` sem nome reprova na regra aria-dialog-name do axe.
      const p = await open(trigger);
      await expect(p).toHaveAttribute('aria-label', 'Ver atalhos');
      await expect(p).not.toHaveAttribute('aria-labelledby');
    });

    await step('E carrega a classe do design system com o conteúdo livre', async () => {
      await expect(panel()).toHaveClass(/nds-popover-content/);
      await expect(panel()!.textContent).toMatch(/Ctrl \+ K/);
    });
  },
};

export const WithTitle: Story = {
  parameters: { covers: ['visual.item2', 'accessibility.item5'] },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Configuracoes de exibição' });

    // Cabeçalho, título e descrição saem das sub-fábricas. Montar a `<div>` e
    // escrever `.nds-popover-title` à mão era o contorno de quando elas não
    // existiam — e nesse caminho o `data-slot` documentado dependia de quem
    // compunha lembrar de escrevê-lo.
    const content = createPopoverHeader();
    content.append(
      createPopoverTitle({ text: 'Configuracoes de exibição' }),
      createPopoverDescription({ text: 'Ajuste a aparência do conteúdo da página.' }),
    );

    const el = createPopover({ trigger, content });
    queueMicrotask(() => trigger.click());
    return centralizar(el);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Configuracoes de exibição' });

    await step('O título nomeia o painel por aria-labelledby', async () => {
      const p = await open(trigger);
      const id = p.getAttribute('aria-labelledby');
      await expect(id).toBeTruthy();
      const title = document.getElementById(id!)!;
      await expect(title).toHaveAttribute('data-slot', 'popover-title');
      await expect(title).toHaveClass(/nds-popover-title/);
      await expect(title.textContent?.trim()).toBe('Configuracoes de exibição');
    });

    await step('E a descrição usa a classe própria, não a de título', async () => {
      const desc = panel()!.querySelector('[data-slot="popover-description"]')!;
      await expect(desc).toHaveClass(/nds-popover-description/);
      await expect(desc.textContent).toMatch(/Ajuste a aparência/);
    });

    await step('O cabeçalho é uma peça, não uma div com classe escrita à mão', async () => {
      const header = panel()!.querySelector('[data-slot="popover-header"]')!;
      await expect(header).toHaveClass(/nds-popover-header/);
      // Título e descrição moram DENTRO dele: é o cabeçalho que dá o respiro
      // entre os dois, e a folha compartilhada só o entrega nesse aninhamento.
      await expect(header.querySelector('[data-slot="popover-title"]')).not.toBeNull();
      await expect(header.querySelector('[data-slot="popover-description"]')).not.toBeNull();
    });
  },
};

export const Form: Story = {
  parameters: {
    covers: ['visual.item3'],
    // Override de story: o conteúdo interativo pede outra FORMA de snippet —
    // rótulo, campo e submit dentro do painel.
    docs: { source: { transform: popoverSourceForm({ triggerLabel: 'Editar perfil' }) } },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Editar perfil' });

    const content = document.createElement('form');
    content.className = 'nds-stack';
    content.dataset.spacing = 'sm';
    content.addEventListener('submit', (e) => e.preventDefault());

    const title = document.createElement('h4');
    title.className = 'nds-popover-title';
    title.dataset.slot = 'popover-title';
    title.textContent = 'Editar perfil';
    content.appendChild(title);

    const nameRow = document.createElement('div');
    nameRow.className = 'nds-stack';
    nameRow.dataset.spacing = 'xs';
    nameRow.append(
      createLabel({ text: 'Nome', htmlFor: 'pv-name' }),
      createInput({ id: 'pv-name', value: 'Ana Ribeiro' }),
    );

    const emailRow = document.createElement('div');
    emailRow.className = 'nds-stack';
    emailRow.dataset.spacing = 'xs';
    emailRow.append(
      createLabel({ text: 'Email', htmlFor: 'pv-email' }),
      createInput({ id: 'pv-email', type: 'email', value: 'ana@nortear.com.br' }),
    );

    const submit = createButton({ variant: 'default', size: 'sm', label: 'Atualizar', type: 'submit' });

    content.append(nameRow, emailRow, submit);

    const el = createPopover({ trigger, content });
    queueMicrotask(() => trigger.click());
    return centralizar(el);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /editar perfil/i });

    await step('Os campos existem e estão associados aos rótulos', async () => {
      const p = await open(trigger);
      const ctx = within(p);
      await expect(ctx.getByLabelText(/nome/i)).toHaveValue('Ana Ribeiro');
      await expect(ctx.getByLabelText(/email/i)).toHaveValue('ana@nortear.com.br');
      await expect(ctx.getByRole('button', { name: /atualizar/i })).toBeInTheDocument();
    });

    await step('E aceitam digitação — o painel não é inerte', async () => {
      // Conteúdo interativo dentro do painel é a razão de existir do popover.
      const name = within(panel()!).getByLabelText(/nome/i);
      await userEvent.clear(name);
      await userEvent.type(name, 'Bruno Lima');
      await expect(name).toHaveValue('Bruno Lima');
    });
  },
};
