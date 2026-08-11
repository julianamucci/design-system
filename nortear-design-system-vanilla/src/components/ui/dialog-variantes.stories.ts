import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent } from 'storybook/test';
import { createDialog } from './dialog';
import { createButton } from './button';
import { createInput } from './input';
import { createLabel } from './label';
import {
  abrir,
  botaoFecharDoCanto,
  conferirNomeEDescricao,
  esperarAberto,
  esperarFechado,
} from './dialog.fixtures';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/Dialog/Variants',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes estruturais do Dialog. Não há prop variant — escolha a composição que melhor descreve o caso de uso.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * As ações do rodapé saem como LISTA, não embrulhadas num `<div>`: quem faz o
 * arranjo (empilhar ao contrário no estreito, alinhar à direita no largo) é o
 * `.nds-dialog-footer`, e para isso os botões precisam ser filhos diretos dele.
 */
function makeFooter(cancelLabel: string, actionLabel: string, destructive = false): HTMLElement[] {
  return [
    createButton({ variant: 'outline', label: cancelLabel }),
    createButton({ variant: destructive ? 'destructive' : 'default', label: actionLabel }),
  ];
}

function buildField(id: string, labelText: string, type: string, value: string): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'nds-stack';
  wrapper.dataset.spacing = 'xs';
  // Factories do sistema em vez de `<input>` cru com `style`: o cru trazia
  // padding inline, que sai do tema, da densidade e da escala.
  wrapper.append(
    createLabel({ text: labelText, htmlFor: id }),
    createInput({ id, type, value }),
  );
  return wrapper;
}

function makeBody(text: string): HTMLElement {
  const body = document.createElement('div');
  body.className = 'nds-text-body nds-text-muted-foreground';
  body.textContent = text;
  return body;
}

/** Abre pelo gatilho depois da montagem — a factory não tem `defaultOpen`. */
function abrirNaMontagem(dialog: HTMLElement): HTMLElement {
  queueMicrotask(() => dialog.querySelector<HTMLElement>('button')?.click());
  return dialog;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: { description: { story: 'Title + Description + Footer com ação primária.' } },
  },
  render: () =>
    abrirNaMontagem(
      createDialog({
        trigger: createButton({ variant: 'outline', label: 'Editar perfil' }),
        title: 'Editar perfil',
        description: 'Atualize suas informações pessoais.',
        content: makeBody('Os campos estariam aqui em uma aplicação real.'),
        footer: makeFooter('Cancelar', 'Salvar alterações'),
      }),
    ),
  play: async ({ step }) => {
    const p = await esperarAberto();

    await step('As quatro partes da composição padrão estão no painel', async () => {
      await expect(p.querySelector('[data-slot="dialog-header"]')).toBeInTheDocument();
      await expect(p.querySelector('[data-slot="dialog-body"]')).toBeInTheDocument();
      await expect(p.querySelector('[data-slot="dialog-footer"]')).toBeInTheDocument();
      await conferirNomeEDescricao(p);
    });

    await step('A ação primária é a última do rodapé, e é filha direta dele', async () => {
      const rodape = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const botoes = rodape.querySelectorAll<HTMLElement>('button');
      await expect(botoes.length).toBe(2);
      await expect(botoes[0].parentElement).toBe(rodape);
      await expect(botoes[botoes.length - 1]).toHaveClass('nds-button-default');
    });
  },
};

export const WithForm: Story = {
  parameters: {
    covers: ['visual.item2', 'visual.item4'],
    docs: { description: { story: 'Body com formulário inline. O submit dispara a ação primária.' } },
  },
  render: () => {
    const form = document.createElement('form');
    form.className = 'nds-stack';
    form.dataset.spacing = 'md';
    form.append(
      buildField('dialog-name', 'Nome', 'text', 'Maria Souza'),
      buildField('dialog-email', 'E-mail', 'email', 'maria@exemplo.com'),
    );
    return abrirNaMontagem(
      createDialog({
        trigger: createButton({ variant: 'outline', label: 'Editar perfil' }),
        title: 'Editar perfil',
        description: 'Atualize suas informações pessoais.',
        content: form,
        footer: makeFooter('Cancelar', 'Salvar alterações'),
      }),
    );
  },
  play: async ({ step }) => {
    const p = await esperarAberto();

    await step('Os campos estão rotulados e trazem o valor inicial', async () => {
      const nome = p.querySelector<HTMLInputElement>('#dialog-name')!;
      // `toHaveAccessibleName` e não a presença do `<label>`: o que importa é o
      // par for/id ter fechado, e é isso que o leitor de tela anuncia.
      await expect(nome).toHaveAccessibleName('Nome');
      await expect(nome.value).toBe('Maria Souza');

      const email = p.querySelector<HTMLInputElement>('#dialog-email')!;
      await expect(email).toHaveAccessibleName('E-mail');
      await expect(email.value).toBe('maria@exemplo.com');
    });

    await step('O foco alcança os campos por teclado, dentro do painel', async () => {
      const nome = p.querySelector<HTMLInputElement>('#dialog-name')!;
      nome.focus();
      await expect(document.activeElement).toBe(nome);
      await userEvent.tab();
      await expect(document.activeElement).toBe(p.querySelector('#dialog-email'));
    });
  },
};

export const WithScrollContent: Story = {
  parameters: {
    covers: ['visual.item5'],
    docs: {
      description: {
        story:
          'Body longo com rolagem própria: o painel fica parado e centralizado, e header e rodapé continuam visíveis.',
      },
    },
  },
  render: () => {
    const longBody = document.createElement('div');
    // Classe do CSS compartilhado em vez de `overflow-y-auto` (que não existe)
    // mais `style.maxHeight` inline.
    longBody.className =
      'nds-dialog-body-scroll nds-stack nds-text-body nds-text-muted-foreground';
    longBody.dataset.spacing = 'md';
    longBody.tabIndex = 0;
    longBody.setAttribute('role', 'region');
    longBody.setAttribute('aria-label', 'Conteúdo rolável');
    for (let i = 1; i <= 12; i++) {
      const p = document.createElement('p');
      p.textContent = `Parágrafo ${i}: termos de uso longos para garantir que o body precise rolar internamente sem expandir o painel.`;
      longBody.appendChild(p);
    }
    return abrirNaMontagem(
      createDialog({
        trigger: createButton({ variant: 'outline', label: 'Ler termos' }),
        title: 'Termos de uso',
        description: 'Leia atentamente antes de aceitar.',
        content: longBody,
        footer: makeFooter('Cancelar', 'Aceitar termos'),
      }),
    );
  },
  play: async ({ step }) => {
    const p = await esperarAberto();

    await step('O corpo rola sozinho, com header e rodapé parados', async () => {
      // Comportamento e não nome de classe: o corpo precisa poder rolar E ter
      // conteúdo mais alto que a própria caixa.
      const corpo = p.querySelector<HTMLElement>('[role="region"]')!;
      await expect(getComputedStyle(corpo).overflowY).toBe('auto');
      await expect(corpo.scrollHeight).toBeGreaterThan(corpo.clientHeight);
      await expect(p.querySelector('[data-slot="dialog-header"]')).toBeInTheDocument();
      await expect(p.querySelector('[data-slot="dialog-footer"]')).toBeInTheDocument();
    });

    await step('A região rolável é alcançável por teclado e tem nome', async () => {
      // Sem `tabindex` quem navega só por teclado não consegue rolar a caixa.
      const corpo = p.querySelector<HTMLElement>('[role="region"]')!;
      await expect(corpo).toHaveAttribute('tabindex', '0');
      await expect(corpo).toHaveAccessibleName();
    });
  },
};

export const NoFooter: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: { description: { story: 'Apenas Title + Description. Uso informativo ou pré-visualização passiva.' } },
  },
  render: () =>
    abrirNaMontagem(
      createDialog({
        trigger: createButton({ variant: 'outline', label: 'Sobre este recurso' }),
        title: 'Sobre este recurso',
        description: 'Detalhes técnicos exibidos para fins informativos. Sem ações.',
        content: makeBody('O fechamento ocorre via X, Escape ou clique no overlay.'),
      }),
    ),
  play: async ({ canvasElement, step }) => {
    const p = await esperarAberto();

    await step('Sem rodapé, o botão X é a única saída visível', async () => {
      await expect(p.querySelector('[data-slot="dialog-footer"]')).toBeNull();
      const x = botaoFecharDoCanto(p)!;
      await expect(x).toHaveAccessibleName();
    });

    await step('E ele fecha de verdade — a story volta a abrir para a captura', async () => {
      await userEvent.click(botaoFecharDoCanto(p)!);
      await esperarFechado();
      // O Chromatic fotografa o estado final: uma composição que termina
      // fechada capturaria só o gatilho.
      await expect(await abrir(canvasElement)).toBeVisible();
    });
  },
};

export const WithDestructiveAction: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      description: {
        story:
          'Action destrutiva no Footer. Use só quando a destrutividade é secundária ao fluxo (ex: remover item de lista). Para confirmação destrutiva primária use AlertDialog.',
      },
    },
  },
  render: () =>
    abrirNaMontagem(
      createDialog({
        trigger: createButton({ variant: 'outline', label: 'Remover item' }),
        title: 'Remover item da lista?',
        description: 'O item sai desta lista, mas continua disponível na biblioteca.',
        content: makeBody('Você poderá adicioná-lo novamente a qualquer momento.'),
        footer: makeFooter('Cancelar', 'Remover', true),
      }),
    ),
  play: async ({ step }) => {
    const p = await esperarAberto();

    await step('A ação primária carrega a variante destrutiva', async () => {
      const rodape = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const botoes = rodape.querySelectorAll<HTMLElement>('button');
      await expect(botoes[botoes.length - 1]).toHaveClass('nds-button-destructive');
    });

    await step('Ainda assim é um Dialog, não um AlertDialog', async () => {
      // A destrutividade aqui é secundária ao fluxo (remover de uma lista, não
      // apagar o recurso). Confirmação irreversível pede `role="alertdialog"`,
      // foco inicial no Cancelar e Cancelar obrigatório — outro componente.
      await expect(p).toHaveAttribute('role', 'dialog');
    });
  },
};

export const CustomCloseInFooter: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      description: {
        story: 'showCloseButton=false no Content; o botão de fechar passa a acompanhar as ações do Footer.',
      },
    },
  },
  render: () => {
    const fecharNoRodape = createButton({ variant: 'ghost', label: 'Fechar' });
    // O botão precisa FECHAR de verdade: a factory não liga um `DialogClose`
    // sozinha, e um "Fechar" que não fecha seria a story documentando o
    // contrário do que promete. O clique no overlay é o caminho público.
    fecharNoRodape.addEventListener('click', () => {
      document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]')?.click();
    });

    return abrirNaMontagem(
      createDialog({
        trigger: createButton({ variant: 'outline', label: 'Abrir guia' }),
        title: 'Próximos passos',
        description: 'Continue o fluxo ou volte ao início.',
        content: makeBody('O guia continua disponível no menu de ajuda.'),
        footer: [
          createButton({ variant: 'outline', label: 'Voltar' }),
          createButton({ variant: 'default', label: 'Continuar' }),
          fecharNoRodape,
        ],
        showCloseButton: false,
      }),
    );
  },
  play: async ({ canvasElement, step }) => {
    const p = await esperarAberto();

    await step('Sem X no canto, o fechar mora no rodapé', async () => {
      await expect(botaoFecharDoCanto(p)).toBeNull();
      const rodape = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      await expect(within(rodape).getByRole('button', { name: /fechar/i })).toBeVisible();
    });

    await step('E o botão do rodapé fecha o diálogo', async () => {
      const rodape = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      await userEvent.click(within(rodape).getByRole('button', { name: /fechar/i }));
      await esperarFechado();
      // Reabre: o Chromatic fotografa o estado final da play.
      await expect(await abrir(canvasElement)).toBeVisible();
    });
  },
};
