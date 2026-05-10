import type { Meta, StoryObj } from '@storybook/html';
import { createProgress } from './progress';

const meta: Meta = {
  title: 'UI/Progress/Composições',
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composições do Progress em contextos reais de aplicação. Como a factory Basecoat não expõe ' +
          'ProgressLabel/ProgressValue/ProgressTrack, todos os exemplos compõem Label/Value via DOM nativo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildBar(value: number, ariaLabel: string, className?: string): HTMLElement {
  const bar = createProgress({ value, className });
  bar.setAttribute('aria-label', ariaLabel);
  return bar;
}

function buildLabeled(opts: { value: number; label: string; ariaLabel: string; barClass?: string }): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'w-full space-y-2';

  const row = document.createElement('div');
  row.className = 'flex items-center justify-between text-sm';

  const label = document.createElement('span');
  label.className = 'text-foreground';
  label.textContent = opts.label;

  const value = document.createElement('span');
  value.className = 'text-muted-foreground tabular-nums';
  value.setAttribute('aria-live', 'polite');
  value.textContent = `${opts.value}%`;

  row.append(label, value);
  wrap.append(row, buildBar(opts.value, opts.ariaLabel, opts.barClass));
  return wrap;
}

// ─── Upload de Arquivo ───────────────────────────────────────────────────────

export const FileUpload: Story = {
  render: () => {
    const card = document.createElement('div');
    card.className = 'w-full max-w-md p-4 rounded-lg border bg-card text-card-foreground space-y-3';

    const title = document.createElement('div');
    title.className = 'text-sm font-medium';
    title.textContent = 'documento-final.pdf';

    const meta = document.createElement('div');
    meta.className = 'text-xs text-muted-foreground';
    meta.textContent = '2.4 MB de 5.0 MB';

    card.append(title, meta, buildLabeled({
      value: 48,
      label: 'Enviando arquivo',
      ariaLabel: 'Progresso do upload de documento-final.pdf',
    }));
    return card;
  },
};

// ─── Multi-step Wizard ───────────────────────────────────────────────────────

export const WizardSteps: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'w-full max-w-md space-y-3';

    const row = document.createElement('div');
    row.className = 'flex items-center justify-between text-sm';

    const label = document.createElement('span');
    label.className = 'text-foreground font-medium';
    label.textContent = 'Etapa 3 de 5';

    const value = document.createElement('span');
    value.className = 'text-muted-foreground';
    value.setAttribute('aria-live', 'polite');
    value.textContent = 'Endereço';

    row.append(label, value);

    wrap.append(row, buildBar(60, 'Progresso do cadastro: etapa 3 de 5'));
    return wrap;
  },
};

// ─── Múltiplos Uploads ───────────────────────────────────────────────────────

export const MultipleUploads: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'w-full max-w-md space-y-4';

    wrap.append(
      buildLabeled({ value: 100, label: 'foto-1.jpg',     ariaLabel: 'Upload de foto-1.jpg concluído' }),
      buildLabeled({ value: 74,  label: 'foto-2.jpg',     ariaLabel: 'Progresso do upload de foto-2.jpg' }),
      buildLabeled({ value: 32,  label: 'foto-3.jpg',     ariaLabel: 'Progresso do upload de foto-3.jpg' }),
      buildLabeled({ value: 0,   label: 'foto-4.jpg',     ariaLabel: 'Upload de foto-4.jpg aguardando' }),
    );
    return wrap;
  },
};

// ─── Cor Customizada (Success) ───────────────────────────────────────────────

export const CustomColor: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'w-full max-w-md space-y-4';

    wrap.append(
      buildLabeled({
        value: 100,
        label: 'Sincronização',
        ariaLabel: 'Sincronização concluída',
        barClass: '[&>div]:bg-success',
      }),
      buildLabeled({
        value: 72,
        label: 'Backup',
        ariaLabel: 'Progresso do backup',
        barClass: '[&>div]:bg-warning',
      }),
    );
    return wrap;
  },
};

// ─── Container com aria-busy ─────────────────────────────────────────────────

export const AriaBusyContainer: Story = {
  render: () => {
    const status = document.createElement('div');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-busy', 'true');
    status.className = 'w-full max-w-md p-4 rounded-lg border bg-card text-card-foreground space-y-3';

    const title = document.createElement('div');
    title.className = 'text-sm font-medium';
    title.textContent = 'Processando relatório';

    const desc = document.createElement('div');
    desc.className = 'text-xs text-muted-foreground';
    desc.textContent = 'Isso pode levar alguns minutos.';

    status.append(title, desc, buildLabeled({
      value: 35,
      label: 'Analisando dados',
      ariaLabel: 'Progresso da análise de dados',
    }));
    return status;
  },
};
