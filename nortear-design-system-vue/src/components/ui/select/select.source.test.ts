import { describe, expect, it } from 'vitest';
import {
  selectAgrupadoSource,
  selectBloqueadoSource,
  selectComIconeSource,
  selectComRotuloSource,
  selectWithSeparatorSource,
  selectCompactoSource,
  selectControladoSource,
  selectEmFormularioSource,
  selectInvalidoSource,
  selectListaPlanaSource,
  selectPreenchidoSource,
  selectSource,
  selectEmptySource,
} from './select.source';

const TODAS = [
  selectSource(),
  selectListaPlanaSource(),
  selectAgrupadoSource(),
  selectComIconeSource(),
  selectEmptySource(),
  selectPreenchidoSource(),
  selectBloqueadoSource(),
  selectInvalidoSource(),
  selectCompactoSource(),
  selectComRotuloSource(),
  selectControladoSource(),
  selectEmFormularioSource(),
  selectWithSeparatorSource(),
];

describe('selectSource', () => {
  it('sem args, entrega a forma canônica do campo fechado', () => {
    expect(selectSource()).toBe(
      `<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const estados = [
  { value: 'sp', label: 'São Paulo' },
  { value: 'rj', label: 'Rio de Janeiro' },
  { value: 'mg', label: 'Minas Gerais' },
]
</script>

<template>
  <Select>
    <SelectTrigger aria-label="Selecionar estado" class="nds-w-xs">
      <SelectValue placeholder="Selecione..." />
    </SelectTrigger>
    <SelectContent>
      <SelectItem v-for="estado in estados" :key="estado.value" :value="estado.value">
        {{ estado.label }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>`,
    );
  });

  it('os controls da raiz viram atributos da raiz', () => {
    const saida = selectSource('', { args: { defaultValue: 'rj', name: 'estado' } });
    expect(saida).toContain('<Select default-value="rj" name="estado">');
  });

  it('o bloqueio chega à raiz E ao gatilho', () => {
    // A raiz impede a abertura; é o `disabled` NATIVO do gatilho que o tira do
    // percurso do Tab e cancela o clique no navegador.
    const saida = selectSource('', { args: { disabled: true } });
    expect(saida).toContain('<Select disabled>');
    expect(saida).toContain('<SelectTrigger aria-label="Selecionar estado" class="nds-w-xs" disabled>');
  });

  it('não escreve os padrões do componente', () => {
    const saida = selectSource('', { args: { defaultValue: '', disabled: false } });
    expect(saida).not.toContain('default-value');
    expect(saida).not.toContain('disabled');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    // `onUpdate:modelValue` chega como espião; qualquer leitura de arg que caia
    // num handler tem de sair vazia em vez de despejar o corpo do mock.
    const saida = selectSource('', {
      args: { name: (() => {}) as never, defaultValue: (() => {}) as never },
    });
    expect(saida).not.toContain('function');
    expect(saida).not.toContain('name=');
    expect(saida).not.toContain('default-value');
  });

  // O `:key="String(args.defaultValue)"` e o `<div style="contain: layout">`
  // existem para o canvas do Storybook, não para quem consome.
  it('não leva o enquadramento da story', () => {
    for (const saida of TODAS) {
      expect(saida).not.toContain(':key="String');
      expect(saida).not.toContain('contain: layout');
      expect(saida).not.toContain('min-height');
      expect(saida).not.toContain('style=');
    }
  });

  it('o campo sempre se nomeia — combobox não tira nome do próprio conteúdo', () => {
    for (const saida of TODAS) {
      expect(saida).toMatch(/<SelectTrigger[^>]*aria-(label|labelledby)=/);
    }
  });

  it('o gatilho recebe largura — ele nasce com fit-content e sanfonaria', () => {
    for (const saida of TODAS) {
      expect(saida).toMatch(/<SelectTrigger[^>]*class="nds-w-(xs|full)"/);
    }
  });

  it('portal, listbox e teclado vêm do componente e não se escrevem', () => {
    const saida = selectSource();
    expect(saida).not.toContain('role="listbox"');
    expect(saida).not.toContain('SelectPortal');
    expect(saida).not.toContain('SelectViewport');
  });
});

describe('transforms das stories de variante', () => {
  it('a lista plana não tem grupo nem cabeçalho', () => {
    const saida = selectListaPlanaSource();
    expect(saida).not.toContain('SelectGroup');
    expect(saida).not.toContain('SelectLabel');
    expect([...saida.matchAll(/<SelectItem /g)]).toHaveLength(4);
  });

  it('a agrupada importa grupo e cabeçalho, e nomeia cada categoria', () => {
    const saida = selectAgrupadoSource();
    expect(saida).toContain('  SelectGroup,');
    expect(saida).toContain('  SelectLabel,');
    expect(saida).toContain('<SelectLabel>Sudeste</SelectLabel>');
    expect(saida).toContain('<SelectLabel>Sul</SelectLabel>');
    expect([...saida.matchAll(/<SelectGroup>/g)]).toHaveLength(2);
  });

  it('o ícone da opção é decorativo e não ecoa no nome acessível', () => {
    const saida = selectComIconeSource();
    expect(saida).toContain(`import { Globe } from 'lucide-vue-next'`);
    expect(saida).toContain('<Globe class="nds-size-4" aria-hidden="true" />');
    expect(saida).toContain('<span>Português (BR)</span>');
  });
});

describe('transforms das stories de estado', () => {
  it('o vazio não declara valor nenhum', () => {
    expect(selectEmptySource()).toContain('<Select>');
  });

  it('o preenchido resolve o rótulo antes da primeira abertura', () => {
    const saida = selectPreenchidoSource();
    expect(saida).toContain('<Select default-value="rj">');
    // Os rótulos só existem com a lista montada, e ela desmonta ao fechar: sem
    // o slot, o campo mostraria o valor cru.
    expect(saida).toContain('<template #default="{ modelValue }">');
    expect(saida).toContain('const rotulos = Object.fromEntries(');
  });

  it('o inválido marca o gatilho e traz o aviso em texto', () => {
    const saida = selectInvalidoSource();
    expect(saida).toContain('aria-invalid="true"');
    expect(saida).toContain('<p class="nds-text-body nds-text-destructive">');
    // A folha é que pinta a borda de perigo — o snippet não pinta nada.
    expect(saida).not.toContain('nds-border-destructive');
  });

  it('o compacto compara os dois tamanhos, e a densidade mora no gatilho', () => {
    const saida = selectCompactoSource();
    expect([...saida.matchAll(/<Select>/g)]).toHaveLength(2);
    expect(saida).toContain('<SelectTrigger aria-label="Selecionar cidade" size="sm"');
    // O padrão não se escreve: só o campo compacto declara o tamanho.
    expect([...saida.matchAll(/size="/g)]).toHaveLength(1);
  });
});

describe('transforms das stories de composição', () => {
  it('o rótulo externo fecha o par nos dois sentidos', () => {
    const saida = selectComRotuloSource();
    expect(saida).toContain('<Label id="estado-rotulo" for="estado">Estado</Label>');
    expect(saida).toContain('id="estado"');
    expect(saida).toContain('aria-labelledby="estado-rotulo"');
  });

  it('o controlado declara a metade que entra e a que sai', () => {
    const saida = selectControladoSource();
    expect(saida).toContain(`import { ref } from 'vue'`);
    expect(saida).toContain(`const estado = ref('')`);
    expect(saida).toContain(':model-value="estado"');
    expect(saida).toContain('@update:model-value="(valor) => (estado = valor)"');
  });

  it('no formulário o nome mora na raiz — é ele que leva o valor no envio', () => {
    const saida = selectEmFormularioSource();
    expect(saida).toContain('<Select name="estado">');
    expect(saida).toContain('@submit.prevent');
    expect(saida).toContain('<Button type="submit">Enviar</Button>');
  });

  it('o separador entra entre grupos, e não dentro de um', () => {
    const saida = selectWithSeparatorSource();
    expect(saida).toContain('</SelectGroup>\n      <SelectSeparator />\n      <SelectGroup>');
    expect(saida).toContain('  SelectSeparator,');
  });
});

describe('o andaime das stories não entra no snippet', () => {
  it('nenhuma transform cita a sonda nem os utilitários de portal', () => {
    for (const saida of TODAS) {
      expect(saida).not.toContain('select-probe');
      expect(saida).not.toContain('ESTADOS_POR_VALOR');
      expect(saida).not.toContain('waitForPortal');
      expect(saida).not.toContain('sharedComponents');
    }
  });
});
