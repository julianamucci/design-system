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
} from './alert';
import { contrasteNosDoisTemas, descreverFalhas } from '@shared/testing/alert-probe';

const meta: Meta = {
  title: 'UI/Alert/Variantes',
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
  },
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
  parameters: { covers: ['functional.item2'] },
  render: () => ({
    template: `
      <div ndsAlert variant="destructive">
        <svg ndsAlertIcon kind="error"></svg>
        <h5 ndsAlertTitle>Erro ao salvar</h5>
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

    await step('O texto corrido não herda a cor da variante', async () => {
      // Regra dos containers coloridos: ícone e título podem usar a cor
      // semântica (são curtos, 3:1 basta); o texto corrido não, porque
      // vermelho sobre fundo soft não alcança os 4.5:1 que ele exige.
      const icone = alerta.querySelector<SVGSVGElement>(':scope > svg')!;
      const descricao = alerta.querySelector<HTMLElement>('[data-slot="alert-description"]')!;
      await expect(getComputedStyle(descricao).color).not.toBe(
        getComputedStyle(icone).color,
      );
    });
  },
};

export const Success: Story = {
  parameters: { covers: ['functional.item5'] },
  render: () => ({
    template: `
      <div ndsAlert variant="success">
        <svg ndsAlertIcon kind="success"></svg>
        <h5 ndsAlertTitle>Perfil atualizado</h5>
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
  render: () => ({
    template: `
      <div ndsAlert variant="warning">
        <svg ndsAlertIcon kind="warning"></svg>
        <h5 ndsAlertTitle>Assinatura expirando</h5>
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
  name: 'Info',
  render: () => ({
    template: `
      <div ndsAlert variant="info">
        <svg ndsAlertIcon kind="info"></svg>
        <h5 ndsAlertTitle>Dica</h5>
        <section ndsAlertDescription>Você pode alterar o tema em Configurações a qualquer momento.</section>
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

/**
 * O alert fechado se esconde sozinho (`hidden` no host), mas quem tira o nó do
 * DOM é o consumidor — em Angular um componente não remove o próprio host.
 *
 * Estas duas stories mostram o padrão idiomático: `@for` com `track` sobre um
 * contador. Fechar incrementa o contador, a view antiga é destruída (a prova do
 * fechamento continua mensurável) e uma nova monta no lugar — sem isso o canvas
 * ficaria vazio depois da play e o Chromatic fotografaria o nada.
 */
function alertDismissivelRemontavel(
  onDismiss: () => void,
  kind: string,
  titulo: string,
  descricao: string,
) {
  const instancia = signal(0);
  return {
    props: {
      instancia,
      kind,
      titulo,
      descricao,
      aoFechar: () => {
        instancia.update((n) => n + 1);
        onDismiss();
      },
    },
    template: `
      @for (i of [instancia()]; track i) {
        <div ndsAlert variant="success" dismissible (dismiss)="aoFechar()">
          <svg ndsAlertIcon [kind]="kind"></svg>
          <h5 ndsAlertTitle>{{ titulo }}</h5>
          <section ndsAlertDescription>{{ descricao }}</section>
        </div>
      }
    `,
  };
}

export const Dismissible: Story = {
  parameters: { covers: ['functional.item7', 'visual.item5'] },
  argTypes: {
    // Armadilha 5 do stack: função em `args` sem `argTypes` não chega ao
    // template — o `(dismiss)` ficaria ligado a nada, sem erro nenhum.
    onDismiss: { control: false, table: { disable: true } },
  },
  args: { onDismiss: fn() },
  render: (args) => {
    const onDismiss = args['onDismiss'] as () => void;
    return alertDismissivelRemontavel(
      onDismiss,
      'success',
      'Perfil atualizado',
      'Suas informações foram salvas com sucesso.',
    );
  },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    const onDismiss = args['onDismiss'] as ReturnType<typeof fn>;

    await step('O botão de fechar é o último filho e tem rótulo acessível', async () => {
      const alerta = canvas.getByRole('alert');
      const fechar = canvas.getByRole('button', { name: 'Fechar alerta' });
      // Ordem no DOM: o X vem DEPOIS do conteúdo, então o leitor de tela
      // anuncia a mensagem antes da ação e o Tab chega nele por último.
      await expect(alerta.lastElementChild).toBe(fechar);
      await expect(fechar).toHaveAttribute('data-slot', 'alert-dismiss');
      // waitFor: o alert dismissible ENTRA animado (opacidade 0 → 1); no
      // Chromium headless a animação fica presa no quadro zero até o timeout
      // de segurança do primitivo limpar a classe.
      await waitFor(() => expect(fechar).toBeVisible());
    });

    await step('Fechar remove o alert original e a demo remonta', async () => {
      const original = canvas.getByRole('alert');
      const fechar = canvas.getByRole('button', { name: 'Fechar alerta' });
      await userEvent.click(fechar);

      // Segunda ativação com a saída em curso: tem que cair na guarda de
      // reentrada. Sem ela, o "uma única vez" do último step seria verdade
      // trivial — nunca teria havido chance de disparar duas.
      fechar.click();

      // E a animação de um DESCENDENTE não pode encerrar a saída do alert:
      // `animationend` borbulha.
      fechar.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
      await expect(original).toBeInTheDocument();

      // waitFor: a saída é animada e o nó só some quando ela termina — ou no
      // timeout de segurança do primitivo.
      await waitFor(() => expect(original).not.toBeInTheDocument());

      await waitFor(async () => {
        const remontado = canvas.getByRole('alert');
        await expect(remontado).not.toBe(original);
        await expect(remontado).toBeVisible();
      });
    });

    await step('O callback de fechamento dispara uma única vez', async () => {
      await expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  },
};

// O contrato documenta "clique ou Enter" — esta story cobre o caminho de
// teclado, com o foco no botão.
export const DismissibleTeclado: Story = {
  argTypes: {
    onDismiss: { control: false, table: { disable: true } },
  },
  args: { onDismiss: fn() },
  render: (args) => {
    const onDismiss = args['onDismiss'] as () => void;
    return alertDismissivelRemontavel(
      onDismiss,
      'info',
      'Atenção',
      'Suas alterações serão aplicadas na próxima sessão.',
    );
  },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    const onDismiss = args['onDismiss'] as ReturnType<typeof fn>;

    await step('Enter no botão focado fecha o alert', async () => {
      const original = canvas.getByRole('alert');
      const fechar = canvas.getByRole('button', { name: 'Fechar alerta' });
      fechar.focus();
      await expect(fechar).toHaveFocus();
      await userEvent.keyboard('{Enter}');

      await waitFor(() => expect(original).not.toBeInTheDocument());
      await waitFor(async () => {
        const remontado = canvas.getByRole('alert');
        await expect(remontado).not.toBe(original);
        await expect(remontado).toBeVisible();
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
 * num componente cuja função é chamar atenção — e a sonda é a mesma das outras
 * quatro stacks, para a divergência aparecer como número e não como impressão.
 */
export const Contraste: Story = {
  parameters: {
    covers: ['accessibility.item3'],
    docs: {
      description: {
        story:
          'Título e texto de cada variante medidos contra o fundo composto, no tema claro e no escuro. O mínimo é 4.5:1 — o título tem 14px semibold, que pela WCAG não conta como texto grande.',
      },
    },
  },
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="sm">
        <div ndsAlert>
          <h5 ndsAlertTitle>Título default</h5>
          <section ndsAlertDescription>Texto corrido da variante default.</section>
        </div>
        <div ndsAlert variant="destructive">
          <h5 ndsAlertTitle>Título destructive</h5>
          <section ndsAlertDescription>Texto corrido da variante destructive.</section>
        </div>
        <div ndsAlert variant="success">
          <h5 ndsAlertTitle>Título success</h5>
          <section ndsAlertDescription>Texto corrido da variante success.</section>
        </div>
        <div ndsAlert variant="warning">
          <h5 ndsAlertTitle>Título warning</h5>
          <section ndsAlertDescription>Texto corrido da variante warning.</section>
        </div>
        <div ndsAlert variant="info">
          <h5 ndsAlertTitle>Título info</h5>
          <section ndsAlertDescription>Texto corrido da variante info.</section>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    // Contraste é aritmética, não olhômetro: a sonda calcula a razão entre a
    // cor do texto e o fundo COMPOSTO (o bg do alert tem alfa, então a cor
    // declarada não é a que se vê). O tema escuro entra junto porque é metade
    // do produto.
    const problemas = contrasteNosDoisTemas(canvasElement);
    await expect(
      problemas,
      problemas.length ? `\n${descreverFalhas(problemas)}\n` : '',
    ).toEqual([]);
  },
};
