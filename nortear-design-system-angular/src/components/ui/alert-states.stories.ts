import { figmaDesign } from '@shared/figma/design-links';
import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import {
  NdsAlert,
  NdsAlertTitle,
  NdsAlertDescription,
  NdsAlertIcon,
} from './alert';
import { NdsButton } from './button';
import {
  alertCompleteSource,
  alertDynamicInsertionSource,
  alertWithoutAnnouncementSource,
  alertWithoutIconSource,
  alertWithoutTitleSource,
} from './alert.source';

// "Configurações" no conteúdo compartilhado: o Alert não tem estado interativo,
// o que varia é a composição (com/sem título, com/sem ícone) e a semântica de
// anúncio. O título da story segue "Estados" para não quebrar o storySort.
const meta: Meta = {
  title: 'Components/Feedback/Alert/States',
  tags: ['feedback'],
  decorators: [
    moduleMetadata({
      imports: [NdsAlert, NdsAlertTitle, NdsAlertDescription, NdsAlertIcon, NdsButton],
    }),
  ],
  parameters: {
    layout: 'padded',
    design: figmaDesign('alert'),
    controls: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

export const Complete: Story = {
  parameters: { docs: { source: { transform: alertCompleteSource } } },
  render: () => ({
    template: `
      <div ndsAlert>
        <svg ndsAlertIcon kind="info"></svg>
        <h5 ndsAlertTitle>Atenção</h5>
        <section ndsAlertDescription>Suas alterações serão aplicadas na próxima sessão.</section>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Ícone, título e descrição juntos', async () => {
      const alerta = canvas.getByRole('alert');
      await expect(alerta.querySelector(':scope > svg')).toBeTruthy();
      await expect(canvas.getByText('Atenção')).toBeVisible();
      await expect(canvas.getByText(/próxima sessão/)).toBeVisible();
    });

    await step('O ícone ganha a coluna 1 do grid', async () => {
      // `:has(> svg)` é o que abre a coluna. Sem a medida, um ícone empurrado
      // para dentro de um wrapper passaria: as classes continuariam certas e só
      // o layout estaria errado.
      const alerta = canvas.getByRole('alert');
      const colunas = getComputedStyle(alerta).gridTemplateColumns.split(' ');
      await expect(parseFloat(colunas[0])).toBeGreaterThan(0);
    });
  },
};

export const WithoutTitle: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item3'],
    docs: { source: { transform: alertWithoutTitleSource } },
  },
  render: () => ({
    template: `
      <div ndsAlert>
        <svg ndsAlertIcon kind="info"></svg>
        <section ndsAlertDescription>Suas alterações serão aplicadas na próxima sessão.</section>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Alert visível sem título', async () => {
      await expect(canvas.getByRole('alert')).toBeVisible();
    });

    await step('Nenhum heading no DOM', async () => {
      const alerta = canvas.getByRole('alert');
      await expect(alerta.querySelector('[data-slot="alert-title"]')).toBeNull();
      await expect(alerta.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
    });

    await step('A descrição ocupa a coluna do conteúdo, sem quebra de layout', async () => {
      const alerta = canvas.getByRole('alert');
      const descricao = alerta.querySelector<HTMLElement>('[data-slot="alert-description"]')!;
      // Sem título a descrição sobe para a primeira linha; o que não pode é
      // escorregar para a coluna do ícone.
      await expect(descricao.getBoundingClientRect().left).toBeGreaterThan(
        alerta.getBoundingClientRect().left,
      );
    });
  },
};

export const WithoutIcon: Story = {
  parameters: { docs: { source: { transform: alertWithoutIconSource } } },
  render: () => ({
    template: `
      <div ndsAlert>
        <h5 ndsAlertTitle>Atenção</h5>
        <section ndsAlertDescription>Suas alterações serão aplicadas na próxima sessão.</section>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Alert visível sem ícone', async () => {
      await expect(canvas.getByRole('alert')).toBeVisible();
    });

    await step('Sem SVG filho direto', async () => {
      const alerta = canvas.getByRole('alert');
      await expect(alerta.querySelector(':scope > svg')).toBeNull();
    });
  },
};

export const WithoutAnnouncement: Story = {
  parameters: { docs: { source: { transform: alertWithoutAnnouncementSource } } },
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="md">
        <!-- Estático: já está na tela quando a página carrega — não pode ser live region. -->
        <div ndsAlert role="note">
          <svg ndsAlertIcon kind="info"></svg>
          <h5 ndsAlertTitle>Nota de implementação</h5>
          <section ndsAlertDescription>Conteúdo estático: o leitor de tela lê na ordem do documento, sem interromper.</section>
        </div>
        <!-- Sem o input, o default segue sendo a live region assertiva. -->
        <div ndsAlert variant="destructive">
          <svg ndsAlertIcon kind="error"></svg>
          <h5 ndsAlertTitle>Falha no envio</h5>
          <section ndsAlertDescription>Mensagem urgente surgida em tempo de execução: anúncio imediato.</section>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('role="note" não é live region', async () => {
      const noteAlert = canvas.getByText('Nota de implementação').closest('.nds-alert');
      await expect(noteAlert).toHaveAttribute('role', 'note');
    });

    await step('Sem `role`, o default continua alert', async () => {
      const defaultAlert = canvas.getByText('Falha no envio').closest('.nds-alert');
      await expect(defaultAlert).toHaveAttribute('role', 'alert');
      await expect(canvas.getByRole('alert')).toBe(defaultAlert);
    });

    await step('A nota não aparece como alert para o leitor de tela', async () => {
      await expect(canvas.getAllByRole('alert')).toHaveLength(1);
      await expect(canvas.getByRole('note')).toBeVisible();
    });
  },
};

// Fora do render para a play alcançar: é por ele que o replay volta ao estado
// inicial. O render o zera a cada montagem.
const reportGenerated = signal(false);

/**
 * O alerta SURGE depois de uma ação, e é isso que faz o `role="alert"` anunciar.
 * Nenhum contêiner `aria-live` em volta: a raiz já é região viva, e um segundo
 * nível aninharia duas.
 */
export const DynamicInsertion: Story = {
  parameters: {
    covers: ['functional.item6'],
    docs: { source: { transform: alertDynamicInsertionSource } },
  },
  render: () => {
    reportGenerated.set(false);
    return {
      props: { generated: reportGenerated },
      template: `
      <div class="nds-stack" data-spacing="sm">
        <div>
          <button ndsButton variant="default" size="sm" (click)="generated.set(true)">Gerar relatório</button>
        </div>
        @if (generated()) {
          <div ndsAlert>
            <svg ndsAlertIcon kind="success"></svg>
            <h5 ndsAlertTitle>Operação concluída</h5>
            <section ndsAlertDescription>O relatório foi gerado com sucesso.</section>
          </div>
        }
      </div>
    `,
    };
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Antes da ação não há alerta', async () => {
      // O painel Interactions reexecuta só a play, no MESMO DOM: o alerta da
      // rodada anterior ainda está lá. Volta ao estado inicial e espera sumir.
      reportGenerated.set(false);
      await waitFor(() => expect(canvas.queryByRole('alert')).toBeNull());
    });

    await step('Depois da ação o alerta aparece com role="alert"', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Gerar relatório' }));
      const alerta = await waitFor(() => canvas.getByRole('alert'));
      await expect(alerta).toHaveAttribute('role', 'alert');
      await expect(alerta).toBeVisible();
      await expect(alerta).toHaveTextContent('Operação concluída');
    });

    await step('Nenhum ancestral é região aria-live', async () => {
      const alerta = canvas.getByRole('alert');
      await expect(alerta.parentElement?.closest('[aria-live]') ?? null).toBeNull();
      await expect(alerta).not.toHaveAttribute('aria-live');
    });
  },
};
