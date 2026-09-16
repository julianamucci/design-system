import { figmaDesign } from '@shared/figma/design-links';
import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, fn, userEvent, waitFor } from 'storybook/test';
import {
  NdsAlert,
  NdsAlertTitle,
  NdsAlertDescription,
  NdsAlertIcon,
  type AlertIconKind,
  type AlertVariant,
} from './alert';
import {
  alertContrastSource,
  alertDefaultSource,
  alertDestructiveSource,
  alertDismissibleByKeyboardSource,
  alertDismissibleSource,
  alertInfoSource,
  alertSuccessSource,
  alertWarningSource,
} from './alert.source';
import { themeContrast, themeReprovas } from '@shared/testing/alert-probe';

const meta: Meta = {
  title: 'Components/Feedback/Alert/Variants',
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

export const Default: Story = {
  parameters: {
    covers: ['functional.item1', 'accessibility.item3', 'visual.item2'],
    docs: { source: { transform: alertDefaultSource } },
  },
  render: () => ({
    template: `
      <div ndsAlert>
        <svg ndsAlertIcon kind="info"></svg>
        <h4 ndsAlertTitle>Atenção</h4>
        <section ndsAlertDescription>Suas alterações serão aplicadas na próxima sessão.</section>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const alerta = canvas.getByRole('alert');

    await step('A variante default não recebe classe de modificador', async () => {
      await expect(alerta).toHaveClass('nds-alert');
      await expect(alerta).not.toHaveClass('nds-alert-destructive');
      await expect(canvas.getByText('Atenção')).toBeVisible();
    });

    await step('Ícone, título e descrição ocupam os slots que a folha espera', async () => {
      // A folha posiciona por `data-slot`/classe: se um deles não recebesse a
      // classe, o layout de duas colunas colapsaria sem erro nenhum.
      await expect(alerta.querySelector(':scope > svg')).toBeTruthy();
      await expect(alerta.querySelector('[data-slot="alert-title"]')).toHaveClass(
        'nds-alert-title',
      );
      await expect(alerta.querySelector('[data-slot="alert-description"]')).toHaveClass(
        'nds-alert-description',
      );
    });
  },
};

export const Destructive: Story = {
  parameters: {
    covers: ['functional.item2'],
    docs: { source: { transform: alertDestructiveSource } },
  },
  render: () => ({
    template: `
      <div ndsAlert variant="destructive">
        <svg ndsAlertIcon kind="error"></svg>
        <h4 ndsAlertTitle>Erro ao salvar</h4>
        <section ndsAlertDescription>Não foi possível salvar. Verifique sua conexão e tente novamente.</section>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const alerta = canvas.getByRole('alert');

    await step('A variante escolhida chega ao DOM', async () => {
      // Sem AOT o input cai no default em silêncio e todas as variantes
      // ficariam iguais — é esta asserção que impede o NG0303 de voltar
      // despercebido.
      await expect(alerta).toHaveClass('nds-alert-destructive');
      await expect(canvas.getByText('Erro ao salvar')).toBeVisible();
    });

    await step('Só o ícone recebe a cor da variante', async () => {
      // Regra dos containers coloridos, e a folha a cumpre nas cinco variantes:
      // a cor semântica pinta fundo, borda e ÍCONE (não-textual, 3:1). O título
      // é 14px semibold — pela WCAG não é texto grande, o limite dele é 4.5:1 —
      // e fica em `--foreground` junto com o texto corrido.
      const icone = alerta.querySelector<SVGSVGElement>(':scope > svg')!;
      const title = alerta.querySelector<HTMLElement>('[data-slot="alert-title"]')!;
      const descricao = alerta.querySelector<HTMLElement>('[data-slot="alert-description"]')!;
      await expect(getComputedStyle(descricao).color).not.toBe(getComputedStyle(icone).color);
      await expect(getComputedStyle(title).color).not.toBe(getComputedStyle(icone).color);
      await expect(getComputedStyle(title).color).toBe(getComputedStyle(descricao).color);
    });
  },
};

export const Success: Story = {
  parameters: {
    covers: ['functional.item5'],
    docs: { source: { transform: alertSuccessSource } },
  },
  render: () => ({
    template: `
      <div ndsAlert variant="success">
        <svg ndsAlertIcon kind="success"></svg>
        <h4 ndsAlertTitle>Perfil atualizado</h4>
        <section ndsAlertDescription>Suas informações foram salvas com sucesso.</section>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alerta = canvas.getByRole('alert');
    await expect(alerta).toHaveClass('nds-alert-success');
    await expect(canvas.getByText('Perfil atualizado')).toBeVisible();
  },
};

export const Warning: Story = {
  parameters: { docs: { source: { transform: alertWarningSource } } },
  render: () => ({
    template: `
      <div ndsAlert variant="warning">
        <svg ndsAlertIcon kind="warning"></svg>
        <h4 ndsAlertTitle>Assinatura expirando</h4>
        <section ndsAlertDescription>Sua assinatura expira em 3 dias. Renove para evitar interrupções.</section>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alerta = canvas.getByRole('alert');
    await expect(alerta).toHaveClass('nds-alert-warning');
    await expect(canvas.getByText('Assinatura expirando')).toBeVisible();
  },
};

export const Info: Story = {
  parameters: { docs: { source: { transform: alertInfoSource } } },
  render: () => ({
    template: `
      <div ndsAlert variant="info">
        <svg ndsAlertIcon kind="info"></svg>
        <h4 ndsAlertTitle>Dica</h4>
        <section ndsAlertDescription>Você pode fixar os filtros mais usados para acessá-los mais rápido.</section>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alerta = canvas.getByRole('alert');
    await expect(alerta).toHaveClass('nds-alert-info');
    await expect(canvas.getByText('Dica')).toBeVisible();
  },
};

type RemountingAlertOptions = {
  variant: AlertVariant;
  kind: AlertIconKind;
  title: string;
  description: string;
  dismissLabel: string;
};

/**
 * O alert fechado se esconde sozinho (`hidden` no host), mas quem tira o nó do
 * DOM é o consumidor — em Angular um componente não remove o próprio host.
 *
 * Nas stories o consumidor é um `@for` com `track` sobre um contador: fechar
 * incrementa o contador, a view antiga é destruída (a prova do fechamento
 * continua mensurável) e uma nova monta no lugar — sem isso o canvas ficaria
 * vazio depois da play e o Chromatic fotografaria o nada. É ANDAIME: o snippet
 * do painel Code ensina o `@if`, que é o que quem consome escreve.
 */
function remountingDismissibleAlert(onDismiss: () => void, o: RemountingAlertOptions) {
  const instance = signal(0);
  return {
    props: {
      ...o,
      instance,
      handleDismiss: () => {
        instance.update((n) => n + 1);
        onDismiss();
      },
    },
    template: `
      @for (i of [instance()]; track i) {
        <div ndsAlert [variant]="variant" dismissible [dismissLabel]="dismissLabel" (dismiss)="handleDismiss()">
          <svg ndsAlertIcon [kind]="kind"></svg>
          <h4 ndsAlertTitle>{{ title }}</h4>
          <section ndsAlertDescription>{{ description }}</section>
        </div>
      }
    `,
  };
}

export const Dismissible: Story = {
  parameters: {
    covers: ['functional.item7', 'visual.item5'],
    docs: { source: { transform: alertDismissibleSource } },
  },
  argTypes: {
    // Armadilha 5 do stack: função em `args` sem `argTypes` não chega ao
    // template — o `(dismiss)` ficaria ligado a nada, sem erro nenhum.
    onDismiss: { control: false, table: { disable: true } },
  },
  args: { onDismiss: fn() },
  render: (args) => {
    const onDismiss = args['onDismiss'] as () => void;
    // UM alerta, como nas outras quatro stacks. Até 2026-09-16 esta story
    // renderizava também um segundo alerta fixo, de papel polido e rótulo
    // próprio, que nenhuma das outras quatro tinha e que o snippet não mostrava:
    // comparar a mesma story entre as cinco deixava de responder o que o
    // Dismissible ensina. A guarda `.nds-alert[hidden]` que ele provava continua
    // medida na play, no próprio alerta.
    return remountingDismissibleAlert(onDismiss, {
      variant: 'default',
      kind: 'info',
      title: 'Preferências salvas',
      description: 'Você pode fechar este aviso quando quiser.',
      dismissLabel: 'Fechar alerta',
    });
  },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    const onDismiss = args['onDismiss'] as ReturnType<typeof fn>;

    // Primeiro step de propósito: só vale enquanto a entrada ainda roda. O
    // painel Interactions reexecuta a play no MESMO DOM, onde o alert já
    // assentou — então, quando a classe não está lá, provocamos uma remontagem
    // (o `@for` remonta ao fechar) e medimos no nó novo.
    await step('Animação de descendente não encerra a entrada antes da hora', async () => {
      let alerta = canvas.getByRole('alert');
      if (!alerta.classList.contains('nds-animate-in')) {
        await userEvent.click(canvas.getByRole('button', { name: 'Fechar alerta' }));
        const previous = alerta;
        alerta = await waitFor(() => {
          const fresh = canvas.getByRole('alert');
          if (fresh === previous || !fresh.classList.contains('nds-animate-in')) {
            throw new Error('aguardando remontagem');
          }
          return fresh;
        });
        onDismiss.mockClear(); // o fechamento de preparo não entra na contagem
      }
      await expect(alerta).toHaveClass('nds-animate-in');

      // `animationend` borbulha — sem a guarda de `event.target`, a animação de
      // qualquer filho (o botão de fechar, um ícone) encerraria a entrada.
      const close = within(alerta).getByRole('button', { name: 'Fechar alerta' });
      close.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
      await expect(alerta).toHaveClass('nds-animate-in');

      // Já a animação do PRÓPRIO alert encerra a entrada — e um segundo evento
      // não tem mais nada a limpar: nem volta a classe, nem fecha o alerta.
      alerta.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
      await waitFor(() => expect(alerta).not.toHaveClass('nds-animate-in'));
      alerta.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
      await expect(alerta).not.toHaveClass('nds-animate-in');
      await expect(alerta).toBeInTheDocument();
      await expect(onDismiss).not.toHaveBeenCalled();
    });

    await step('O botão de fechar é o último filho e tem rótulo acessível', async () => {
      const alerta = canvas.getByRole('alert');
      const close = within(alerta).getByRole('button', { name: 'Fechar alerta' });
      // Ordem no DOM: o X vem DEPOIS do conteúdo, então o leitor de tela
      // anuncia a mensagem antes da ação e o Tab chega nele por último.
      await expect(alerta.lastElementChild).toBe(close);
      await expect(close).toHaveAttribute('data-slot', 'alert-dismiss');
      // waitFor: o alert dismissible ENTRA animado (opacidade 0 → 1).
      await waitFor(() => expect(close).toBeVisible());
    });

    await step('Fechar remove o alert original e a demo remonta', async () => {
      const original = canvas.getByRole('alert');
      const close = within(original).getByRole('button', { name: 'Fechar alerta' });
      await userEvent.click(close);

      // Segunda ativação com a saída em curso: tem que cair na guarda de
      // reentrada. Sem ela, o "uma única vez" do step seguinte seria verdade
      // trivial — nunca teria havido chance de disparar duas.
      close.click();

      // E a animação de um DESCENDENTE não pode encerrar a saída do alert.
      close.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
      await expect(original).toBeInTheDocument();

      // waitFor: a saída é animada e o nó só some quando ela termina — ou no
      // timeout de segurança do primitivo.
      await waitFor(() => expect(original).not.toBeInTheDocument());

      await waitFor(async () => {
        const remounted = canvas.getByRole('alert');
        await expect(remounted).not.toBe(original);
        await expect(remounted).toBeVisible();
      });
    });

    await step('O callback de fechamento dispara uma única vez', async () => {
      await expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    await step('Alerta com `hidden` sai da tela: a folha vence o display: grid', async () => {
      // C16, e ele é só desta stack: o componente não remove o próprio host — o
      // `close()` grava `hidden` nele —, e o `display: grid` da raiz venceria a
      // regra `[hidden]` do navegador se `alert.css` não trouxesse
      // `.nds-alert[hidden] { display: none }`.
      //
      // O atributo é escrito aqui, na mão, e não observado depois do
      // fechamento: quando o `@for` do consumidor tira o nó do DOM, o `hidden`
      // que o `close()` escreveu deixa de ser observável, e estilo computado de
      // nó destacado não mede nada. O que esta asserção cobra é a guarda da
      // folha, que é o que sumia sem ninguém ver.
      const alerta = canvas.getByRole('alert');
      alerta.hidden = true;
      await expect(getComputedStyle(alerta).display).toBe('none');
      await expect(alerta).not.toBeVisible();
      alerta.hidden = false;
      await expect(alerta).toBeVisible();
    });
  },
};

// O contrato documenta "clique ou Enter" — esta story cobre o caminho de
// teclado, com o foco no botão.
export const DismissibleByKeyboard: Story = {
  parameters: { docs: { source: { transform: alertDismissibleByKeyboardSource } } },
  argTypes: {
    onDismiss: { control: false, table: { disable: true } },
  },
  args: { onDismiss: fn() },
  render: (args) => {
    const onDismiss = args['onDismiss'] as () => void;
    return remountingDismissibleAlert(onDismiss, {
      variant: 'success',
      kind: 'success',
      title: 'Perfil atualizado',
      description: 'Suas informações foram salvas com sucesso.',
      dismissLabel: 'Fechar confirmação',
    });
  },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    const onDismiss = args['onDismiss'] as ReturnType<typeof fn>;

    await step('Enter no botão focado fecha o alert', async () => {
      const original = canvas.getByRole('alert');
      const close = within(original).getByRole('button', { name: 'Fechar confirmação' });
      close.focus();
      await expect(close).toHaveFocus();
      await userEvent.keyboard('{Enter}');

      await waitFor(() => expect(original).not.toBeInTheDocument());
      await waitFor(async () => {
        const remounted = canvas.getByRole('alert');
        await expect(remounted).not.toBe(original);
        await expect(remounted).toBeVisible();
      });
    });

    await step('O callback de fechamento dispara uma única vez', async () => {
      await expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  },
};

/**
 * As cinco variantes juntas, e a medição é de CONTRASTE.
 *
 * As stories por variante conferem a classe e a cor; nenhuma pergunta se o
 * texto é legível sobre o fundo que a variante pinta. É a pergunta que importa
 * num componente cuja função é chamar atenção.
 *
 * A varredura é dos TRÊS temas de marca nos DOIS modos, não só claro × escuro
 * do tema vigente: cada tema redeclara as quatro cores de feedback, e foi num
 * deles que o título do `info` estava em 3.34:1 enquanto os outros dois
 * passavam com folga.
 */
export const Contrast: Story = {
  parameters: {
    covers: ['accessibility.item3'],
    docs: {
      source: { transform: alertContrastSource },
      description: {
        story:
          'Título e texto de cada variante medidos contra o fundo composto, nos três temas de marca e nos dois modos. O mínimo é 4.5:1 — o título tem 14px semibold, que pela WCAG não conta como texto grande.',
      },
    },
  },
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="sm">
        <div ndsAlert>
          <h4 ndsAlertTitle>Título default</h4>
          <section ndsAlertDescription>Texto corrido da variante default.</section>
        </div>
        <div ndsAlert variant="destructive">
          <h4 ndsAlertTitle>Título destructive</h4>
          <section ndsAlertDescription>Texto corrido da variante destructive.</section>
        </div>
        <div ndsAlert variant="success">
          <h4 ndsAlertTitle>Título success</h4>
          <section ndsAlertDescription>Texto corrido da variante success.</section>
        </div>
        <div ndsAlert variant="warning">
          <h4 ndsAlertTitle>Título warning</h4>
          <section ndsAlertDescription>Texto corrido da variante warning.</section>
        </div>
        <div ndsAlert variant="info">
          <h4 ndsAlertTitle>Título info</h4>
          <section ndsAlertDescription>Texto corrido da variante info.</section>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    // Contraste é aritmética, não olhômetro: a play calcula a razão entre a cor
    // do texto e o fundo COMPOSTO (o bg do alert tem alfa, então a cor declarada
    // não é a que se vê). A classe de tema vai no `documentElement`, e não na
    // raiz da story, porque quem pinta por baixo do alert translúcido é o
    // `body` — com a classe só na raiz ele ficava no claro e toda variante
    // acusava ~1:1 no escuro, defeito que não existe.
    const reprovas = themeReprovas(themeContrast(canvasElement));
    await expect(reprovas, reprovas.length ? `\n${reprovas.join('\n')}\n` : '').toEqual([]);
  },
};
