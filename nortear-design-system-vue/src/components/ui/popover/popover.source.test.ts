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
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button variant="outline">Abrir popover</Button>
    </PopoverTrigger>
    <PopoverContent>
      <PopoverHeader>
        <PopoverTitle>Configuracoes de exibição</PopoverTitle>
        <PopoverDescription>
          Ajuste a aparência do conteúdo da página.
        </PopoverDescription>
      </PopoverHeader>
      <div class="nds-cluster" data-justify="end" data-spacing="sm">
        <Button variant="ghost" size="sm">Cancelar</Button>
        <Button size="sm">Salvar</Button>
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
    const saida = popoverSource('', { args: { defaultOpen: true, modal: true } });
    expect(saida).toContain('<Popover :default-open="true" :modal="true">');
  });

  it('lado e alinhamento moram no PAINEL, e não na raiz', () => {
    const saida = popoverSource('', { args: { side: 'right', align: 'end' } });
    expect(saida).toContain('<PopoverContent side="right" align="end">');
    expect(saida).toContain('<Popover>');
  });

  it('não escreve o padrão: nem o lado de baixo nem o alinhamento central', () => {
    const saida = popoverSource('', {
      args: { defaultOpen: false, modal: false, side: 'bottom', align: 'center' },
    });
    expect(saida).toContain('<Popover>');
    expect(saida).toContain('<PopoverContent>');
    expect(saida).not.toContain('side=');
    expect(saida).not.toContain('align=');
  });

  it('ignora control que não é string nem booleano — o espião vira ruído', () => {
    // `onOpenChange` chega como espião do Storybook; nenhum control pode
    // atravessar para o markup sem passar pela guarda de tipo.
    const saida = popoverSource('', {
      args: {
        defaultOpen: (() => {}) as never,
        modal: (() => {}) as never,
        side: (() => {}) as never,
        align: (() => {}) as never,
      },
    });
    expect(saida).not.toContain('function');
    expect(saida).toContain('<Popover>');
    expect(saida).toContain('<PopoverContent>');
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
    const saida = popoverContentLivreSource();
    expect(saida).not.toContain('PopoverTitle');
    expect(saida).not.toContain('PopoverHeader');
    // Sem título o painel herda o nome do gatilho, então o gatilho precisa
    // nomear a ação: "Ver atalhos", nunca "Mais".
    expect(saida).toContain('<Button variant="outline">Ver atalhos</Button>');
  });

  it('o cabeçalho completo traz título e descrição no lugar do texto solto', () => {
    const saida = popoverWithTitleSource();
    expect(saida).toContain('<PopoverTitle>Configuracoes de exibição</PopoverTitle>');
    expect(saida).toContain('<PopoverDescription>');
    // `aria-labelledby` é DERIVADO do título pelo componente; escrevê-lo à mão
    // ensinaria a duplicar o que a peça já faz.
    expect(saida).not.toContain('aria-labelledby');
  });

  it('o formulário devolve o que o campo recebe — nunca só exibe', () => {
    const saida = popoverFormSource();
    expect(saida).toContain('v-model="nome"');
    expect(saida).toContain('v-model="email"');
    // Valor entrando sem voltar: o campo aceita digitação e perde o digitado no
    // próximo render.
    expect(saida).not.toContain('model-value=');
    expect(saida).toContain(`import { Input } from '@/components/ui/input'`);
  });
});

describe('transforms das stories de estado', () => {
  it('fechado é ausência: nenhuma prop declara o estado', () => {
    const saida = popoverClosedSource();
    expect(saida).toContain('<Popover>');
    expect(saida).not.toContain('default-open');
    expect(saida).not.toContain('open=');
  });

  it('aberto na montagem é presença de `default-open`', () => {
    expect(popoverOpenSource()).toContain('<Popover :default-open="true">');
  });

  it('o painel acima pede lado e folga próprios', () => {
    const saida = popoverAboveSource();
    expect(saida).toContain('<PopoverContent side="top" :side-offset="12">');
    // `align="center"` é o padrão do painel — repeti-lo ensinaria ruído.
    expect(saida).not.toContain('align=');
  });

  it('o controlado entrega o estado a quem consome, com dois botões separados', () => {
    const saida = popoverControlledSource();
    expect(saida).toContain('<Popover v-model:open="aberto">');
    expect(saida).toContain('const aberto = ref(false)');
    // Um alternador FORA do painel dispararia a dispensa por clique-fora antes
    // do próprio clique, e o par fechar+abrir reabriria no mesmo gesto.
    expect(saida).toContain('@click="aberto = true"');
    expect(saida).toContain('@click="aberto = false"');
  });

  it('o modo modal é prop da RAIZ, ao lado da abertura', () => {
    const saida = popoverModalSource();
    expect(saida).toContain('<Popover :default-open="true" :modal="true">');
    // `aria-modal` é contrato de Dialog: um popover é conteúdo AO LADO.
    expect(saida).not.toContain('aria-modal');
  });
});

describe('transforms das stories de composição', () => {
  it('editar perfil fecha com o par de ações, e não com um botão solto', () => {
    const saida = popoverEditarPerfilSource();
    expect(saida).toContain('<Button variant="ghost" size="sm">Cancelar</Button>');
    expect(saida).toContain('<Button type="submit" size="sm">Atualizar</Button>');
    expect(saida).toContain('v-model="nome"');
  });

  it('o filtro é escolha múltipla, com o campo dentro do próprio rótulo', () => {
    const saida = popoverFilterSource();
    expect(saida).toContain('<label v-for="(marcado, nome) in status"');
    expect(saida).toContain('v-model="status[nome]"');
    // Campo dentro do `<label>`: a associação não depende de `for`/`id` casados
    // à mão, que é onde ela costuma quebrar.
    expect(saida).not.toContain('for="status');
  });

  it('cada amostra de cor tem nome próprio, escrita uma a uma', () => {
    const saida = colorPopoverSelectorSource();
    const names = [...saida.matchAll(/aria-label="([^"]+)"/g)].map((m) => m[1]);
    expect(names).toHaveLength(6);
    // A cor não é o nome: repetir o mesmo rótulo equivale a não ter nenhum.
    expect(new Set(names).size).toBe(6);
    // Classe montada por expressão não é auditável — o verificador de classe
    // morta leria a expressão como se fosse o nome da classe.
    expect(saida).not.toContain(':class=');
  });

  it('as preferências são independentes e dividem a linha com o rótulo', () => {
    const saida = popoverPreferenciasSource();
    expect(saida).toContain('data-justify="between"');
    expect(saida).toContain('v-model="preferencias[nome]"');
    // Preferência não se confirma: não há par de ações no pé.
    expect(saida).not.toContain('Aplicar');
    expect(saida).not.toContain('Cancelar');
  });
});

describe('o snippet ensina o design system, não o andaime da story', () => {
  const todas = [
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
    for (const fn of todas) {
      const saida = fn();
      expect(saida).not.toContain('contain: layout');
      expect(saida).not.toContain('min-height');
      expect(saida).not.toContain('Área externa');
      expect(saida).not.toContain('data-testid');
      expect(saida).not.toContain('data-slot');
    }
  });

  it('todo gatilho adota o botão do design system', () => {
    for (const fn of todas) {
      expect(fn()).toContain('<PopoverTrigger as-child>');
      expect(fn()).toContain(`import { Button } from '@/components/ui/button'`);
    }
  });

  it('todas importam do design system, nunca de um caminho interno', () => {
    for (const fn of todas) {
      expect(fn()).toContain(`from '@/components/ui/popover'`);
    }
  });
});
