import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent, waitFor, fn } from 'storybook/test';
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

import { figmaDesign } from '@shared/figma/design-links';
const meta: Meta = {
  tags: ['overlay'],
  title: 'Components/Overlay/Popover/Variants',
  parameters: {
    design: figmaDesign('popover'),
    actions: { disable: true },
    // `centered`, como as outras quatro — ver a nota do meta de `-states`.
    layout: 'centered',
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
          text: 'Use Ctrl+K para abrir a busca em qualquer tela.',
          ariaLabel: 'Informações adicionais',
        }),
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Ver atalhos' });

    const content = document.createElement('p');
    content.textContent = 'Use Ctrl+K para abrir a busca em qualquer tela.';

    const el = createPopover({ trigger, content, ariaLabel: 'Informações adicionais' });
    queueMicrotask(() => { if (trigger.isConnected) trigger.click(); });
    return centralizar(el);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /ver atalhos/i });

    await step('Sem título, o painel se nomeia por aria-label', async () => {
      // `role="dialog"` sem nome reprova na regra aria-dialog-name do axe — e o
      // nome herdado do gatilho anunciaria o botão, não o painel.
      const p = await open(trigger);
      await expect(p).toHaveAttribute('aria-label', 'Informações adicionais');
      await expect(p).not.toHaveAttribute('aria-labelledby');
    });

    await step('E carrega a classe do design system com o conteúdo livre', async () => {
      await expect(panel()).toHaveClass(/nds-popover-content/);
      await expect(panel()!.textContent).toMatch(/Ctrl\+K/);
    });
  },
};

export const WithTitle: Story = {
  // `accessibility.item3` veio da `Focused`, que perdeu a descrição do painel e
  // com ela o direito de reivindicar `aria-describedby`.
  parameters: { covers: ['visual.item2', 'accessibility.item5', 'accessibility.item3'] },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Configurações de exibição' });

    // Cabeçalho, título e descrição saem das sub-fábricas. Montar a `<div>` e
    // escrever `.nds-popover-title` à mão era o contorno de quando elas não
    // existiam — e nesse caminho o `data-slot` documentado dependia de quem
    // compunha lembrar de escrevê-lo.
    const header = createPopoverHeader();
    header.append(
      createPopoverTitle({ text: 'Configurações de exibição' }),
      createPopoverDescription({ text: 'Ajuste a aparência do conteúdo da página.' }),
    );

    // O rodapé de ações, que as outras quatro stacks já tinham nesta variante e
    // esta não. Medido em 2026-09-17: sem ele o painel desta story não tinha
    // NENHUM focável, e por isso os dois passos de teclado — o Tab entre os
    // controles internos e o anel de foco — existiam em quatro stacks e faltavam
    // aqui. Comparar as cinco páginas deixava de responder como é a variante
    // recomendada.
    //
    // Os dois caminhos de fechamento são os mesmos do Playground: o Cancelar leva
    // `data-slot="popover-close"` e a delegação da fábrica o relata como
    // `close-button`; o Salvar não leva a marca e fecha por CÓDIGO, com o
    // `close()` que só existe depois de a fábrica devolver.
    const actions = document.createElement('div');
    actions.className = 'nds-cluster';
    actions.dataset.spacing = 'sm';
    actions.dataset.justify = 'end';
    const cancel = createButton({ variant: 'ghost', size: 'sm', label: 'Cancelar' });
    cancel.dataset.slot = 'popover-close';
    const save = createButton({ variant: 'default', size: 'sm', label: 'Salvar' });
    actions.append(cancel, save);

    const content = document.createElement('div');
    content.className = 'nds-stack';
    content.dataset.spacing = 'sm';
    content.append(header, actions);

    const el = createPopover({ trigger, content });
    save.addEventListener('click', () => {
      // …aqui entraria a gravação do formulário…
      el.close();
    });
    queueMicrotask(() => { if (trigger.isConnected) trigger.click(); });
    return centralizar(el);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Configurações de exibição' });

    await step('O título nomeia o painel por aria-labelledby', async () => {
      const p = await open(trigger);
      const id = p.getAttribute('aria-labelledby');
      await expect(id).toBeTruthy();
      const title = document.getElementById(id!)!;
      await expect(title).toHaveAttribute('data-slot', 'popover-title');
      await expect(title).toHaveClass(/nds-popover-title/);
      await expect(title.textContent?.trim()).toBe('Configurações de exibição');
    });

    await step('E a descrição usa a classe própria, não a de título', async () => {
      const desc = panel()!.querySelector('[data-slot="popover-description"]')!;
      await expect(desc).toHaveClass(/nds-popover-description/);
      await expect(desc.textContent).toMatch(/Ajuste a aparência/);
    });

    await step('A descrição entra por aria-describedby', async () => {
      const idDescription = panel()!.getAttribute('aria-describedby');
      await expect(idDescription).toBeTruthy();
      await expect(document.getElementById(idDescription!)).toHaveClass(/nds-popover-description/);
    });

    await step('Tab caminha entre os controles internos', async () => {
      const ctx = within(panel()!);
      const cancel = ctx.getByRole('button', { name: /Cancelar/i });
      const save = ctx.getByRole('button', { name: /Salvar/i });
      cancel.focus();
      await userEvent.tab();
      await expect(save).toHaveFocus();
    });

    await step('E o elemento focado por teclado mostra o anel de foco', async () => {
      // `:focus-visible` é a condição exata que o CSS compartilhado usa para
      // desenhar o anel — se o foco tivesse vindo do ponteiro, o navegador não
      // casaria a pseudo-classe e o anel não apareceria.
      const save = within(panel()!).getByRole('button', { name: /Salvar/i });
      await expect(save.matches(':focus-visible')).toBe(true);
      // O anel de `.nds-button` é box-shadow, não outline — medir a propriedade
      // errada daria verde em qualquer elemento.
      await expect(getComputedStyle(save).boxShadow).not.toBe('none');
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

/**
 * Espião do `onOpenChange` da `Form`, no módulo para a play alcançá-lo: é ele
 * que prova que confirmar chega ao relatório como `api`, e não só que o painel
 * sumiu.
 */
const formOpenChange = fn();

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
    content.dataset.spacing = 'md';

    const title = createPopoverTitle({ text: 'Editar perfil' });
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

    const el = createPopover({ trigger, content, onOpenChange: formOpenChange });
    // Confirmar fecha por CÓDIGO, depois de salvar — o motivo que chega ao
    // `onOpenChange` é `api`. Só a peça marcada com `data-slot="popover-close"`
    // relata `close-button`, e ela é a de DESISTIR. O ouvinte entra aqui porque
    // o `close()` só existe depois da fábrica.
    content.addEventListener('submit', (e) => {
      e.preventDefault();
      // …aqui entraria a gravação do perfil…
      el.close();
    });
    queueMicrotask(() => { if (trigger.isConnected) trigger.click(); });
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

    await step('O Atualizar fecha por CÓDIGO e informa api', async () => {
      const p = await open(trigger);
      const update = within(p).getByRole('button', { name: /atualizar/i });
      // Sem a marca de fechar: ele é o submit DO formulário, e quem fecha é o
      // `close()` do ouvinte — motivo `api`, "salvou e fechou".
      await expect(update).not.toHaveAttribute('data-slot', 'popover-close');
      await userEvent.click(update);
      await waitFor(() => {
        if (panel()) throw new Error('o Atualizar não fechou o painel');
      });
      await expect(formOpenChange).toHaveBeenLastCalledWith(false, 'api');
    });

    await step('O Enter num campo envia o formulário e fecha com api', async () => {
      // Metade das pessoas envia formulário pelo Enter, e é o caminho que só o
      // ouvinte de `submit` cobre — um `click` no botão não o alcança.
      const p = await open(trigger);
      const name = within(p).getByLabelText(/nome/i);
      name.focus();
      await userEvent.keyboard('{Enter}');
      await waitFor(() => {
        if (panel()) throw new Error('o formulário não fechou o painel pelo Enter');
      });
      await expect(formOpenChange).toHaveBeenLastCalledWith(false, 'api');
    });

    // Termina ABERTA: é este estado que o axe varre e o Chromatic fotografa.
    await step('Estado final: painel aberto', async () => {
      await expect(await open(trigger)).toBeVisible();
    });
  },
};
