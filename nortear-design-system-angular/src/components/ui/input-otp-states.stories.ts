import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';
import { ratio } from '@shared/testing/cor';
import { NdsInputOtp } from './input-otp';

const meta: Meta = {
  title: 'UI/InputOTP/States',
  decorators: [moduleMetadata({ imports: [NdsInputOtp] })],
  parameters: { layout: 'padded', controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

const slotsDe = (raiz: HTMLElement): HTMLInputElement[] => [
  ...raiz.querySelectorAll<HTMLInputElement>('[data-slot="input-otp-slot"]'),
];

export const Empty: Story = {
  parameters: { covers: ['visual.item1'] },
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="sm">
        <span id="est-vazio-label" class="nds-text-label">Código de verificação</span>
        <nds-input-otp
          aria-labelledby="est-vazio-label"
          [maxLength]="6"
          [autoFocus]="true"
        ></nds-input-otp>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Nasce vazio com o primeiro slot pronto para receber', async () => {
      // `autoFocus` é lido em ngAfterViewInit: no construtor o input ainda
      // devolveria o default do componente (armadilha 9 do CLAUDE.md).
      const slots = slotsDe(canvasElement);
      await expect(slots.map((s) => s.value).join('')).toBe('');
      await expect(slots[0]).toHaveFocus();
    });
  },
};

export const Filling: Story = {
  parameters: { covers: ['visual.item2', 'accessibility.item6'] },
  render: () => ({
    props: { code: '123' },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <span id="est-parcial-label" class="nds-text-label">Código de verificação</span>
        <nds-input-otp
          aria-labelledby="est-parcial-label"
          [maxLength]="6"
          [value]="code"
        ></nds-input-otp>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O valor inicial se distribui da esquerda para a direita', async () => {
      const slots = slotsDe(canvasElement);
      await expect(slots.map((s) => s.value)).toEqual(['1', '2', '3', '', '', '']);
    });

    await step('O dígito digitado tem contraste suficiente contra o slot', async () => {
      // Um slot é uma caixa pequena com um caractere só: se o contraste cair,
      // não há palavra em volta para compensar pelo contexto. A conta WCAG vem
      // do colhedor compartilhado — a cópia local que morava aqui era o começo
      // de um segundo colhedor com as mesmas armadilhas para redescobrir.
      const cs = getComputedStyle(slotsDe(canvasElement)[0]);
      const measurement = ratio(cs.color, cs.backgroundColor);
      await expect(measurement?.ratio ?? 0).toBeGreaterThanOrEqual(4.5);
    });
  },
};

export const Complete: Story = {
  parameters: { covers: ['visual.item3'] },
  render: () => ({
    props: { code: '482913' },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <span id="est-completo-label" class="nds-text-label">Código de verificação</span>
        <nds-input-otp
          aria-labelledby="est-completo-label"
          [maxLength]="6"
          [value]="code"
        ></nds-input-otp>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Todos os slots preenchidos, na ordem do código', async () => {
      const slots = slotsDe(canvasElement);
      await expect(slots.map((s) => s.value).join('')).toBe('482913');
    });
  },
};

export const Disabled: Story = {
  parameters: { covers: ['functional.item6'] },
  render: () => ({
    props: { code: '4829' },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <span id="est-off-label" class="nds-text-label">Código de verificação</span>
        <nds-input-otp
          aria-labelledby="est-off-label"
          [maxLength]="6"
          [value]="code"
          [disabled]="true"
        ></nds-input-otp>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Nenhum slot aceita foco nem digitação', async () => {
      const slots = slotsDe(canvasElement);
      for (const slot of slots) await expect(slot).toBeDisabled();
      await userEvent.click(slots[4]);
      await expect(slots[4]).not.toHaveFocus();
    });

    await step('O bloqueio também se vê', async () => {
      // O CSS esmaece cada slot (`.nds-input-otp-slot:disabled`), não o
      // container: medir a opacidade é o que prova que a cascata chegou.
      const slot = slotsDe(canvasElement)[0];
      await expect(Number(getComputedStyle(slot).opacity)).toBeLessThan(1);
    });
  },
};

export const Invalid: Story = {
  parameters: {
    covers: ['functional.item7', 'accessibility.item5', 'visual.item4'],
  },
  render: () => ({
    props: { code: '482913' },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <span id="est-erro-label" class="nds-text-label">Código de verificação</span>
        <nds-input-otp
          data-testid="com-erro"
          aria-labelledby="est-erro-label"
          [maxLength]="6"
          [value]="code"
          [invalid]="true"
          describedBy="est-erro-msg"
        ></nds-input-otp>
        <p id="est-erro-msg" class="nds-text-caption nds-text-destructive">
          Código incorreto. Verifique e tente novamente.
        </p>

        <span id="est-ok-label" class="nds-text-label">Comparação — sem erro</span>
        <nds-input-otp
          data-testid="sem-erro"
          aria-labelledby="est-ok-label"
          [maxLength]="6"
          [value]="code"
        ></nds-input-otp>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    // Escopado ao componente com erro: a story renderiza uma segunda instância
    // sem erro para a comparação de borda, e `canvasElement` pegaria as duas.
    const withError = () => canvasElement.querySelector<HTMLElement>('[data-testid="com-erro"]')!;

    await step('O erro é anunciado por ARIA, não só pela borda', async () => {
      const slots = slotsDe(withError());
      await expect(slots.length).toBe(6);
      for (const slot of slots) await expect(slot).toHaveAttribute('aria-invalid', 'true');
    });

    await step('A mensagem de erro está ligada ao campo', async () => {
      const slot = slotsDe(withError())[0];
      const id = slot.getAttribute('aria-describedby');
      await expect(id).toBe('est-erro-msg');
      await expect(canvasElement.querySelector(`#${id}`)).toBeTruthy();
    });

    await step('A borda do slot troca para a cor de erro', async () => {
      // Compara com uma SEGUNDA instância renderizada sem erro, em vez de
      // remover o atributo da primeira: `removeAttribute` no host de um
      // componente Angular é desfeito na próxima detecção de mudanças, e a
      // comparação acabava lendo o mesmo estado dos dois lados — um teste que
      // não podia falhar.
      const borderWithError = getComputedStyle(slotsDe(withError())[0]).borderTopColor;
      const borderNoError = getComputedStyle(
        slotsDe(canvasElement.querySelector<HTMLElement>('[data-testid="sem-erro"]')!)[0],
      ).borderTopColor;
      await expect(borderWithError).not.toBe(borderNoError);
    });
  },
};
