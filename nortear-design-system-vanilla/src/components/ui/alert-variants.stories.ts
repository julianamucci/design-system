import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { createAlert, createAlertIcon, createAlertTitle, createAlertDescription } from './alert';
import { alertSource, alertSourceWith } from './alert.source';
import { within, expect, fn, userEvent, waitFor } from 'storybook/test';
import { themeContrast, themeReprovas } from '@shared/testing/alert-probe';

const meta: Meta = {
  tags: ['feedback'],
  parameters: {
    design: figmaDesign('alert'),
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: alertSource } },
  },
  title: 'Components/Feedback/Alert/Variants',
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: { covers: ['functional.item1', 'accessibility.item3', 'visual.item2'] },
  render: () => {
    const alert = createAlert({ variant: 'default' });
    alert.appendChild(createAlertIcon('info'));
    alert.appendChild(createAlertTitle({ text: 'Atenção' }));
    alert.appendChild(createAlertDescription({ text: 'Suas alterações serão aplicadas na próxima sessão.' }));
    return alert;
  },

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');
    await expect(alert).toHaveClass('nds-alert');
    await expect(alert).not.toHaveClass('nds-alert-destructive');
    await expect(canvas.getByText('Atenção')).toBeVisible();
  },
};

export const Destructive: Story = {
  // Override de story: a variante não passa por control neste arquivo, e o
  // snippet do meta mostraria `default` onde a story renderiza `destructive`.
  parameters: {
    covers: ['functional.item2'],
    docs: {
      source: {
        transform: alertSourceWith({
          variant: 'destructive',
          title: 'Erro ao salvar',
          description: 'Não foi possível salvar. Verifique sua conexão e tente novamente.',
        }),
      },
    },
  },
  render: () => {
    const alert = createAlert({ variant: 'destructive' });
    alert.appendChild(createAlertIcon('error'));
    alert.appendChild(createAlertTitle({ text: 'Erro ao salvar' }));
    alert.appendChild(createAlertDescription({ text: 'Não foi possível salvar. Verifique sua conexão e tente novamente.' }));
    return alert;
  },

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');
    await expect(alert).toHaveClass('nds-alert-destructive');
    await expect(canvas.getByText('Erro ao salvar')).toBeVisible();
  },
};

export const Success: Story = {
  // Override de story: mesma razão da Destructive — a variante é o assunto.
  parameters: {
    covers: ['functional.item5'],
    docs: {
      source: {
        transform: alertSourceWith({
          variant: 'success',
          title: 'Perfil atualizado',
          description: 'Suas informações foram salvas com sucesso.',
        }),
      },
    },
  },
  render: () => {
    const alert = createAlert({ variant: 'success' });
    alert.appendChild(createAlertIcon('success'));
    alert.appendChild(createAlertTitle({ text: 'Perfil atualizado' }));
    alert.appendChild(createAlertDescription({ text: 'Suas informações foram salvas com sucesso.' }));
    return alert;
  },

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');
    await expect(alert).toHaveClass('nds-alert-success');
    await expect(canvas.getByText('Perfil atualizado')).toBeVisible();
  },
};

export const Warning: Story = {
  // Override de story: mesma razão da Destructive — a variante é o assunto.
  parameters: {
    docs: {
      source: {
        transform: alertSourceWith({
          variant: 'warning',
          title: 'Assinatura expirando',
          description: 'Sua assinatura expira em 3 dias. Renove para evitar interrupções.',
        }),
      },
    },
  },
  render: () => {
    const alert = createAlert({ variant: 'warning' });
    alert.appendChild(createAlertIcon('warning'));
    alert.appendChild(createAlertTitle({ text: 'Assinatura expirando' }));
    alert.appendChild(createAlertDescription({ text: 'Sua assinatura expira em 3 dias. Renove para evitar interrupções.' }));
    return alert;
  },

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');
    await expect(alert).toHaveClass('nds-alert-warning');
    await expect(canvas.getByText('Assinatura expirando')).toBeVisible();
  },
};

export const Info: Story = {
  // Override de story: mesma razão da Destructive — a variante é o assunto.
  parameters: {
    docs: {
      source: {
        transform: alertSourceWith({
          variant: 'info',
          title: 'Dica',
          description: 'Você pode fixar os filtros mais usados para acessá-los mais rápido.',
        }),
      },
    },
  },
  render: () => {
    const alert = createAlert({ variant: 'info' });
    alert.appendChild(createAlertIcon('info'));
    alert.appendChild(createAlertTitle({ text: 'Dica' }));
    alert.appendChild(createAlertDescription({ text: 'Você pode fixar os filtros mais usados para acessá-los mais rápido.' }));
    return alert;
  },

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');
    await expect(alert).toHaveClass('nds-alert-info');
    await expect(canvas.getByText('Dica')).toBeVisible();
  },
};

// Spies em escopo de módulo: o render (re)cria o DOM a cada run e zera os
// contadores, então o play sempre parte de 0 chamadas.
const onDismissClick = fn();
const onDismissKeyboard = fn();

// A play FECHA o alert. Se a story renderizasse um alert solto, o canvas
// terminaria vazio — quem abre a story no Storybook não vê nada e o Chromatic
// fotografa um quadro em branco. O wrapper remonta um alert novo no onDismiss:
// o fechamento continua provado (a play mede o nó ORIGINAL, que sai do DOM) e a
// story nunca acaba sem conteúdo visível.
function mountRemountingAlert(spy: () => void, build: (onDismiss: () => void) => HTMLElement): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'nds-w-full';
  const mount = (): void => {
    wrapper.appendChild(build(() => {
      spy();
      mount();
    }));
  };
  mount();
  return wrapper;
}

// Duas stories separadas, como nas outras 3 stacks (Dismissible +
// DismissibleTeclado): mesma matriz de cobertura por nome de story nas 4, e o
// Chromatic fotografa os mesmos casos.
export const Dismissible: Story = {
  // Override de story: o botão de fechar e o callback são o assunto, e nenhum
  // dos dois passa por control neste arquivo. O andaime que REMONTA o alerta
  // fica de fora — ele existe para a story não terminar vazia, não é API.
  parameters: {
    covers: ['functional.item7', 'visual.item5'],
    docs: {
      source: {
        transform: alertSourceWith({
          dismissible: true,
          onDismiss: "() => salvarPreferencia('aviso-fechado')",
          title: 'Preferências salvas',
          description: 'Você pode fechar este aviso quando quiser.',
        }),
      },
    },
  },
  render: () => {
    onDismissClick.mockClear();
    return mountRemountingAlert(onDismissClick, (onDismiss) => {
      const el = createAlert({ variant: 'default', dismissible: true, onDismiss });
      el.appendChild(createAlertIcon('info'));
      el.appendChild(createAlertTitle({ text: 'Preferências salvas' }));
      el.appendChild(createAlertDescription({ text: 'Você pode fechar este aviso quando quiser.' }));
      return el;
    });
  },

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    // Primeiro step de propósito: só vale enquanto a entrada ainda roda.
    // A entrada só existe logo depois de montar. O painel Interactions
    // reexecuta a play no MESMO DOM, onde o alert já assentou — então, quando a
    // classe não está lá, provocamos uma remontagem (o wrapper remonta ao
    // fechar) e medimos no nó novo. Em montagem limpa nada disso roda.
    await step('Animação de descendente não encerra a entrada antes da hora', async () => {
      let alert = canvas.getByRole('alert');
      if (!alert.classList.contains('nds-animate-in')) {
        await userEvent.click(canvas.getByRole('button', { name: 'Fechar alerta' }));
        alert = await waitFor(() => {
          const novo = canvas.getByRole('alert');
          if (!novo.classList.contains('nds-animate-in')) throw new Error('aguardando remontagem');
          return novo;
        });
        onDismissClick.mockClear(); // o fechamento de preparo não entra na contagem
      }
      await expect(alert).toHaveClass('nds-animate-in');

      // `animationend` borbulha — sem a guarda de `event.target`, a animação de
      // qualquer filho (o botão de fechar, um ícone) encerraria a fase de
      // entrada do alert.
      const dismiss = canvas.getByRole('button', { name: 'Fechar alerta' });
      dismiss.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
      await expect(alert).toHaveClass('nds-animate-in');

      // Já a animação do PRÓPRIO alert encerra a entrada — e um segundo evento
      // não tem mais nada a limpar.
      alert.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
      await waitFor(() => expect(alert).not.toHaveClass('nds-animate-in'));
      alert.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
      await expect(alert).not.toHaveClass('nds-animate-in');
    });

    await step('X visível, acessível por rótulo e registrado na raiz', async () => {
      await expect(canvas.getByRole('alert')).toHaveAttribute('data-dismissible', 'true');
      // waitFor: o alert dismissible ENTRA animado (.nds-animate-in, opacidade
      // 0 → 1). Asserção de visibilidade no primeiro quadro é racy em qualquer
      // browser — e no Chromium headless dos testes a animação fica presa no
      // quadro zero até o timeout de segurança limpar a classe.
      await waitFor(() =>
        expect(canvas.getByRole('button', { name: 'Fechar alerta' })).toBeVisible(),
      );
    });

    await step('X é o ÚLTIMO filho — leitor de tela encontra o conteúdo antes', async () => {
      // O consumidor appenda o conteúdo depois do createAlert; sem o microtask
      // de reposicionamento o botão ficaria como primeiro filho, divergindo
      // da ordem de leitura das outras 3 stacks.
      const alert = canvas.getByRole('alert');
      await expect(alert.lastElementChild).toHaveAttribute('data-slot', 'alert-dismiss');
    });

    await step('Clique no X remove o alert original, dispara o callback uma vez e a demo remonta', async () => {
      const alertOriginal = canvas.getByRole('alert');
      const dismiss = within(alertOriginal).getByRole('button', { name: 'Fechar alerta' });
      await userEvent.click(dismiss);
      // Segunda ativação com a saída ainda em curso: tem que cair na guarda de
      // fechamento em andamento. Sem ela o `toHaveBeenCalledTimes(1)` abaixo é
      // verdade trivial — nunca houve chance de disparar duas vezes.
      dismiss.click();
      // E a animação de um descendente também não pode encerrar a saída.
      dismiss.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
      await expect(alertOriginal).toBeInTheDocument();

      // waitFor: a saída é animada (.nds-animate-out) e o nó só é removido
      // quando a animação termina — ou no timeout de segurança do primitivo.
      await waitFor(() => expect(alertOriginal).not.toBeInTheDocument());
      await expect(onDismissClick).toHaveBeenCalledTimes(1);

      await waitFor(async () => {
        const remontado = canvas.getByRole('alert');
        await expect(remontado).not.toBe(alertOriginal);
        await expect(remontado).toBeVisible();
      });
    });
  },
};

export const DismissibleByKeyboard: Story = {
  // Override de story: o rótulo do botão de fechar é o que muda aqui, e ele só
  // existe na chamada da fábrica.
  parameters: {
    docs: {
      source: {
        transform: alertSourceWith({
          variant: 'success',
          dismissible: true,
          dismissLabel: 'Fechar confirmação',
          title: 'Perfil atualizado',
          description: 'Suas informações foram salvas com sucesso.',
        }),
      },
    },
  },
  render: () => {
    onDismissKeyboard.mockClear();
    return mountRemountingAlert(onDismissKeyboard, (onDismiss) => {
      const el = createAlert({
        variant: 'success',
        dismissible: true,
        dismissLabel: 'Fechar confirmação',
        onDismiss,
      });
      el.appendChild(createAlertIcon('success'));
      el.appendChild(createAlertTitle({ text: 'Perfil atualizado' }));
      el.appendChild(createAlertDescription({ text: 'Suas informações foram salvas com sucesso.' }));
      return el;
    });
  },

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Enter no X focado remove o alert original, dispara o callback uma vez e a demo remonta', async () => {
      const alertOriginal = canvas.getByRole('alert');
      within(alertOriginal).getByRole('button', { name: 'Fechar confirmação' }).focus();
      await userEvent.keyboard('{Enter}');

      // waitFor: a saída é animada (.nds-animate-out) e o nó só é removido
      // quando a animação termina — ou no timeout de segurança do primitivo.
      await waitFor(() => expect(alertOriginal).not.toBeInTheDocument());
      await expect(onDismissKeyboard).toHaveBeenCalledTimes(1);

      await waitFor(async () => {
        const remontado = canvas.getByRole('alert');
        await expect(remontado).not.toBe(alertOriginal);
        await expect(remontado).toBeVisible();
      });
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
    // Override de story: as cinco variantes aparecem sem ícone, e é a
    // composição título + texto corrido que está sendo medida.
    docs: {
      source: {
        transform: alertSourceWith({
          icon: false,
          title: 'Título da variante',
          description: 'Texto corrido da variante.',
        }),
      },
      description: {
        story:
          'Título e texto de cada variante medidos contra o fundo composto, nos três temas de marca e nos dois modos. O mínimo é 4.5:1 — o título tem 14px semibold, que pela WCAG não conta como texto grande.',
      },
    },
  },
  render: () => {
    const stack = document.createElement('div');
    stack.className = 'nds-stack';
    stack.dataset.spacing = 'sm';
    for (const v of ['default', 'destructive', 'success', 'warning', 'info'] as const) {
      const alerta = createAlert({ variant: v });
      alerta.append(
        createAlertTitle({ text: `Título ${v}` }),
        createAlertDescription({ text: `Texto corrido da variante ${v}.` }),
      );
      stack.appendChild(alerta);
    }
    return stack;
  },
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
