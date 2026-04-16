# Edições Parciais - Preservação de Conteúdo

## Regra Obrigatória de Preservação

**QUANDO EDITAR APENAS UMA SEÇÃO DE UM ARQUIVO, TODO O RESTANTE DO CONTEÚDO DEVE SER PRESERVADO INTEGRALMENTE**

Esta regra é **CRÍTICA** para evitar quebras acidentais em outras partes do código não relacionadas à edição solicitada.

---

## Checklist Obrigatório para Edições Parciais

Antes de realizar qualquer edição parcial, você DEVE verificar:

### ✅ 1. Imports no Topo do Arquivo
- [ ] **TODOS** os imports existentes foram preservados?
- [ ] Nenhum import foi removido, mesmo que não apareça na seção editada?
- [ ] Imports de ícones do lucide-react estão completos?
- [ ] Imports de componentes Shadcn/UI estão completos?

**IMPORTANTE**: Mesmo que a seção editada não use determinado import, ele pode ser usado em OUTRAS seções do mesmo arquivo.

### ✅ 2. Estrutura do Componente
- [ ] A declaração do componente foi preservada?
- [ ] Props e interfaces foram mantidas intactas?
- [ ] Exports (default ou named) foram preservados?

### ✅ 3. Conteúdo Não Editado
- [ ] Todas as seções NÃO solicitadas para edição foram preservadas exatamente como estavam?
- [ ] Nenhum código fora da seção editada foi modificado?
- [ ] Espaçamentos e formatação original foram mantidos?

---

## Exemplos de Erros Comuns

### ❌ ERRO: Remoção de Imports ao Editar Seção Específica

**Situação**: Usuário pede para mudar o estilo visual da seção "Notas e Dicas"

**Arquivo Original**:
```tsx
import { GripVertical, Layout, Monitor, Smartphone } from "lucide-react";
import { ComponentDemo } from "../ComponentDemo";
import { Separator } from "../ui/separator";

export function ResizableDocs() {
  return (
    <div>
      {/* Seção 1 - Usa GripVertical, Layout */}
      <ComponentDemo>
        <GripVertical />
        <Layout />
      </ComponentDemo>

      {/* Seção 2 - Notas e Dicas */}
      <div className="bg-muted p-4">
        <p>Dicas importantes...</p>
      </div>

      {/* Seção 3 - Usa Monitor, Smartphone */}
      <div>
        <Monitor />
        <Smartphone />
      </div>
    </div>
  );
}
```

**Edição INCORRETA** (remove imports usados em outras seções):
```tsx
// ❌ ERRO: Removeu imports usados nas seções 1 e 3
import { ComponentDemo } from "../ComponentDemo";
import { CheckCircle2, XCircle } from "lucide-react";

export function ResizableDocs() {
  return (
    <div>
      {/* Seção 1 - QUEBRADA: GripVertical e Layout não importados */}
      <ComponentDemo>
        <GripVertical /> {/* ❌ ERRO */}
        <Layout /> {/* ❌ ERRO */}
      </ComponentDemo>

      {/* Seção 2 - Notas e Dicas - EDITADA CORRETAMENTE */}
      <div className="text-sm text-muted-foreground space-y-4">
        <div className="flex gap-2 items-start">
          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-foreground">Dica importante</p>
            <p>Dicas importantes...</p>
          </div>
        </div>
      </div>

      {/* Seção 3 - QUEBRADA: Monitor e Smartphone não importados */}
      <div>
        <Monitor /> {/* ❌ ERRO */}
        <Smartphone /> {/* ❌ ERRO */}
      </div>
    </div>
  );
}
```

**Edição CORRETA** (preserva todos os imports, adiciona apenas os novos necessários):
```tsx
// ✅ CORRETO: Preservou TODOS os imports originais e adicionou CheckCircle2, XCircle
import { GripVertical, Layout, Monitor, Smartphone, CheckCircle2, XCircle } from "lucide-react";
import { ComponentDemo } from "../ComponentDemo";
import { Separator } from "../ui/separator";

export function ResizableDocs() {
  return (
    <div>
      {/* Seção 1 - Preservada intacta */}
      <ComponentDemo>
        <GripVertical />
        <Layout />
      </ComponentDemo>

      {/* Seção 2 - Notas e Dicas - EDITADA */}
      <div className="text-sm text-muted-foreground space-y-4">
        <div className="flex gap-2 items-start">
          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-foreground">Dica importante</p>
            <p>Dicas importantes...</p>
          </div>
        </div>
      </div>

      {/* Seção 3 - Preservada intacta */}
      <div>
        <Monitor />
        <Smartphone />
      </div>
    </div>
  );
}
```

---

## Workflow Recomendado

Ao receber solicitação de edição parcial:

### Passo 1: Leia o Arquivo Completo
```bash
# Use read tool para ler TODO o arquivo
read({ path: "/components/docs/ComponentDocs.tsx" })
```

### Passo 2: Identifique a Seção Exata
- Localize precisamente onde começa e termina a seção a editar
- Marque mentalmente o que NÃO deve ser alterado

### Passo 3: Use fast_apply_tool Corretamente
```tsx
// Exemplo de uso correto do fast_apply_tool
fast_apply_tool({
  path: "/components/docs/ComponentDocs.tsx",
  change_str: `
// ... existing code ...
{/* Seção Notas e Dicas - INÍCIO DA EDIÇÃO */}
<div className="text-sm text-muted-foreground space-y-4">
  <div className="flex gap-2 items-start">
    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
    <div>
      <p className="text-foreground">Título da Dica</p>
      <p>Novo conteúdo...</p>
    </div>
  </div>
</div>
{/* Seção Notas e Dicas - FIM DA EDIÇÃO */}
// ... existing code ...
  `
})
```

> **Atenção**: ao editar Notas e Dicas, verifique se `CheckCircle2` e `XCircle` já estão importados. Se não estiverem, adicione-os ao import do lucide-react existente sem remover os demais ícones.

### Passo 4: Verifique Imports
- Confirme que TODOS os imports originais foram preservados
- Adicione novos imports apenas se NOVOS componentes forem usados na edição

---

## Regras Específicas por Tipo de Edição

### Edição de Estilo Visual
**Solicitação**: "Mude o estilo da seção X"
- ✅ Modifique apenas classes Tailwind da seção X
- ✅ Preserve toda a estrutura JSX
- ✅ Preserve todos os imports
- ❌ NÃO remova imports não usados na seção X

### Edição de Conteúdo
**Solicitação**: "Mude o texto da seção Y"
- ✅ Modifique apenas o texto dentro da seção Y
- ✅ Preserve estrutura e estilos
- ✅ Preserve todos os imports
- ❌ NÃO altere outras seções

### Adição de Nova Seção
**Solicitação**: "Adicione uma seção Z"
- ✅ Adicione a nova seção no local apropriado
- ✅ Preserve TODAS as seções existentes
- ✅ Preserve todos os imports existentes
- ✅ Adicione novos imports apenas se necessário para a seção Z

---

## Ferramentas e Quando Usar

### fast_apply_tool (PREFERENCIAL)
- Use para edições localizadas
- Permite usar `// ... existing code ...` para preservar contexto
- Mais seguro para edições parciais

```tsx
fast_apply_tool({
  path: "/file.tsx",
  change_str: `
// ... existing code ...
CÓDIGO_EDITADO
// ... existing code ...
  `
})
```

### edit_tool (FALLBACK)
- Use apenas se fast_apply_tool falhar
- Exige maior cuidado com contexto
- Certifique-se de incluir linhas antes/depois suficientes

```tsx
edit_tool({
  path: "/file.tsx",
  old_str: "linha_antes\nCÓDIGO_ANTIGO\nlinha_depois",
  new_str: "linha_antes\nCÓDIGO_NOVO\nlinha_depois"
})
```

### write_tool (NUNCA PARA EDIÇÕES)
- ❌ NUNCA use write_tool para edições parciais
- ✅ Use APENAS para criar novos arquivos
- Se usar write_tool em arquivo existente, você DEVE incluir TODO o conteúdo

---

## Casos Especiais

### Caso 1: Múltiplas Seções com Mesmo Estilo
**Solicitação**: "Atualize o estilo de todas as seções 'Notas e Dicas'"

**Ação Correta**:
- Identifique TODAS as ocorrências
- Edite cada uma mantendo o resto intacto
- Use múltiplas chamadas de fast_apply_tool se necessário

### Caso 2: Seção Próxima a Imports
**Solicitação**: "Edite a seção logo após os imports"

**Ação Correta**:
- Preserve TODOS os imports
- Edite apenas a seção solicitada
- Mantenha espaçamento entre imports e código

### Caso 3: Refatoração "Completa"
**Solicitação**: "Refatore o componente completamente"

**Ação Correta**:
- Isso NÃO é edição parcial
- Pode usar write_tool para reescrever o arquivo
- Mesmo assim, preserve funcionalidade equivalente

---

## Validação Pós-Edição

Após qualquer edição parcial, mentalmente verifique:

1. ✅ Imports: Todos preservados?
2. ✅ Estrutura: Componente ainda funcional?
3. ✅ Seções não editadas: Intactas?
4. ✅ Sintaxe: Sem erros de TypeScript/JSX?
5. ✅ Dependências: Todos os componentes/ícones importados?

---

## Resumo Executivo

### DO ✅
- Preserve TODOS os imports ao editar seções específicas
- Use fast_apply_tool com `// ... existing code ...`
- Leia o arquivo completo antes de editar
- Mantenha seções não solicitadas exatamente como estavam

### DON'T ❌
- Remover imports "não usados" na seção editada
- Modificar código fora da seção solicitada
- Assumir que imports são desnecessários
- Usar write_tool para edições parciais

---

**LEMBRE-SE**: Um import "não usado" na seção editada pode ser CRÍTICO em outra seção do mesmo arquivo!