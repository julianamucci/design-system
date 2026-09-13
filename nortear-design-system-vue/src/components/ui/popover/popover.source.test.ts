import { describe, expect, it } from 'vitest';
import {
  popoverOpenSource,
  popoverAboveSource,
  popoverWithTitleSource,
  popoverContentLivreSource,
  popoverControlledSource,
  popoverEditarPerfilSource,
  popoverClosedSource,
  popoverFilterSource,
  popoverFormSource,
  popoverModalSource,
  popoverPreferenciasSource,
  colorPopoverSelectorSource,
  popoverSource,
} from './popover.source';

describe('popoverSource', () => {
  it('sem args, entrega o gatilho e o painel com título, descrição e ações', () => {
    expect(popoverSource()).toBe(
      `<script setup lang="ts">
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
</script>

<template>
  <Popover v-slot="{ close }">
    <PopoverTrigger as-child>
      <Button variant="outline">Abrir popover</Button>
    </PopoverTrigger>
    <PopoverContent>
      <PopoverHeader>
        <PopoverTitle>Configurações de exibição</PopoverTitle>
        <PopoverDescription>
          Ajuste a aparência do conteúdo da página.
        </PopoverDescription>
      </PopoverHeader>
      <div class="nds-cluster" data-justify="end" data-spacing="sm">
        <PopoverClose as-child>
          <Button variant="ghost" size="sm">Cancelar</Button>
        </PopoverClose>
        <!-- Confirmar fecha por CÓDIGO, depois de salvar: o motivo do
             fechamento é api, e não close-button -->
        <Button size="sm" @click="close()">Salvar</Button>
      </div>
    </PopoverContent>
  </Popover>
</template>`,
    );
  });

  it('o booleano sai como LIGAÇÃO, nunca como atributo pelado', () => {
    // Atributo pelado só vira `true` se a inferência de tipo do SFC tiver
    // marcado a prop como Boolean; quando ela não marca, o que chega é a string
    // vazia — que é FALSA, e o popover nasceria fechado.
    const output = popoverSource('', { args: { defaultOpen: true, modal: true } });
    expect(output).toContain('<Popover :default-open="true" :modal="true" v-slot="{ close }">');
  });

  it('lado e alinhamento moram no PAINEL, e não na raiz', () => {
    const output = popoverSource('', { args: { side: 'right', align: 'end' } });
    expect(output).toContain('<PopoverContent side="right" align="end">');
    expect(output).toContain('<Popover v-slot="{ close }">');
  });

  it('não escreve o padrão: nem o lado de baixo nem o alinhamento central', () => {
    const output = popoverSource('', {
      args: { defaultOpen: false, modal: false, side: 'bottom', align: 'center' },
    });
    expect(output).toContain('<Popover v-slot="{ close }">');
    expect(output).toContain('<PopoverContent>');
    expect(output).not.toContain('side=');
    expect(output).not.toContain('align=');
  });

  it('ignora control que não é string nem booleano — o espião vira ruído', () => {
    // `onOpenChange` chega como espião do Storybook; nenhum control pode
    // atravessar para o markup sem passar pela guarda de tipo.
    const output = popoverSource('', {
      args: {
        defaultOpen: (() => {}) as never,
        modal: (() => {}) as never,
        side: (() => {}) as never,
        align: (() => {}) as never,
      },
    });
    expect(output).not.toContain('function');
    expect(output).toContain('<Popover v-slot="{ close }">');
    expect(output).toContain('<PopoverContent>');
  });

  it('o gatilho ADOTA o botão em vez de embrulhá-lo', () => {
    // Dois botões aninhados são markup inválido, e o de fora roubaria o clique.
    expect(popoverSource()).toContain(
      '<PopoverTrigger as-child>\n      <Button variant="outline">',
    );
  });
});

describe('transforms das stories de variante', () => {
  it('o conteúdo livre não tem título — e a ausência é o assunto', () => {
    const output = popoverContentLivreSource();
    expect(output).not.toContain('PopoverTitle');
    expect(output).not.toContain('PopoverHeader');
    // Sem título, o painel DECLARA o próprio nome: o snippet que a página
    // ensina não pode deixá-lo cair na herança do rótulo do gatilho.
    expect(output).toContain('<PopoverContent aria-label="Informações adicionais">');
    expect(output).toContain('<Button variant="outline">Ver atalhos</Button>');
  });

  it('o cabeçalho completo traz título e descrição no lugar do texto solto', () => {
    const output = popoverWithTitleSource();
    expect(output).toContain('<PopoverTitle>Configurações de exibição</PopoverTitle>');
    expect(output).toContain('<PopoverDescription>');
    // `aria-labelledby` é DERIVADO do título pelo componente; escrevê-lo à mão
    // ensinaria a duplicar o que a peça já faz.
    expect(output).not.toContain('aria-labelledby');
  });

  it('o formulário devolve o que o campo recebe — nunca só exibe', () => {
    const output = popoverFormSource();
    expect(output).toContain('v-model="nome"');
    expect(output).toContain('v-model="email"');
    // Valor entrando sem voltar: o campo aceita digitação e perde o digitado no
    // próximo render.
    expect(output).not.toContain('model-value=');
    expect(output).toContain(`import { Input } from '@/components/ui/input'`);
  });
});

describe('transforms das stories de estado', () => {
  it('fechado é ausência: nenhuma prop declara o estado', () => {
    const output = popoverClosedSource();
    expect(output).toContain('<Popover v-slot="{ close }">');
    expect(output).not.toContain('default-open');
    expect(output).not.toContain('open=');
  });

  it('aberto na montagem é presença de `default-open`', () => {
    expect(popoverOpenSource()).toContain('<Popover :default-open="true" v-slot="{ close }">');
  });

  it('o painel acima pede lado e folga próprios', () => {
    const output = popoverAboveSource();
    expect(output).toContain('<PopoverContent side="top" :side-offset="12">');
    // `align="center"` é o padrão do painel — repeti-lo ensinaria ruído.
    expect(output).not.toContain('align=');
  });

  it('o controlado entrega o estado a quem consome, com dois botões separados', () => {
    const output = popoverControlledSource();
    expect(output).toContain('<Popover v-slot="{ close }" v-model:open="aberto">');
    expect(output).toContain('const aberto = ref(false)');
    // Um alternador FORA do painel dispararia a dispensa por clique-fora antes
    // do próprio clique, e o par fechar+abrir reabriria no mesmo gesto.
    expect(output).toContain('@click="aberto = true"');
    expect(output).toContain('@click="aberto = false"');
  });

  it('o modo modal é prop da RAIZ, ao lado da abertura', () => {
    const output = popoverModalSource();
    expect(output).toContain('<Popover :default-open="true" :modal="true" v-slot="{ close }">');
    // `aria-modal` é contrato de Dialog: um popover é conteúdo AO LADO.
    expect(output).not.toContain('aria-modal');
  });
});

describe('transforms das stories de composição', () => {
  it('editar perfil fecha com o par de ações, e não com um botão solto', () => {
    const output = popoverEditarPerfilSource();
    expect(output).toContain('<Button variant="ghost" size="sm">Cancelar</Button>');
    expect(output).toContain('<Button type="submit" size="sm">Atualizar</Button>');
    expect(output).toContain('v-model="nome"');
  });

  it('o Cancelar do rodapé é o PopoverClose, e não um botão decorativo', () => {
    // O defeito de 2026-09-12: o rodapé ensinava um Cancelar que não fechava
    // nada. Quem copia o snippet copia o defeito, então a guarda é aqui.
    for (const fn of [popoverSource, popoverWithTitleSource, popoverEditarPerfilSource]) {
      const output = fn();
      expect(output).toContain('<PopoverClose as-child>');
      // `as-child` não é detalhe: sem ele o botão do design system fica dentro
      // de outro botão, e o de fora rouba o clique.
      expect(output).not.toMatch(/<PopoverClose>/);
      // E a peça tem de estar no import, senão o snippet não compila.
      expect(output).toContain('  PopoverClose,\n');
    }
  });

  it('a confirmação fecha por CÓDIGO, e nunca pela peça de fechar', () => {
    // A regra de 2026-09-13: Cancelar sai por `PopoverClose` (motivo
    // `close-button`) e Salvar/Aplicar saem por código depois de salvar
    // (motivo `api`). Empacotar a confirmação no `PopoverClose` — o defeito que
    // o react e o angular tinham — faria "concluiu" e "desistiu" chegarem ao
    // GA4 como o mesmo evento.
    const pares: Array<[() => string, string]> = [
      [popoverSource, 'Salvar'],
      [popoverWithTitleSource, 'Salvar'],
      [popoverClosedSource, 'Salvar'],
      [popoverOpenSource, 'Salvar'],
      [popoverModalSource, 'Salvar'],
      [popoverControlledSource, 'Salvar'],
      [popoverFilterSource, 'Aplicar'],
    ];
    for (const [fn, label] of pares) {
      const output = fn();
      expect(output).toContain(`<Button size="sm" @click="close()">${label}</Button>`);
      // O `close` é publicado pela RAIZ: sem declará-lo ali, o snippet copiado
      // não compila.
      expect(output).toContain('v-slot="{ close }"');
      // E a confirmação não pode estar dentro da peça de fechar.
      expect(output).not.toMatch(
        new RegExp(`<PopoverClose[^>]*>\\s*<Button[^>]*>${label}<`),
      );
    }
  });

  it('no formulário, quem fecha é o SUBMIT — nunca o clique do botão', () => {
    // Mesma regra, pelo caminho do formulário: "Atualizar" é `type="submit"`, e
    // o fechamento pendura no `@submit` porque fechar no `@click` desmontaria o
    // formulário antes de ele submeter — e porque só o caminho do `submit`
    // cobre o Enter num campo, que é como metade das pessoas envia formulário.
    for (const fn of [popoverFormSource, popoverEditarPerfilSource]) {
      const output = fn();
      expect(output).toContain('@submit.prevent="salvar(); close()"');
      // Formulário que só barra o envio e não fecha nada é o defeito corrigido
      // em 2026-09-13: a régua tem de recusar o `@submit.prevent` pelado.
      expect(output).not.toMatch(/@submit\.prevent\s*[>\n]/);
      // A função existe no `<script setup>`: snippet que chama o que não foi
      // declarado não compila para quem copia.
      expect(output).toContain('function salvar() {');
      // O `close` continua vindo da RAIZ, e o helper o deriva sozinho.
      expect(output).toContain('v-slot="{ close }"');
      // E o botão de confirmar não ganha caminho próprio: nem `@click`, nem a
      // peça de fechar em volta.
      expect(output).toContain('<Button type="submit" size="sm">Atualizar</Button>');
      expect(output).not.toMatch(/<Button[^>]*type="submit"[^>]*@click/);
      expect(output).not.toMatch(/<PopoverClose[^>]*>\s*<Button[^>]*>Atualizar</);
    }
  });

  it('quem não tem rodapé de ações não importa a peça de fechar', () => {
    // O import que não se usa é ruído que o leitor copia junto.
    for (const fn of [popoverAboveSource, popoverFormSource, popoverContentLivreSource]) {
      expect(fn()).not.toContain('PopoverClose');
    }
  });

  it('o filtro é escolha múltipla, com o campo dentro do próprio rótulo', () => {
    const output = popoverFilterSource();
    expect(output).toContain('<label v-for="(marcado, nome) in status"');
    expect(output).toContain('v-model="status[nome]"');
    // Campo dentro do `<label>`: a associação não depende de `for`/`id` casados
    // à mão, que é onde ela costuma quebrar.
    expect(output).not.toContain('for="status');
  });

  it('cada amostra de cor tem nome próprio, escrita uma a uma', () => {
    const output = colorPopoverSelectorSource();
    const names = [...output.matchAll(/aria-label="([^"]+)"/g)].map((m) => m[1]);
    expect(names).toHaveLength(6);
    // A cor não é o nome: repetir o mesmo rótulo equivale a não ter nenhum.
    expect(new Set(names).size).toBe(6);
    // Classe montada por expressão não é auditável — o verificador de classe
    // morta leria a expressão como se fosse o nome da classe.
    expect(output).not.toContain(':class=');
  });

  it('as preferências são independentes e dividem a linha com o rótulo', () => {
    const output = popoverPreferenciasSource();
    expect(output).toContain('data-justify="between"');
    expect(output).toContain('v-model="preferencias[nome]"');
    // Preferência não se confirma: não há par de ações no pé.
    expect(output).not.toContain('Aplicar');
    expect(output).not.toContain('Cancelar');
  });
});

describe('o snippet ensina o design system, não o andaime da story', () => {
  const all = [
    popoverSource,
    popoverContentLivreSource,
    popoverWithTitleSource,
    popoverFormSource,
    popoverClosedSource,
    popoverOpenSource,
    popoverAboveSource,
    popoverControlledSource,
    popoverModalSource,
    popoverEditarPerfilSource,
    popoverFilterSource,
    colorPopoverSelectorSource,
    popoverPreferenciasSource,
  ];

  it('nenhuma traz a moldura de contenção, o alvo inerte nem a sonda de markup', () => {
    for (const fn of all) {
      const output = fn();
      expect(output).not.toContain('contain: layout');
      expect(output).not.toContain('min-height');
      expect(output).not.toContain('Área externa');
      expect(output).not.toContain('data-testid');
      expect(output).not.toContain('data-slot');
    }
  });

  it('todo gatilho adota o botão do design system', () => {
    for (const fn of all) {
      expect(fn()).toContain('<PopoverTrigger as-child>');
      expect(fn()).toContain(`import { Button } from '@/components/ui/button'`);
    }
  });

  it('todas importam do design system, nunca de um caminho interno', () => {
    for (const fn of all) {
      expect(fn()).toContain(`from '@/components/ui/popover'`);
    }
  });
});
