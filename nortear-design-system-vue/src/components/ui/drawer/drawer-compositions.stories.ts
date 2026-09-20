import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, waitFor } from 'storybook/test';
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { waitForPortal } from '@/lib/wait-for-portal';
import {
  drawerWithConfirmSource,
  drawerWithFormSource,
} from './drawer.source';

import { figmaDesign } from '@shared/figma/design-links';
import drawerTranslations from '@shared/content/drawer/translations.json';

/**
 * Rótulos dos cenários: saem do MESMO `translations.json` que a docs page lê,
 * onde cada chave existe nos três idiomas. A story é fixture e fica presa a
 * pt-BR de propósito — quem resolve o idioma de quem lê é a docs page, e uma
 * play que dependesse do seletor de idioma procuraria um nome diferente a cada
 * rodada. A interpolação é do template literal (`${...}`), e não uma mustache:
 * assim o nome da chave passa pelo `vue-tsc`, que não abre template em string.
 *
 * O que segue literal aqui é o que o conteúdo compartilhado NÃO nomeia — ver o
 * comentário de cada ponto.
 */
const L = drawerTranslations['pt-BR'].demonstration.labels;
const meta = {
  title: 'Components/Overlay/Drawer/Compositions',
  component: Drawer,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('drawer'),
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: drawerWithFormSource },
      description: {
        component:
          'Combinações canônicas: formulário curto com confirmar/cancelar e confirmação de ação destrutiva.',
      },
    },
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Button,
  Input,
  Label,
};

export const WithForm: Story = {
  parameters: {
    covers: ['visual.item5'],
    docs: {
      description: {
        story:
          'Formulário curto no corpo e par de ações no rodapé. Título e descrição dizem o que está sendo editado — juntos formam o nome e a descrição acessíveis do painel.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <Drawer :default-open="true" direction="bottom">
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>${L.title}</DrawerTitle>
              <DrawerDescription>Atualize seu nome e e-mail.</DrawerDescription>
            </DrawerHeader>
            <DrawerBody>
              <form id="drawer-form" class="nds-grid" data-spacing="sm" @submit.prevent>
                <div class="nds-grid" data-spacing="xs">
                  <Label for="drawer-name">${L.fieldName}</Label>
                  <Input id="drawer-name" model-value="Juliana Mucci" />
                </div>
                <div class="nds-grid" data-spacing="xs">
                  <Label for="drawer-email">${L.fieldEmail}</Label>
                  <Input id="drawer-email" type="email" model-value="juliana@example.com" />
                </div>
              </form>
            </DrawerBody>
            <DrawerFooter>
              <DrawerClose as-child>
                <Button type="button" variant="outline">${L.cancel}</Button>
              </DrawerClose>
              <Button type="submit" form="drawer-form">Confirmar</Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    `,
  }),
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');
    const inside = within(panel);

    await step('O painel carrega nome, descrição e os campos do formulário', async () => {
      await expect(panel).toHaveAccessibleName(L.title);
      await expect(panel).toHaveAccessibleDescription('Atualize seu nome e e-mail.');
      // Os campos são achados pelo RÓTULO: se `for`/`id` não casassem, o input
      // ficaria sem nome acessível e a busca falharia.
      await expect(inside.getByLabelText(L.fieldName)).toBeInTheDocument();
      await expect(inside.getByLabelText(L.fieldEmail)).toBeInTheDocument();
    });

    await step('O rodapé escreve o secundário ANTES do primário', async () => {
      const footer = panel.querySelector<HTMLElement>('[data-slot="drawer-footer"]')!;
      await expect(footer).not.toBeNull();
      const names = within(footer).getAllByRole('button').map((b) => b.textContent?.trim());
      // `toContain` dizia que os dois estão lá e não dizia em que ordem — era o
      // que as CINCO stacks afirmavam, e é a pendência do §2 do PRD. A D1 fixa
      // uma ordem só de DOM para os dois eixos: secundário primeiro, porque o
      // `column-reverse` põe o primário em cima quando empilha e o `row` o põe
      // à direita quando cabe lado a lado.
      await expect(names).toEqual([L.cancel, 'Confirmar']);
    });

    await step('E é a folha que decide o eixo, não a marcação', async () => {
      const footer = panel.querySelector<HTMLElement>('[data-slot="drawer-footer"]')!;
      // A outra metade da D1: a mesma ordem de DOM tem de RENDERIZAR o primário
      // em cima (empilhado) ou à direita (lado a lado). Afirmar só o DOM
      // passaria com a folha invertida, que é exatamente o defeito corrigido em
      // 2026-09-07 — `flex-direction: column` puro, primário embaixo.
      //
      // O ponto de corte é o da folha: `@media (min-width: 40rem)`, e 40rem são
      // 640px na raiz de 16px.
      const eixoEsperado = window.innerWidth >= 640 ? 'row' : 'column-reverse';
      await expect(getComputedStyle(footer).flexDirection).toBe(eixoEsperado);
    });

    await step('Confirmar submete o formulário do corpo', async () => {
      // `button.form` é o que denuncia o botão órfão: vem `null` quando nada o
      // liga ao `<form>`, e nada na tela denuncia. Leitura pura, sem `waitFor`.
      const confirmar = inside.getByRole('button', { name: 'Confirmar' }) as HTMLButtonElement;
      await expect(confirmar.type).toBe('submit');
      await expect(confirmar.form?.id).toBe('drawer-form');
    });
  },
};

export const WithConfirmation: Story = {
  parameters: {
    docs: {
      // Sem corpo e com a ação principal na variante de perigo: o snippet do
      // meta mostra o oposto dos dois.
      source: { transform: drawerWithConfirmSource },
      description: {
        story:
          'Mensagem curta e par de ações, com a principal na variante destrutiva. Vale para confirmação reversível; se a ação for realmente bloqueante, o componente é o AlertDialog.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <Drawer :default-open="true" direction="bottom">
          <!--
            A decisão É a tela: o painel abre com o foco no fechador do rodapé,
            como o AlertDialog faz — o Enter por reflexo tem de cair na saída
            segura, nunca na ação que consuma. Na WithForm o padrão FICA, porque
            ali o assunto é editar.

            É prop, e não gancho da lib: a lib desta stack cancela o foco
            automático do diálogo e não repassa o evento. Ver DrawerContent.vue.
          -->
          <DrawerContent initial-focus="close">
            <DrawerHeader>
              <DrawerTitle>Remover anexo?</DrawerTitle>
              <DrawerDescription>O anexo sai desta mensagem. Você pode adicioná-lo novamente depois.</DrawerDescription>
            </DrawerHeader>
            <!--
              O corpo existe: o vanilla (referência) e o svelte o renderizam, e
              esta stack, o react e o angular não. Divergência de EXEMPLO — as
              cinco páginas mostram o mesmo painel, ou comparar uma com a outra
              deixa de responder alguma coisa.
            -->
            <DrawerBody class="nds-text-body nds-text-muted-foreground">
              O anexo sai desta mensagem e continua na biblioteca.
            </DrawerBody>
            <DrawerFooter>
              <DrawerClose as-child>
                <Button variant="outline">${L.cancel}</Button>
              </DrawerClose>
              <Button variant="destructive">Remover</Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    `,
  }),
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');
    const inside = within(panel);

    await step('A consequência está escrita, não subentendida', async () => {
      await expect(panel).toHaveAccessibleName('Remover anexo?');
      await expect(panel).toHaveAccessibleDescription(/adicioná-lo novamente depois/i);
    });

    await step('A ação principal carrega a variante destrutiva', async () => {
      const destrutivo = inside.getByRole('button', { name: /^Remover$/i });
      await expect(destrutivo).toHaveClass('nds-button-destructive');
      const cancelar = inside.getByRole('button', { name: L.cancel });
      await expect(cancelar).toHaveClass('nds-button-outline');
    });

    await step('O foco abre no cancelar, não na ação destrutiva', async () => {
      // O ELEMENTO, não a mera presença de foco: o padrão é o PRIMEIRO focável,
      // que neste painel é o corpo rolável — e corpo focado também tem foco
      // dentro do painel. É justamente o que esta story recusa: aqui a decisão
      // É a tela, e o Enter por reflexo tem de cair na saída segura.
      const body = panel.querySelector<HTMLElement>('[data-slot="drawer-body"]')!;
      const cancelar = inside.getByRole('button', { name: L.cancel });
      const destrutivo = inside.getByRole('button', { name: /^Remover$/i });
      await waitFor(() => expect(cancelar).toHaveFocus());
      await expect(destrutivo).not.toHaveFocus();
      await expect(body).not.toHaveFocus();
    });
  },
};
