import { describe, expect, it } from 'vitest';
import {
  dialogOpenSource,
  dialogActionDestructiveSource,
  dialogWithFormSource,
  dialogWithScrollSource,
  dialogOverlayScrollSource,
  dialogConfirmarEmailSource,
  dialogControlledSource,
  dialogEditarPerfilSource,
  footerDialogCloseSource,
  dialogPreviaDeMidiaSource,
  dialogNoButtonCloseSource,
  dialogNoFooterSource,
  dialogSource,
} from './dialog.source';

describe('dialogSource', () => {
  it('sem args, entrega a composição padrão: cabeçalho, saída e ação primária', () => {
    expect(dialogSource()).toBe(
      `<script setup lang="ts">
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
</script>

<template>
  <Dialog>
    <DialogTrigger as-child>
      <Button variant="outline">Editar perfil</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Editar perfil</DialogTitle>
        <DialogDescription>
          Atualize suas informações pessoais. As mudanças são salvas ao confirmar.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline">Cancelar</Button>
        </DialogClose>
        <Button>Salvar alterações</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>`,
    );
  });

  it('o gatilho delega ao Button em vez de embrulhá-lo', () => {
    // Sem `as-child` o design system renderizaria um botão DENTRO de outro.
    expect(dialogSource()).toContain('<DialogTrigger as-child>');
  });

  it('a ação primária é a ÚLTIMA do rodapé, que é a ordem de leitura e de foco', () => {
    const saida = dialogSource();
    const cancelar = saida.indexOf('Cancelar');
    const primaria = saida.indexOf('Salvar alterações');
    expect(cancelar).toBeGreaterThan(-1);
    expect(primaria).toBeGreaterThan(cancelar);
  });

  it('modal ligado e fechado na montagem são os padrões, e não entram no snippet', () => {
    const saida = dialogSource('', { args: { defaultOpen: false, modal: true } });
    expect(saida).toContain('  <Dialog>\n');
    expect(saida).not.toContain('modal');
    expect(saida).not.toContain('default-open');
  });

  it('desligar a modalidade escreve a negação; abrir na montagem escreve a prop nua', () => {
    expect(dialogSource('', { args: { modal: false } })).toContain('<Dialog :modal="false">');
    expect(dialogSource('', { args: { defaultOpen: true } })).toContain('<Dialog default-open>');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    // `onUpdate:open` é `fn()` no meta: interpolado direto, o corpo do mock
    // apareceria no painel como se fosse o exemplo.
    const saida = dialogSource('', {
      args: { defaultOpen: (() => {}) as never, modal: (() => {}) as never },
    });
    expect(saida).not.toContain('function');
    expect(saida).toContain('  <Dialog>\n');
  });
});

describe('transforms das stories de estado', () => {
  it('só a story cujo assunto é a montagem aberta escreve `default-open`', () => {
    expect(dialogOpenSource()).toContain('<Dialog default-open>');
    // Nas demais a prop é andaime da foto do Chromatic, e ficaria ensinando um
    // diálogo que se abre sozinho ao carregar a página.
    expect(dialogActionDestructiveSource()).not.toContain('default-open');
    expect(dialogNoFooterSource()).not.toContain('default-open');
    expect(dialogConfirmarEmailSource()).not.toContain('default-open');
  });

  it('esconder o X do canto não tira a saída do rodapé', () => {
    const saida = dialogNoButtonCloseSource();
    expect(saida).toContain('<DialogContent :show-close-button="false">');
    // Retirar todas as saídas de uma vez deixaria o diálogo sem fechamento
    // acessível.
    expect(saida).toContain('<DialogClose as-child>');
    expect(saida).toContain('Mais tarde');
  });

  it('o controlado troca o gatilho por um botão comum e liga o par prop+evento', () => {
    const saida = dialogControlledSource();
    expect(saida).toContain(`const aberto = ref(false)`);
    expect(saida).toContain('<Dialog :open="aberto" @update:open="aberto = $event">');
    // Sem gatilho: quem abre é o botão de fora.
    expect(saida).not.toContain('DialogTrigger');
    expect(saida).toContain('<Button @click="aberto = true">Abrir via estado externo</Button>');
  });
});

describe('transforms das stories de variante', () => {
  it('o formulário traz os campos rotulados e a ação primária vira submit', () => {
    const saida = dialogWithFormSource();
    expect(saida).toContain(`import { Label } from '@/components/ui/label'`);
    // `for`/`id` é o que liga rótulo e campo; sem ele o campo chega sem nome.
    expect(saida).toContain('<Label for="dialog-email">E-mail</Label>');
    expect(saida).toContain('<Input id="dialog-email" type="email"');
    expect(saida).toContain('<Button type="submit">Salvar alterações</Button>');
  });

  it('a rolagem é do CORPO, e o corpo chega alcançável por teclado', () => {
    const saida = dialogWithScrollSource();
    // O painel continua sendo o centralizado: trocar por `DialogScrollContent`
    // é a outra rota, em que o cabeçalho sobe junto com o conteúdo.
    expect(saida).toContain('<DialogContent class="nds-max-w-lg">');
    expect(saida).not.toContain('DialogScrollContent');
    expect(saida).toContain('nds-dialog-body-scroll');
    expect(saida).toContain('tabindex="0"');
    expect(saida).toContain('role="group"');
    expect(saida).toContain('aria-label="Termos de serviço"');
    expect(saida).toContain('<p v-for="(clausula, i) in termos" :key="i">{{ clausula }}</p>');
    // Cabeçalho e rodapé continuam DENTRO do painel, parados.
    expect(saida).toContain('    <DialogHeader>');
    expect(saida).toContain('    <DialogFooter>');
  });

  it('a OUTRA rota rola o overlay, e não repete a composição da rolagem de corpo', () => {
    // As duas rotas circularam sob o mesmo nome, e três stacks mostravam uma
    // enquanto duas mostravam a outra. Comparadas em PAR, o que as separa é o
    // painel escolhido e a ausência da região rolável aninhada.
    const rotaB = dialogOverlayScrollSource();
    expect(rotaB).toContain('<DialogScrollContent>');
    expect(rotaB).toContain("  DialogScrollContent,");
    expect(rotaB).not.toContain('nds-dialog-body-scroll');
    expect(rotaB).not.toContain('tabindex="0"');

    // O par: a rota A não usa o painel rolável, e a B não usa o centralizado.
    const rotaA = dialogWithScrollSource();
    expect(rotaA).not.toContain('DialogScrollContent');
    expect(rotaB).not.toContain('<DialogContent');
  });

  it('sem rodapé, as peças do rodapé saem também do import', () => {
    const saida = dialogNoFooterSource();
    expect(saida).not.toContain('DialogFooter');
    expect(saida).not.toContain('DialogClose');
  });

  it('a ação destrutiva se declara por variante, e só ela', () => {
    const saida = dialogActionDestructiveSource();
    expect(saida).toContain('<Button variant="destructive">Remover anexo</Button>');
    // O painel continua sendo um diálogo comum: confirmação irreversível é
    // outro componente.
    expect(saida).not.toContain('alertdialog');
  });

  it('o fechar no rodapé exige as DUAS props, uma apagando e outra repondo', () => {
    const saida = footerDialogCloseSource();
    expect(saida).toContain('<DialogContent :show-close-button="false">');
    expect(saida).toContain('<DialogFooter show-close-button>');
  });
});

describe('transforms das stories de composição', () => {
  it('a confirmação de e-mail mantém a ação primária neutra', () => {
    const saida = dialogConfirmarEmailSource();
    expect(saida).toContain('<Input id="new-email" type="email" placeholder="voce@example.com" />');
    // A operação é reversível: cor de perigo aqui seria alarme falso.
    expect(saida).not.toContain('variant="destructive"');
  });

  it('a edição de perfil rotula os três campos', () => {
    const saida = dialogEditarPerfilSource();
    const rotulos = [...saida.matchAll(/<Label for="([^"]+)">/g)].map((m) => m[1]);
    expect(rotulos).toEqual(['profile-name', 'profile-handle', 'profile-bio']);
  });

  it('a mídia carrega papel e nome próprios, e dispensa o rodapé', () => {
    const saida = dialogPreviaDeMidiaSource();
    // Sem os dois, o conteúdo inteiro do diálogo some para quem usa leitor.
    expect(saida).toContain('role="img"');
    expect(saida).toContain('aria-label="Imagem em destaque"');
    expect(saida).not.toContain('DialogFooter');
    // Nenhum valor de design em `style`: a proporção e a largura são classes.
    expect(saida).not.toContain('style=');
    expect(saida).toContain('nds-aspect-16-9 nds-w-full');
  });
});

// ─── Ordem dos botões no rodapé ───────────────────────────────────────────────
//
// A regra é uma só, e vale para as cinco stacks: no DOM vêm primeiro os
// secundários e POR ÚLTIMO a ação primária. É a ordem de leitura e a de foco, e
// é dela que saem as duas leituras visuais de `.nds-dialog-footer` — primária em
// cima no empilhamento (`column-reverse`) e à direita quando lado a lado (`row`
// + `justify-content: flex-end`). Não há inversão a fazer no CSS: quem erra a
// ordem do DOM erra as duas.
//
// O caso varre TODOS os construtores em vez de escolher alguns: construtor novo
// que nasça com o rodapé invertido reprova sozinho, sem precisar lembrar de
// escrever o caso dele.

/** Miolo do rodapé, ou `null` quando a composição não tem rodapé. */
function footerOf(snippet: string): string | null {
  const block = snippet.match(/<DialogFooter[^>]*>([\s\S]*?)<\/DialogFooter>/);
  return block ? block[1] : null;
}

const BUILDERS: Array<[string, () => string]> = [
  ['dialogSource', () => dialogSource()],
  ['dialogOpenSource', dialogOpenSource],
  ['dialogNoButtonCloseSource', dialogNoButtonCloseSource],
  ['dialogControlledSource', dialogControlledSource],
  ['dialogWithFormSource', dialogWithFormSource],
  ['dialogWithScrollSource', dialogWithScrollSource],
  ['dialogOverlayScrollSource', dialogOverlayScrollSource],
  ['dialogNoFooterSource', dialogNoFooterSource],
  ['dialogActionDestructiveSource', dialogActionDestructiveSource],
  ['footerDialogCloseSource', footerDialogCloseSource],
  ['dialogConfirmarEmailSource', dialogConfirmarEmailSource],
  ['dialogEditarPerfilSource', dialogEditarPerfilSource],
  ['dialogPreviaDeMidiaSource', dialogPreviaDeMidiaSource],
];

/**
 * Exceção declarada: composições que não têm rodapé nenhum.
 *
 * O painel informativo e o de mídia não têm o que confirmar — o X do canto é a
 * saída, e por isso ele não pode ser escondido nessas duas.
 */
const FOOTERLESS = new Set(['dialogNoFooterSource', 'dialogPreviaDeMidiaSource']);

/**
 * Exceção declarada: rodapé cuja saída é emitida pelo COMPONENTE, e não escrita
 * no snippet.
 *
 * `<DialogFooter show-close-button>` põe o botão de fechar ANTES do slot, então
 * o snippet mostra só a ação primária. A premissa é a prop estar ali; o caso
 * abaixo a cobra, para que a exceção não sobreviva ao que a justificava.
 */
const EXIT_FROM_COMPONENT = new Set(['footerDialogCloseSource']);

describe('ordem dos botões no rodapé', () => {
  it.each(BUILDERS)('%s — secundários primeiro, primária por último', (name, build) => {
    const snippet = build();
    const footer = footerOf(snippet);

    if (FOOTERLESS.has(name)) {
      expect(footer).toBeNull();
      return;
    }

    expect(footer).not.toBeNull();

    if (EXIT_FROM_COMPONENT.has(name)) {
      // A premissa da exceção, verificada: é a prop que repõe a saída.
      expect(snippet).toContain('<DialogFooter show-close-button>');
      expect(footer).not.toContain('DialogClose');
      return;
    }

    const exit = footer!.lastIndexOf('</DialogClose>');
    const primary = footer!.lastIndexOf('<Button');
    expect(exit).toBeGreaterThan(-1);
    expect(primary).toBeGreaterThan(exit);
  });

  it('a varredura alcança todo construtor exportado, e as exceções não envelhecem', async () => {
    // Onde a contagem é GERADA a partir de uma lista, quem fica de fora some sem
    // deixar rastro: este caso é o que impede a lista de encolher em silêncio.
    const mod = await import('./dialog.source');
    const exported = Object.entries(mod)
      .filter(([, member]) => typeof member === 'function')
      .map(([key]) => key)
      .sort();
    const swept = BUILDERS.map(([key]) => key).sort();
    expect(swept).toEqual(exported);

    // Exceção que aponta para construtor inexistente é exceção morta.
    for (const key of [...FOOTERLESS, ...EXIT_FROM_COMPONENT]) {
      expect(swept).toContain(key);
    }
  });
});
