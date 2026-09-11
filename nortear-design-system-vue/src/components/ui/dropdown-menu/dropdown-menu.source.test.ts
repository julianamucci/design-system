import { describe, expect, it } from 'vitest';
import {
  dropdownMenuOpenSource,
  dropdownMenuWithShortcutsSource,
  dropdownMenuWithChoiceUnicaSource,
  dropdownMenuWithMarkupSource,
  dropdownMenuWithLabelSource,
  dropdownMenuWithSubmenuSource,
  dropdownMenuControlledSource,
  dropdownMenuDestructiveSource,
  dropdownMenuClosedSource,
  dropdownMenuItemDisabledSource,
  dropdownMenuMarkupMistaSource,
  dropdownMenuDefaultSource,
  dropdownMenuSnippet,
  dropdownMenuSource,
} from './dropdown-menu.source';

describe('dropdownMenuSource', () => {
  it('sem args, entrega a forma canônica: grupo nomeado, ações e a saída', () => {
    expect(dropdownMenuSource()).toBe(
      `<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline">Abrir menu</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuGroup>
        <DropdownMenuLabel>Conta</DropdownMenuLabel>
        <DropdownMenuItem>Perfil</DropdownMenuItem>
        <DropdownMenuItem>Configurações</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Sair</DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>`,
    );
  });

  it('não repete os padrões do painel nem o andaime do quadro do Storybook', () => {
    const saida = dropdownMenuSource();
    // `side="bottom"` e `align="start"` são os padrões do painel — as stories os
    // escrevem, o snippet não.
    expect(saida).not.toContain('side=');
    expect(saida).not.toContain('align=');
    // O `<div>` de contenção com altura mínima só existe para o popup caber no
    // canvas.
    expect(saida).not.toContain('style=');
    expect(saida).not.toContain('min-height');
  });

  it('fechado e modal são os padrões da raiz, e ficam fora do snippet', () => {
    const saida = dropdownMenuSource('', { args: { defaultOpen: false, modal: true } });
    expect(saida).toContain('  <DropdownMenu>\n');
    expect(saida).not.toContain('default-open');
    expect(saida).not.toContain('modal');
  });

  it('cada control que sai do padrão escreve a sua prop', () => {
    expect(dropdownMenuSource('', { args: { defaultOpen: true } })).toContain(
      '<DropdownMenu default-open>',
    );
    expect(dropdownMenuSource('', { args: { modal: false } })).toContain(
      '<DropdownMenu :modal="false">',
    );
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    // `onUpdate:open` é `fn()` no meta: interpolado direto, o corpo do mock
    // apareceria no painel como se fosse o exemplo.
    const saida = dropdownMenuSource('', {
      args: { defaultOpen: (() => {}) as never, modal: (() => {}) as never },
    });
    expect(saida).not.toContain('function');
    expect(saida).toContain('  <DropdownMenu>\n');
  });
});

describe('transforms das stories de variante', () => {
  it('o item neutro não escreve a variante padrão', () => {
    expect(dropdownMenuDefaultSource()).not.toContain('variant="default"');
    expect(dropdownMenuDefaultSource()).not.toContain('DropdownMenuSeparator');
  });

  it('a ação irreversível se declara por prop e vem separada das demais', () => {
    const saida = dropdownMenuDestructiveSource();
    expect(saida).toContain('<DropdownMenuSeparator />');
    expect(saida).toContain('<DropdownMenuItem variant="destructive">Excluir conta</DropdownMenuItem>');
  });
});

describe('transforms das stories de estado', () => {
  it('só a story da montagem aberta escreve `default-open`', () => {
    expect(dropdownMenuOpenSource()).toContain('<DropdownMenu default-open>');
    // Nas demais a prop é andaime da foto do Chromatic.
    expect(dropdownMenuClosedSource()).not.toContain('default-open');
    expect(dropdownMenuItemDisabledSource()).not.toContain('default-open');
    expect(dropdownMenuWithLabelSource()).not.toContain('default-open');
  });

  it('o controlado mantém o gatilho e liga o par prop+evento', () => {
    const saida = dropdownMenuControlledSource();
    expect(saida).toContain('const aberto = ref(false)');
    expect(saida).toContain('<DropdownMenu :open="aberto" @update:open="aberto = $event">');
    // O gatilho continua ali: o que muda é quem manda na abertura.
    expect(saida).toContain('<DropdownMenuTrigger as-child>');
    // O botão de fora lê o MESMO estado — é o que prova que o evento voltou.
    expect(saida).toContain(`{{ aberto ? 'Fechar pelo estado' : 'Abrir pelo estado' }}`);
  });

  it('o item indisponível continua no menu, declarado por prop', () => {
    const saida = dropdownMenuItemDisabledSource();
    expect(saida).toContain('<DropdownMenuItem disabled>Arquivar</DropdownMenuItem>');
    // Pular a seta e barrar o ponteiro vêm da prop; escrever `tabindex` ou
    // `pointer-events` aqui ensinaria API que não existe.
    expect(saida).not.toContain('tabindex');
    expect(saida).not.toContain('pointer-events');
  });

  it('os três estados da marcação aparecem lado a lado, por valor fixo', () => {
    const saida = dropdownMenuMarkupMistaSource();
    expect(saida).toContain('<DropdownMenuCheckboxItem model-value="indeterminate">Nome');
    expect(saida).toContain('<DropdownMenuCheckboxItem :model-value="true">E-mail');
    expect(saida).toContain('<DropdownMenuCheckboxItem :model-value="false">Telefone');
    // Valor fixo, e não ligado: um `v-model` pediria um estado que a story não
    // tem — e o primeiro clique num item misto o resolveria para marcado.
    expect(saida).not.toContain('v-model');
  });
});

describe('transforms das stories de composição', () => {
  it('cada grupo é nomeado pelo próprio rótulo, e o separador os divide', () => {
    const saida = dropdownMenuWithLabelSource();
    expect([...saida.matchAll(/<DropdownMenuGroup>/g)].length).toBe(2);
    expect(saida).toContain('<DropdownMenuLabel>Conta</DropdownMenuLabel>');
    expect(saida).toContain('<DropdownMenuLabel>Suporte</DropdownMenuLabel>');
    expect([...saida.matchAll(/<DropdownMenuSeparator \/>/g)].length).toBe(1);
  });

  it('na marcação cada item guarda o seu próprio estado', () => {
    const saida = dropdownMenuWithMarkupSource();
    expect(saida).toContain('const mostrarNome = ref(true)');
    expect(saida).toContain('const mostrarEmail = ref(false)');
    expect(saida).toContain('const mostrarFuncao = ref(false)');
    // Um `ref` por item — é o que separa marcação de escolha única.
    expect(saida).toContain('<DropdownMenuCheckboxItem v-model="mostrarNome">Nome');
    expect(saida).toContain('<DropdownMenuCheckboxItem v-model="mostrarEmail">E-mail');
    expect(saida).toContain('<DropdownMenuCheckboxItem v-model="mostrarFuncao">Função');
    // TRÊS alternadores, como a story ao lado e como a referência.
    expect([...saida.matchAll(/<DropdownMenuCheckboxItem /g)].length).toBe(3);
  });

  it('na escolha única o valor vive no grupo, e cada item traz o seu `value`', () => {
    const saida = dropdownMenuWithChoiceUnicaSource();
    expect(saida).toContain(`const tema = ref('light')`);
    expect(saida).toContain('<DropdownMenuRadioGroup v-model="tema">');
    expect(saida).toContain('<DropdownMenuRadioItem value="system">Sistema</DropdownMenuRadioItem>');
    // O valor NÃO se repete em cada item.
    expect(saida).not.toContain('<DropdownMenuRadioItem v-model');
  });

  it('o submenu é a tríade completa, com o conteúdo dentro dela', () => {
    // A indentação é de seis espaços porque o submenu mora DENTRO de
    // `DropdownMenuContent` — a asserção media quatro e reprovava um snippet
    // correto por causa do próprio recuo que ela esperava errado.
    expect(dropdownMenuWithSubmenuSource()).toContain(`      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Exportar</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem>PDF</DropdownMenuItem>
          <DropdownMenuItem>CSV</DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>`);
  });

  it('o atalho mora dentro do item e não se esconde do leitor de tela', () => {
    const saida = dropdownMenuWithShortcutsSource();
    expect(saida).toContain('Copiar<DropdownMenuShortcut>Ctrl+C</DropdownMenuShortcut>');
    // Escondido, a pessoa ouviria só "Copiar" e nunca saberia da tecla.
    expect(saida).not.toContain('aria-hidden');
  });
});

describe('dropdownMenuSnippet — o menu descrito por dados', () => {
  it('imprime os rótulos que recebe: o código diz o que a prévia diz, em qualquer idioma', () => {
    const saida = dropdownMenuSnippet({
      triggerLabel: 'Account',
      entries: [
        { kind: 'item', label: 'Rename', value: 'rename' },
        { kind: 'separator' },
        { kind: 'item', label: 'Delete account', value: 'delete-account', destructive: true },
      ],
    });
    expect(saida).toContain('<Button variant="outline">Account</Button>');
    expect(saida).toContain('<DropdownMenuItem>Rename</DropdownMenuItem>');
    expect(saida).toContain('<DropdownMenuItem variant="destructive">Delete account</DropdownMenuItem>');
    expect(saida).not.toContain('Conta');
    // O id estável é do evento, não do código: o item de ação não tem valor.
    expect(saida).not.toContain('delete-account');
  });

  it('declara o ESTADO INICIAL de cada marcação e da escolha única, com o nome do id estável', () => {
    const saida = dropdownMenuSnippet({
      triggerLabel: 'Columns',
      entries: [
        {
          kind: 'group',
          label: 'Visible columns',
          items: [
            { kind: 'checkbox', label: 'Name', value: 'column-name', checked: true },
            { kind: 'checkbox', label: 'Email', value: 'column-email', checked: false },
          ],
        },
        {
          kind: 'radio-group',
          label: 'Appearance',
          value: 'theme',
          selected: 'light',
          options: [
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
          ],
        },
      ],
    });
    // Sem os `ref` o trecho ligava `v-model` a nomes que não existiam — era o
    // defeito do card de marcação.
    expect(saida).toContain(`import { ref } from 'vue'

const columnName = ref(true)
const columnEmail = ref(false)
const theme = ref('light')`);
    expect(saida).toContain('<DropdownMenuCheckboxItem v-model="columnName">');
    // O rótulo mora DENTRO do grupo que ele nomeia — nos dois tipos de grupo.
    expect(saida).toContain(`      <DropdownMenuGroup>
        <DropdownMenuLabel>Visible columns</DropdownMenuLabel>`);
    expect(saida).toContain(`      <DropdownMenuRadioGroup v-model="theme">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>`);
  });

  it('importa só as peças usadas, e só declara `ref` quando há estado', () => {
    const saida = dropdownMenuSnippet({
      entries: [
        { kind: 'item', label: 'Undo', value: 'undo', shortcut: 'Ctrl+Z' },
        { kind: 'submenu', label: 'Export', items: [{ kind: 'item', label: 'PDF', value: 'pdf' }] },
      ],
    });
    expect(saida).toContain(`import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'`);
    expect(saida).not.toContain(`from 'vue'`);
    expect(saida).toContain(`      <DropdownMenuItem>
        Undo
        <DropdownMenuShortcut>Ctrl+Z</DropdownMenuShortcut>
      </DropdownMenuItem>`);
  });

  it('um rótulo com sinal de menor vira expressão, e o trecho continua válido', () => {
    const saida = dropdownMenuSnippet({ entries: [{ kind: 'item', label: 'a < b', value: 'a' }] });
    expect(saida).toContain(`<DropdownMenuItem>{{ 'a < b' }}</DropdownMenuItem>`);
  });

  it('sem args, o menu canônico: grupo nomeado, divisor e a saída destrutiva', () => {
    const saida = dropdownMenuSnippet();
    expect(saida).toContain('<DropdownMenuLabel>Conta</DropdownMenuLabel>');
    expect(saida).toContain('<DropdownMenuItem variant="destructive">Sair</DropdownMenuItem>');
  });
});
