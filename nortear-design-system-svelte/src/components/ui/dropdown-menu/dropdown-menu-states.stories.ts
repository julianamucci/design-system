import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import DropdownMenuStory from './DropdownMenuStory.svelte';
import { formaDoIndicador, ehTraco, ehTique } from '@shared/testing/menu-checkbox-indicator';
import {
  dropdownMenuControlledSource,
  dropdownMenuIndeterminadoSource,
  dropdownMenuItemDisabledSource,
  dropdownMenuSource,
} from './dropdown-menu.source';

const meta: Meta = {
  title: 'Primitives/Overlay/DropdownMenu/States',
  component: DropdownMenuStory,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo. Fechado e aberto são
      // exatamente o que os args declaram; os outros dois sobrescrevem abaixo.
      source: { transform: dropdownMenuSource },
      description: {
        component:
          'Fechado, aberto, controlado por fora e item desabilitado. Teclado, foco e bloqueio ' +
          'vêm do primitivo — o que estas stories provam é que a composição não desfaz nada disso.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Closed: Story = {
  args: { defaultOpen: false, variant: 'default', triggerLabel: 'Mais ações' },
  parameters: { covers: ['accessibility.item2'] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: /Mais ações/i });

    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    // O portal desmonta o popup ao fechar: fechado não é "escondido com
    // display:none", é ausente do DOM. Um popup só escondido continuaria no
    // percurso do leitor de tela.
    await expect(body.queryAllByRole('menu')).toHaveLength(0);
    await expect(body.queryAllByRole('menuitem')).toHaveLength(0);
  },
};

export const Open: Story = {
  args: { defaultOpen: true, variant: 'default', triggerLabel: 'Mais ações' },
  parameters: {
    covers: ['functional.item2', 'accessibility.item3'],
    // Medido pela sonda desta rodada: a busca por digitação do primitivo não
    // move o foco neste stack, com o menu aberto e o foco num item. Não há prop
    // nossa que ligue — declarar cobertura aqui faria o auditor mentir.
    coversNotApplicable: {
      'accessibility.item4':
        'a busca por digitação do primitivo não responde neste stack; setas e Home/End são verificados aqui',
    },
  },
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const items = within(menu).getAllByRole('menuitem');

    await step('O menu abre com os três itens', async () => {
      await expect(items).toHaveLength(3);
    });

    await step('O item em foco por teclado mostra o anel', async () => {
      // Até aqui o item destacado era indicado SÓ pelo preenchimento de accent,
      // e no tema default o texto não muda de cor: quem navega por teclado
      // dependia da diferença entre o fundo do item e o do painel, que nunca
      // chegou aos 3:1 da WCAG 1.4.11.
      //
      // A asserção lê o outline COMPUTADO, e não a classe: `:focus-visible` é
      // decidido pelo navegador a partir da última interação, e é justamente
      // isso que precisa ser provado — a lib move o foco por código depois da
      // tecla, e só o navegador sabe dizer se aquilo conta como teclado.
      items[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      const emFoco = document.activeElement as HTMLElement;
      await expect(getComputedStyle(emFoco).outlineStyle).toBe('solid');
      await expect(getComputedStyle(emFoco).outlineWidth).toBe('2px');
    });

    await step('As setas descem e sobem um item por vez', async () => {
      items[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(document.activeElement).toBe(items[1]);
      await userEvent.keyboard('{ArrowUp}');
      await expect(document.activeElement).toBe(items[0]);
    });

    await step('Home e End vão ao primeiro e ao último', async () => {
      await userEvent.keyboard('{End}');
      await expect(document.activeElement).toBe(items[2]);
      await userEvent.keyboard('{Home}');
      await expect(document.activeElement).toBe(items[0]);
    });

    await step('O item em foco é o único destacado', async () => {
      // O realce é o que diz onde o teclado está: sem ele a navegação por setas
      // é invisível para quem enxerga.
      const destacados = items.filter((i) => i.hasAttribute('data-highlighted'));
      await expect(destacados).toHaveLength(1);
      await expect(destacados[0]).toBe(document.activeElement);
    });
  },
};

export const Controlled: Story = {
  args: { open: false, variant: 'default', triggerLabel: 'Abrir via estado externo' },
  parameters: {
    docs: {
      source: { transform: dropdownMenuControlledSource },
      description: { story: 'Abertura controlada via open + onOpenChange (bind:open).' },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Abrir via estado externo/i });

    await step('Click no trigger abre menu controlado', async () => {
      // Idempotente: só clica quando o estado atual não é o desejado.
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      const menu = await waitForPortal('menu');
      await expect(menu).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('ESC fecha e o estado de fora acompanha', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('menu');
      // O `aria-expanded` é lido do mesmo estado ligado por `bind:open`: se ele
      // não tivesse voltado, o gatilho continuaria dizendo "true".
      await waitFor(async () => {
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      });
    });
  },
};

export const ItemDisabled: Story = {
  args: { defaultOpen: true, variant: 'itemDisabled', triggerLabel: 'Ações' },
  parameters: {
    covers: ['accessibility.item7'],
    docs: { source: { transform: dropdownMenuItemDisabledSource } },
  },
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const items = within(menu).getAllByRole('menuitem');
    const disabled = within(menu).getByRole('menuitem', { name: /Arquivar/i });

    await step('O item se anuncia desabilitado', async () => {
      await expect(disabled).toHaveAttribute('aria-disabled', 'true');
      await expect(disabled.hasAttribute('data-disabled')).toBe(true);
    });

    await step('O clique é bloqueado pelo CSS, não só pelo callback', async () => {
      // `pointer-events: none` é o que impede o clique de chegar; sem ele o item
      // continuaria clicável e o bloqueio dependeria de cada consumidor.
      await expect(getComputedStyle(disabled).pointerEvents).toBe('none');
    });

    await step('A seta POUSA no item desabilitado', async () => {
      // Decisão de 2026-09-02, nas cinco stacks: o item desabilitado continua no
      // percurso das setas para ser ANUNCIADO como indisponível. Some-lo da roda
      // esconderia de quem navega de ouvido que a opção existe.
      //
      // A asserção anterior aqui media o CONTRÁRIO — "a seta pula" — e passou a
      // estar errada com a decisão. Quem alinha esta stack é o patch de
      // `patches/`, e não código nosso: se ele parar de aplicar, este passo é o
      // primeiro a reprovar.
      items[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(document.activeElement).toBe(disabled);
    });
  },
};

// ─── CheckboxIndeterminate ────────────────────────────────────────────────────
//
// Story SEM interação, de propósito. O que ela declara vale na montagem, e o
// primeiro clique num item misto o resolve para marcado — uma play que clicasse
// aqui mediria outro estado no REPLAY do painel Interactions, que reexecuta no
// mesmo DOM. Sem clique, cada rodada mede exatamente o mesmo.

export const CheckboxIndeterminate: Story = {
  args: { defaultOpen: true, variant: 'indeterminate', triggerLabel: 'Colunas' },
  parameters: {
    covers: ['functional.item8'],
    docs: { source: { transform: dropdownMenuIndeterminadoSource } },
  },
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const canvas = within(menu);
    const misto = canvas.getByRole('menuitemcheckbox', { name: 'Nome' });
    const checked = canvas.getByRole('menuitemcheckbox', { name: 'E-mail' });
    const desmarcado = canvas.getByRole('menuitemcheckbox', { name: 'Telefone' });

    await step('O estado misto é anunciado como misto, e não como marcado', async () => {
      // Uma comparação frouxa leria o misto como verdadeiro; o que a pessoa ouve
      // tem que separar os três estados.
      await expect(misto.getAttribute('aria-checked')).toBe('mixed');
      await expect(checked.getAttribute('aria-checked')).toBe('true');
      await expect(desmarcado.getAttribute('aria-checked')).toBe('false');
    });

    await step('O misto desenha traço; o marcado, tique', async () => {
      // A medida é a GEOMETRIA do glifo, não o nome da classe nem o do ícone:
      // traço é largo e sem altura, tique tem a diagonal. Com o mesmo símbolo
      // nos dois estados — o defeito — esta asserção fica vermelha.
      const formaMista = formaDoIndicador(misto);
      const formaMarcada = formaDoIndicador(checked);
      await expect(ehTraco(formaMista)).toBe(true);
      await expect(ehTique(formaMista)).toBe(false);
      await expect(ehTique(formaMarcada)).toBe(true);
    });

    await step('O desmarcado continua sem glifo nenhum', async () => {
      await expect(formaDoIndicador(desmarcado)).toBeNull();
    });
  },
};
