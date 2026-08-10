import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect } from 'storybook/test';
import {
  NdsAlert,
  NdsAlertTitle,
  NdsAlertDescription,
  NdsAlertIcon,
} from './alert';

// "Configurações" no conteúdo compartilhado: o Alert não tem estado interativo,
// o que varia é a composição (com/sem título, com/sem ícone) e a semântica de
// anúncio. O título da story segue "Estados" para não quebrar o storySort.
const meta: Meta = {
  title: 'UI/Alert/Estados',
  tags: ['feedback'],
  decorators: [
    moduleMetadata({
      imports: [NdsAlert, NdsAlertTitle, NdsAlertDescription, NdsAlertIcon],
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

export const Completo: Story = {
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

export const SemTitulo: Story = {
  parameters: { covers: ['functional.item4', 'visual.item3'] },
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

export const SemIcone: Story = {
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

export const SemAnuncio: Story = {
  parameters: { covers: ['accessibility.item1'] },
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="sm">
        <!-- Estático: não deve virar live region. -->
        <div ndsAlert role="note">
          <svg ndsAlertIcon kind="info"></svg>
          <h5 ndsAlertTitle>Nota de implementação</h5>
          <section ndsAlertDescription>Conteúdo já presente no carregamento — o leitor de tela não é interrompido.</section>
        </div>
        <!-- Sem o input, o default segue sendo a live region assertiva. -->
        <div ndsAlert>
          <svg ndsAlertIcon kind="error"></svg>
          <h5 ndsAlertTitle>Sessão expirada</h5>
          <section ndsAlertDescription>Mensagem urgente que surge em tempo de execução.</section>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('role=note não é live region', async () => {
      const nota = canvas.getByText('Nota de implementação').closest('[data-slot="alert"]');
      await expect(nota).toHaveAttribute('role', 'note');
    });

    await step('O default continua role=alert', async () => {
      const padrao = canvas.getByRole('alert');
      await expect(padrao).toHaveAttribute('role', 'alert');
      await expect(padrao).toHaveTextContent('Sessão expirada');
    });
  },
};

export const InsercaoDinamica: Story = {
  parameters: { covers: ['functional.item6'] },
  render: () => ({
    template: `
      <div aria-live="polite">
        <div ndsAlert>
          <svg ndsAlertIcon kind="success"></svg>
          <h5 ndsAlertTitle>Operação concluída</h5>
          <section ndsAlertDescription>O relatório foi gerado com sucesso.</section>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O alert está dentro de uma região aria-live', async () => {
      const regiao = canvasElement.querySelector('[aria-live="polite"]');
      await expect(regiao).toBeInTheDocument();
      await expect(regiao).toContainElement(canvas.getByRole('alert'));
    });

    await step('A semântica assertiva do alert continua no container', async () => {
      await expect(canvas.getByRole('alert')).toHaveAttribute('role', 'alert');
    });
  },
};
