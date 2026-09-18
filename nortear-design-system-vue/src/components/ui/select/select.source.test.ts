import { describe, expect, it } from 'vitest';
import {
  selectAgrupadoSource,
  selectBloqueadoSource,
  selectWithIconSource,
  selectWithLabelSource,
  selectWithSeparatorSource,
  selectCompactoSource,
  selectControlledSource,
  formSelectSource,
  selectInvalidoSource,
  selectListPlanaSource,
  selectPreenchidoSource,
  selectSource,
  selectEmptySource,
} from './select.source';

const ALL = [
  selectSource(),
  selectListPlanaSource(),
  selectAgrupadoSource(),
  selectWithIconSource(),
  selectEmptySource(),
  selectPreenchidoSource(),
  selectBloqueadoSource(),
  selectInvalidoSource(),
  selectCompactoSource(),
  selectWithLabelSource(),
  selectControlledSource(),
  formSelectSource(),
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
    const output = selectSource('', { args: { defaultValue: 'rj', name: 'estado' } });
    expect(output).toContain('<Select default-value="rj" name="estado">');
  });

  it('o bloqueio chega à raiz E ao gatilho', () => {
    // A raiz impede a abertura; é o `disabled` NATIVO do gatilho que o tira do
    // percurso do Tab e cancela o clique no navegador.
    const output = selectSource('', { args: { disabled: true } });
    expect(output).toContain('<Select disabled>');
    expect(output).toContain('<SelectTrigger aria-label="Selecionar estado" class="nds-w-xs" disabled>');
  });

  it('não escreve os padrões do componente', () => {
    const output = selectSource('', { args: { defaultValue: '', disabled: false } });
    expect(output).not.toContain('default-value');
    expect(output).not.toContain('disabled');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    // `onUpdate:modelValue` chega como espião; qualquer leitura de arg que caia
    // num handler tem de sair vazia em vez de despejar o corpo do mock.
    const output = selectSource('', {
      args: { name: (() => {}) as never, defaultValue: (() => {}) as never },
    });
    expect(output).not.toContain('function');
    expect(output).not.toContain('name=');
    expect(output).not.toContain('default-value');
  });

  // O `:key="String(args.defaultValue)"` e o `<div style="contain: layout">`
  // existem para o canvas do Storybook, não para quem consome.
  it('não leva o enquadramento da story', () => {
    for (const output of ALL) {
      expect(output).not.toContain(':key="String');
      expect(output).not.toContain('contain: layout');
      expect(output).not.toContain('min-height');
      expect(output).not.toContain('style=');
    }
  });

  it('o campo sempre se nomeia — combobox não tira nome do próprio conteúdo', () => {
    for (const output of ALL) {
      expect(output).toMatch(/<SelectTrigger[^>]*aria-(label|labelledby)=/);
    }
  });

  it('o gatilho recebe largura — ele nasce com fit-content e sanfonaria', () => {
    for (const output of ALL) {
      expect(output).toMatch(/<SelectTrigger[^>]*class="nds-w-(xs|full)"/);
    }
  });

  it('portal, listbox e teclado vêm do componente e não se escrevem', () => {
    const output = selectSource();
    expect(output).not.toContain('role="listbox"');
    expect(output).not.toContain('SelectPortal');
    expect(output).not.toContain('SelectViewport');
  });
});

describe('transforms das stories de variante', () => {
  it('a lista plana não tem grupo nem cabeçalho', () => {
    const output = selectListPlanaSource();
    expect(output).not.toContain('SelectGroup');
    expect(output).not.toContain('SelectLabel');
    expect([...output.matchAll(/<SelectItem /g)]).toHaveLength(4);
  });

  it('a agrupada importa grupo e cabeçalho, e nomeia cada categoria', () => {
    const output = selectAgrupadoSource();
    expect(output).toContain('  SelectGroup,');
    expect(output).toContain('  SelectLabel,');
    expect(output).toContain('<SelectLabel>Sudeste</SelectLabel>');
    expect(output).toContain('<SelectLabel>Sul</SelectLabel>');
    expect([...output.matchAll(/<SelectGroup>/g)]).toHaveLength(2);
  });

  it('o ícone da opção é decorativo e não ecoa no nome acessível', () => {
    const output = selectWithIconSource();
    expect(output).toContain(`import { Globe } from 'lucide-vue-next'`);
    expect(output).toContain('<Globe class="nds-size-4" aria-hidden="true" />');
    expect(output).toContain('<span>Português (BR)</span>');
  });
});

describe('transforms das stories de estado', () => {
  it('o vazio não declara valor nenhum', () => {
    expect(selectEmptySource()).toContain('<Select>');
  });

  it('o preenchido resolve o rótulo antes da primeira abertura', () => {
    const output = selectPreenchidoSource();
    expect(output).toContain('<Select default-value="rj">');
    // Os rótulos só existem com a lista montada, e ela desmonta ao fechar: sem
    // o slot, o campo mostraria o valor cru.
    expect(output).toContain('<template #default="{ modelValue }">');
    expect(output).toContain('const rotulos = Object.fromEntries(');
  });

  it('o inválido marca o gatilho e traz o aviso em texto', () => {
    const output = selectInvalidoSource();
    expect(output).toContain('aria-invalid="true"');
    expect(output).toContain('<p class="nds-text-body nds-text-destructive">');
    // A folha é que pinta a borda de perigo — o snippet não pinta nada.
    expect(output).not.toContain('nds-border-destructive');
  });

  it('o compacto compara os dois tamanhos, e a densidade mora no gatilho', () => {
    const output = selectCompactoSource();
    expect([...output.matchAll(/<Select>/g)]).toHaveLength(2);
    expect(output).toContain('<SelectTrigger aria-label="Selecionar cidade" size="sm"');
    // O padrão não se escreve: só o campo compacto declara o tamanho.
    expect([...output.matchAll(/size="/g)]).toHaveLength(1);
  });
});

describe('transforms das stories de composição', () => {
  it('o rótulo externo fecha o par nos dois sentidos', () => {
    const output = selectWithLabelSource();
    expect(output).toContain('<Label id="estado-rotulo" for="estado">Estado</Label>');
    expect(output).toContain('id="estado"');
    expect(output).toContain('aria-labelledby="estado-rotulo"');
  });

  it('o controlado declara a metade que entra e a que sai', () => {
    const output = selectControlledSource();
    expect(output).toContain(`import { ref } from 'vue'`);
    expect(output).toContain(`const estado = ref('')`);
    expect(output).toContain(':model-value="estado"');
    expect(output).toContain('@update:model-value="(valor) => (estado = valor)"');
  });

  it('no formulário o nome mora na raiz — é ele que leva o valor no envio', () => {
    const output = formSelectSource();
    expect(output).toContain('<Select name="estado">');
    expect(output).toContain('@submit.prevent');
    expect(output).toContain('<Button type="submit">Enviar</Button>');
  });

  it('o separador entra entre grupos, e não dentro de um', () => {
    const output = selectWithSeparatorSource();
    expect(output).toContain('</SelectGroup>\n      <SelectSeparator />\n      <SelectGroup>');
    expect(output).toContain('  SelectSeparator,');
  });
});

describe('o andaime das stories não entra no snippet', () => {
  it('nenhuma transform cita a sonda nem os utilitários de portal', () => {
    for (const output of ALL) {
      expect(output).not.toContain('select-probe');
      expect(output).not.toContain('ESTADOS_POR_VALOR');
      expect(output).not.toContain('waitForPortal');
      expect(output).not.toContain('sharedComponents');
    }
  });
});
