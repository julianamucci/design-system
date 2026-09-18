import { describe, expect, it } from 'vitest';
import {
  dialogOpenSource,
  dialogActionDestructiveSource,
  dialogWithFormSource,
  dialogWithScrollSource,
  dialogConfirmarEmailSource,
  dialogControlledSource,
  dialogEditarPerfilSource,
  dialogHeadingH3Source,
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
    const output = dialogSource();
    const cancelar = output.indexOf('Cancelar');
    const primaria = output.indexOf('Salvar alterações');
    expect(cancelar).toBeGreaterThan(-1);
    expect(primaria).toBeGreaterThan(cancelar);
  });

  it('modal ligado e fechado na montagem são os padrões, e não entram no snippet', () => {
    const output = dialogSource('', { args: { defaultOpen: false, modal: true } });
    expect(output).toContain('  <Dialog>\n');
    expect(output).not.toContain('modal');
    expect(output).not.toContain('default-open');
  });

  it('desligar a modalidade escreve a negação; abrir na montagem escreve a prop nua', () => {
    expect(dialogSource('', { args: { modal: false } })).toContain('<Dialog :modal="false">');
    expect(dialogSource('', { args: { defaultOpen: true } })).toContain('<Dialog default-open>');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    // `onUpdate:open` é `fn()` no meta: interpolado direto, o corpo do mock
    // apareceria no painel como se fosse o exemplo.
    const output = dialogSource('', {
      args: { defaultOpen: (() => {}) as never, modal: (() => {}) as never },
    });
    expect(output).not.toContain('function');
    expect(output).toContain('  <Dialog>\n');
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
    const output = dialogNoButtonCloseSource();
    expect(output).toContain('<DialogContent :show-close-button="false">');
    // Retirar todas as saídas de uma vez deixaria o diálogo sem fechamento
    // acessível.
    expect(output).toContain('<DialogClose as-child>');
    expect(output).toContain('Mais tarde');
  });

  it('o controlado troca o gatilho por um botão comum e liga o par prop+evento', () => {
    const output = dialogControlledSource();
    expect(output).toContain(`const aberto = ref(false)`);
    expect(output).toContain('<Dialog :open="aberto" @update:open="aberto = $event">');
    // Sem gatilho: quem abre é o botão de fora.
    expect(output).not.toContain('DialogTrigger');
    expect(output).toContain('<Button @click="aberto = true">Abrir via estado externo</Button>');
  });
});

describe('transforms das stories de variante', () => {
  it('o formulário traz os campos rotulados e a ação primária vira submit', () => {
    const output = dialogWithFormSource();
    expect(output).toContain(`import { Label } from '@/components/ui/label'`);
    // `for`/`id` é o que liga rótulo e campo; sem ele o campo chega sem nome.
    expect(output).toContain('<Label for="dialog-email">E-mail</Label>');
    expect(output).toContain('<Input id="dialog-email" type="email"');
    expect(output).toContain('<Button type="submit">Salvar alterações</Button>');
  });

  it('a rolagem é do CORPO, e o corpo chega alcançável por teclado', () => {
    const output = dialogWithScrollSource();
    // Rota única: o painel é o centralizado, e quem rola é o corpo dentro dele.
    expect(output).toContain('<DialogContent class="nds-max-w-lg">');
    expect(output).toContain('nds-dialog-body-scroll');
    expect(output).toContain('tabindex="0"');
    expect(output).toContain('role="group"');
    expect(output).toContain('aria-label="Termos de uso"');
    expect(output).toContain('<p v-for="(clausula, i) in termos" :key="i">{{ clausula }}</p>');
    // Cabeçalho e rodapé continuam DENTRO do painel, parados.
    expect(output).toContain('    <DialogHeader>');
    expect(output).toContain('    <DialogFooter>');
  });

  it('sem rodapé, as peças do rodapé saem também do import', () => {
    const output = dialogNoFooterSource();
    expect(output).not.toContain('DialogFooter');
    expect(output).not.toContain('DialogClose');
  });

  it('a ação destrutiva se declara por variante, e só ela', () => {
    const output = dialogActionDestructiveSource();
    expect(output).toContain('<Button variant="destructive">Remover item</Button>');
    // O painel continua sendo um diálogo comum: confirmação irreversível é
    // outro componente.
    expect(output).not.toContain('alertdialog');
  });

  it('o nível do título é escrito, e é a ÚNICA coisa que difere da forma canônica', () => {
    const output = dialogHeadingH3Source();
    expect(output).toContain('<DialogTitle as="h3">Editar perfil</DialogTitle>');
    // `h2` é o padrão do primitivo: quem não pede nível não escreve prop
    // nenhuma, e o snippet não ensina a repetir o padrão.
    expect(dialogSource()).toContain('<DialogTitle>Editar perfil</DialogTitle>');
    // Tirado o nível, sobra exatamente o snippet canônico — a lição é a tag, e
    // não uma composição nova que o leitor teria de comparar linha a linha.
    expect(output.replace(' as="h3"', '')).toBe(dialogSource());
  });

  it('o fechar sai do canto e volta no rodapé como a ação de MENOR ênfase', () => {
    const output = footerDialogCloseSource();
    expect(output).toContain('<DialogContent :show-close-button="false">');
    // Quem emite o fechar é o próprio rodapé: a prop o coloca ANTES do slot e
    // em `ghost`, a variante da ação terciária. Enquanto ela cravava `outline`,
    // todo call site a contornava com um `DialogClose` escrito à mão.
    expect(output).toContain('<DialogFooter show-close-button>');
    expect(output).not.toContain('DialogClose');
    // Valor padrão não se escreve: `close-label` já vale "Fechar".
    expect(output).not.toContain('close-label');
    // As outras duas ênfases continuam escritas, na ordem do DOM.
    expect(output).toContain('<Button variant="outline">Voltar</Button>');
    expect(output).toContain('<Button>Continuar</Button>');
  });
});

describe('transforms das stories de composição', () => {
  it('a confirmação de e-mail mantém a ação primária neutra', () => {
    const output = dialogConfirmarEmailSource();
    expect(output).toContain('<Input id="new-email" type="email" placeholder="voce@example.com" />');
    // A operação é reversível: cor de perigo aqui seria alarme falso.
    expect(output).not.toContain('variant="destructive"');
  });

  it('a edição de perfil rotula os três campos', () => {
    const output = dialogEditarPerfilSource();
    const rotulos = [...output.matchAll(/<Label for="([^"]+)">/g)].map((m) => m[1]);
    expect(rotulos).toEqual(['profile-name', 'profile-handle', 'profile-bio']);
  });

  it('a mídia carrega papel e nome próprios, e dispensa o rodapé', () => {
    const output = dialogPreviaDeMidiaSource();
    // Sem os dois, o conteúdo inteiro do diálogo some para quem usa leitor.
    expect(output).toContain('role="img"');
    expect(output).toContain('aria-label="Imagem em destaque"');
    expect(output).not.toContain('DialogFooter');
    // Nenhum valor de design em `style`: a proporção e a largura são classes.
    expect(output).not.toContain('style=');
    expect(output).toContain('nds-aspect-16-9 nds-w-full');
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
  ['dialogNoFooterSource', dialogNoFooterSource],
  ['dialogActionDestructiveSource', dialogActionDestructiveSource],
  ['dialogHeadingH3Source', dialogHeadingH3Source],
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
 * Exceção declarada: a saída não é ESCRITA no rodapé, é emitida por ele.
 *
 * `<DialogFooter show-close-button>` já põe o fechar antes do slot, em `ghost`.
 * Não há `</DialogClose>` no miolo para ancorar a busca, então a ancora vira a
 * própria prop — e a regra medida continua sendo a mesma: a primária é o
 * ÚLTIMO `<Button` do rodapé.
 */
const CLOSE_POR_PROP = new Set(['footerDialogCloseSource']);

describe('ordem dos botões no rodapé', () => {
  it.each(BUILDERS)('%s — secundários primeiro, primária por último', (name, build) => {
    const snippet = build();
    const footer = footerOf(snippet);

    if (FOOTERLESS.has(name)) {
      expect(footer).toBeNull();
      return;
    }

    expect(footer).not.toBeNull();

    if (CLOSE_POR_PROP.has(name)) {
      // A premissa da exceção é cobrada: se a prop sair do snippet, o caso
      // reprova em vez de continuar quieto medindo menos.
      expect(snippet).toContain('<DialogFooter show-close-button>');
      expect(footer).not.toContain('DialogClose');
      const secondary = footer!.indexOf('<Button variant="outline">');
      const primary = footer!.lastIndexOf('<Button');
      expect(secondary).toBeGreaterThan(-1);
      expect(primary).toBeGreaterThan(secondary);
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
    for (const key of [...FOOTERLESS, ...CLOSE_POR_PROP]) {
      expect(swept).toContain(key);
    }
  });
});
