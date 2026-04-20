# Form Components

---

## Button

**Propósito**: elemento de ação primária — dispara submissões, confirmações, navegações e qualquer ação do usuário.

**Variantes obrigatórias**: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`

**Tamanhos**: `default`, `sm`, `lg`, `icon` — usar sempre `default`, salvo instrução específica

**Implementação**:
```tsx
{/* Botão simples */}
<Button variant="default" onClick={handleSave}>
  Salvar
</Button>

{/* Botão de submit dentro de Form */}
<Button type="submit" disabled={form.formState.isSubmitting}>
  {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
</Button>

{/* Botão icon-only — aria-label obrigatório */}
<Button size="icon" aria-label="Excluir produto Cadeira Gamer Pro">
  <Trash2 className="h-4 w-4" aria-hidden="true" />
</Button>

{/* Botão com ícone e texto — ícone decorativo */}
<Button variant="outline">
  <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
  Adicionar item
</Button>
```

**Regras**:
- Máximo 1 botão `default` (primário) por seção
- Ícones apenas quando essenciais ao contexto — não decorativos por padrão
- Estilo personalizado via classe `.btn` do tema
- Alinhamento: primário sempre à direita — ver `16-padroes-design-sistema.md` → "Alinhamento de Grupos de Botões"

**Acessibilidade** (ver `11-acessibilidade.md`):
- `aria-label` **contextual** em botões ambíguos — descreve a ação **e o objeto**, nunca apenas a ação
- Ícones dentro do botão: sempre `aria-hidden="true"` — o label do botão já descreve a ação
- Botão icon-only: `aria-label` obrigatório com verbo + objeto + identificador

```tsx
{/* ✅ aria-label contextual */}
<Button aria-label="Excluir produto Cadeira Gamer Pro">Excluir</Button>
<Button aria-label="Editar endereço de entrega">Editar</Button>

{/* ❌ aria-label repetindo o label visível — não acrescenta contexto */}
<Button aria-label="Excluir">Excluir</Button>
```

**UX Writing** (ver `19-tom-de-voz.md`):
- Verbos no infinitivo, máximo 3 palavras, sem pontuação
- Correto: "Salvar", "Criar conta", "Excluir item"
- Incorreto: "Clique aqui", "OK", "Sim", "Enviar formulário de cadastro"

**Analytics** (ver `21-analytics.md`):
```tsx
<Button
  onClick={() => {
    track("button_click", {
      component: "button",
      variant: "default",
      location: "checkout_form",
      label: "Finalizar compra"
    });
    handleCheckout();
  }}
>
  Finalizar compra
</Button>
```

> `data-track-label` deve ser idêntico ao `aria-label` ou ao texto visível. Não rastrear cliques em botões `disabled`.

---

## Calendar

**Propósito**: seletor visual de datas com navegação por mês.

> **Versão**: o Shadcn/UI usa `react-day-picker v9`. A API mudou em relação a versões anteriores — verificar a versão instalada antes de implementar.

**Implementação**:
```tsx
import { ptBR } from "react-day-picker/locale";

{/* Modo single — padrão obrigatório do projeto */}
const [date, setDate] = useState<Date | undefined>();

<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  locale={ptBR}
  className="rounded-md border border-border"
/>

{/* Com datas desabilitadas */}
<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  locale={ptBR}
  disabled={[
    { before: new Date() },        // Bloqueia datas passadas
    new Date(2025, 11, 25),        // Bloqueia data específica
  ]}
/>

{/* Modo range — apenas com instrução específica */}
<Calendar
  mode="range"
  selected={range}
  onSelect={setRange}
  locale={ptBR}
  numberOfMonths={2}
/>
```

**Regras**:
- Modo `single` obrigatório por padrão — usar `range` apenas com instrução específica
- `locale={ptBR}` **obrigatório** — sem ele o calendário exibe em inglês (meses, dias da semana, navegação)
- A prop `disabled` aceita: `Date`, `Date[]`, `{ before, after }`, `{ from, to }` ou `(date: Date) => boolean`

**Integração com FormField**:
```tsx
<FormField
  control={form.control}
  name="dataNascimento"
  render={({ field }) => (
    <FormItem className="flex flex-col">
      <FormLabel>Data de nascimento</FormLabel>
      <FormControl>
        <Calendar
          mode="single"
          selected={field.value}
          onSelect={field.onChange}
          locale={ptBR}
          disabled={{ after: new Date() }}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Acessibilidade**: navegação por teclado gerenciada nativamente pelo `react-day-picker` — Arrow keys para dias, Page Up/Down para meses, Home/End para início/fim do mês.

---

## DatePicker

**Propósito**: seleção de data via campo de texto com calendar popover — padrão composto de `Calendar + Popover + Button`.

**Implementação**:
```tsx
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ptBR as calendarPtBR } from "react-day-picker/locale"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const [date, setDate] = useState<Date | undefined>()

<Popover>
  <PopoverTrigger asChild>
    <Button
      variant="outline"
      aria-label={date ? `Data selecionada: ${format(date, "PPP", { locale: ptBR })}` : "Selecionar data"}
      className={cn(
        "w-[240px] justify-start text-left font-normal",
        !date && "text-muted-foreground"
      )}
    >
      <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
      {date ? format(date, "PPP", { locale: ptBR }) : "Selecione uma data..."}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0" align="start">
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      locale={calendarPtBR}
      initialFocus
    />
  </PopoverContent>
</Popover>
```

**Integração com FormField**:
```tsx
<FormField
  control={form.control}
  name="dataNascimento"
  render={({ field }) => (
    <FormItem className="flex flex-col">
      <FormLabel>Data de nascimento</FormLabel>
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !field.value && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
              {field.value
                ? format(field.value, "PPP", { locale: ptBR })
                : "Selecione uma data..."}
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={field.value}
            onSelect={field.onChange}
            locale={calendarPtBR}
            disabled={{ after: new Date() }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Regras**:
- `initialFocus` no `Calendar` — move o foco para o calendário ao abrir o Popover
- `format` de `date-fns` para exibir a data no botão — locale `ptBR` de `date-fns/locale`
- `locale` do `Calendar` vem de `react-day-picker/locale` — são pacotes diferentes
- `aria-label` dinâmico no Button — anuncia a data selecionada ao leitor de tela

---

## Checkbox

**Propósito**: seleção independente de uma ou mais opções em uma lista.

**Quando usar**: múltiplas seleções independentes. Para seleção única, usar `RadioGroup`. Para toggle on/off de configuração, usar `Switch`.

**Implementação**:
```tsx
{/* Par obrigatório: Checkbox + Label com htmlFor */}
<div className="flex items-center space-x-2">
  <Checkbox id="termos" />
  <Label
    htmlFor="termos"
    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
  >
    Aceito os termos e condições
  </Label>
</div>

{/* Estado indeterminate */}
<Checkbox
  checked="indeterminate"
  onCheckedChange={handleChange}
  aria-label="Selecionar todos os itens"
/>

{/* Grupo de checkboxes relacionados */}
<fieldset>
  <legend className="text-sm font-medium mb-3">Notificações</legend>
  <div className="space-y-2">
    <div className="flex items-center space-x-2">
      <Checkbox id="email" />
      <Label htmlFor="email">Por email</Label>
    </div>
    <div className="flex items-center space-x-2">
      <Checkbox id="sms" />
      <Label htmlFor="sms">Por SMS</Label>
    </div>
  </div>
</fieldset>
```

**Regras**:
- `Checkbox` sempre acompanhado de `Label` com `htmlFor` correspondente ao `id`
- `checked="indeterminate"` para seleção parcial de grupo (nem todos marcados)
- Agrupar checkboxes relacionados em `<fieldset>` + `<legend>`

**Integração com FormField**:
```tsx
<FormField
  control={form.control}
  name="termos"
  render={({ field }) => (
    <FormItem className="flex items-center space-x-2">
      <FormControl>
        <Checkbox
          checked={field.value}
          onCheckedChange={field.onChange}
        />
      </FormControl>
      <FormLabel className="!mt-0 font-normal">
        Aceito os termos e condições
      </FormLabel>
    </FormItem>
  )}
/>
```

**Acessibilidade**: Radix aplica `role="checkbox"` e `aria-checked` automaticamente, incluindo `"mixed"` para indeterminate.

**UX Writing** (ver `19-tom-de-voz.md`): label descreve o estado ativo — "Receber notificações por email" em vez de "Email".

**Analytics** (ver `21-analytics.md`):
```tsx
<Checkbox
  onCheckedChange={(checked) => {
    track("field_change", {
      component: "checkbox",
      location: "settings_form",
      field_name: "email_notifications",
      value: String(checked)
    });
    field.onChange(checked);
  }}
/>
```

---

## Form

**Propósito**: wrapper de acessibilidade e gerenciamento de estado para formulários, integrado com React Hook Form e Zod.

**Estrutura de subcomponentes**:
```
Form
└── FormField          (conecta ao campo do RHF via control + name)
    └── FormItem       (container do campo)
        ├── FormLabel        (label acessível)
        ├── FormControl      (injeta aria-invalid + aria-describedby automaticamente)
        │   └── [Input | Select | Checkbox | Switch | ...]
        ├── FormDescription  (helper text — texto de apoio)
        └── FormMessage      (erro do Zod — visível apenas com erro)
```

**Implementação completa**:
```tsx
import { useForm, FieldErrors } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Form, FormControl, FormDescription,
  FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form"

const formSchema = z.object({
  email: z.string().email({ message: "Email inválido. Use o formato nome@dominio.com" }),
  nome: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres." }),
})

export function CadastroForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", nome: "" },
  })

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    track("form_submit", {
      component: "form",
      location: "cadastro_page",
      field_count: Object.keys(data).length
    })
  }

  const onError = (errors: FieldErrors) => {
    track("form_error", {
      component: "form",
      location: "cadastro_page",
      error_fields: Object.keys(errors)
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome completo</FormLabel>
              <FormControl>
                <Input placeholder="ex: João da Silva" {...field} />
              </FormControl>
              <FormDescription>
                Será exibido publicamente no perfil.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="ex: joao@empresa.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

**Regras**:
- Sempre usar `Form > FormField > FormItem` — nunca criar campos fora desta estrutura
- `FormDescription` substitui qualquer helper text customizado
- `FormMessage` exibe o erro do Zod — não criar mensagens de erro paralelas
- `FormControl` injeta `aria-invalid` e `aria-describedby` automaticamente — não adicionar manualmente
- Submit bloqueado com `form.formState.isSubmitting`

**UX Writing das mensagens de erro** (ver `19-tom-de-voz.md`): causa + orientação, sem culpar — "Email inválido. Use o formato nome@dominio.com", nunca "Campo inválido".

---

## Input

**Propósito**: campo de texto de linha única para qualquer tipo de entrada do usuário.

**Implementação**:
```tsx
{/* Dentro de FormField — padrão obrigatório */}
<FormField
  control={form.control}
  name="telefone"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Telefone</FormLabel>
      <FormControl>
        <Input
          type="tel"
          placeholder="ex: (11) 99999-9999"
          autoComplete="tel"
          {...field}
        />
      </FormControl>
      <FormDescription>Inclua o DDD.</FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>

{/* Input com ícone à esquerda */}
<div className="relative">
  <Search
    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
    aria-hidden="true"
  />
  <Input
    type="search"
    placeholder="Buscar componentes..."
    className="pl-9"
    aria-label="Buscar componentes"
  />
  <Button type="submit" className="sr-only">Buscar</Button>
</div>
```

**Regras**:
- `type` adequado obrigatório: `email`, `password`, `number`, `tel`, `url`, `search`, `date`
- Placeholder: exemplo real do formato — nunca instrução ("Digite seu email")
- Placeholder **não substitui** Label — ambos são obrigatórios
- Ícones: apenas em formulários pequenos (login, busca) — não em formulários longos de cadastro
- Ícone posicionado **à esquerda** via padrão `relative/absolute/pl-*`
- Formulários de busca: sempre com botão de submit (pode ser `sr-only` visualmente)
- Estilo personalizado via classe `.input` do tema

**Tokens** (ver `16-padroes-design-sistema.md`):
```tsx
className="bg-input border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
```

**Acessibilidade** (ver `11-acessibilidade.md`):
- `FormControl` aplica `aria-invalid` e `aria-errormessage` automaticamente dentro de `FormField`
- `aria-required="true"` em campos obrigatórios

**Analytics** (ver `21-analytics.md`):
```tsx
{/* Apenas em funis críticos */}
<Input
  onFocus={() => track("field_focus", {
    component: "input", location: "signup_form", field_name: "email"
  })}
  onBlur={(e) => {
    if (e.target.value) track("field_blur", {
      component: "input", location: "signup_form", field_name: "email"
    })
  }}
/>
```

> Nunca rastrear `value` de campos sensíveis: senha, CPF, cartão de crédito.

---

## Input OTP

**Propósito**: entrada de códigos de verificação de uso único (OTP, PIN, 2FA).

**Estrutura obrigatória de subcomponentes**:
```
InputOTP (maxLength, pattern)
├── InputOTPGroup
│   ├── InputOTPSlot (index=0)
│   ├── InputOTPSlot (index=1)
│   └── InputOTPSlot (index=2)
├── InputOTPSeparator
└── InputOTPGroup
    ├── InputOTPSlot (index=3)
    ├── InputOTPSlot (index=4)
    └── InputOTPSlot (index=5)
```

**Implementação**:
```tsx
import { REGEXP_ONLY_DIGITS } from "input-otp"
import {
  InputOTP, InputOTPGroup,
  InputOTPSeparator, InputOTPSlot
} from "@/components/ui/input-otp"

{/* OTP de 6 dígitos — padrão mais comum */}
<InputOTP
  maxLength={6}
  pattern={REGEXP_ONLY_DIGITS}
  aria-label="Código de verificação de 6 dígitos"
  value={value}
  onChange={setValue}
>
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
  </InputOTPGroup>
  <InputOTPSeparator />
  <InputOTPGroup>
    <InputOTPSlot index={3} />
    <InputOTPSlot index={4} />
    <InputOTPSlot index={5} />
  </InputOTPGroup>
</InputOTP>

{/* PIN de 4 dígitos — sem separador */}
<InputOTP maxLength={4} pattern={REGEXP_ONLY_DIGITS}>
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
    <InputOTPSlot index={3} />
  </InputOTPGroup>
</InputOTP>
```

**Regras**:
- `maxLength` obrigatório — define o número total de slots
- `pattern={REGEXP_ONLY_DIGITS}` obrigatório para códigos numéricos
- `REGEXP_ONLY_DIGITS_AND_CHARS` para códigos alfanuméricos
- Auto-focus no próximo slot e suporte a paste são comportamentos nativos — não implementar manualmente
- `InputOTPSeparator` entre grupos apenas quando o código tem separação visual (ex: 000-000)

**Integração com FormField**:
```tsx
<FormField
  control={form.control}
  name="codigo"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Código de verificação</FormLabel>
      <FormControl>
        <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} {...field}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Acessibilidade**: o componente renderiza um único `<input>` oculto (acessível a leitores de tela) com slots visuais sobrepostos. `aria-label` no `InputOTP` descreve o propósito.

---

## Label

**Propósito**: rótulo textual acessível associado a um campo de formulário.

**Implementação**:
```tsx
{/* Fora de FormField — htmlFor obrigatório */}
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />

{/* Dentro de FormField — associação gerenciada pelo contexto */}
<FormLabel>Email</FormLabel>

{/* Campo obrigatório */}
<Label htmlFor="nome">
  Nome completo <span className="text-destructive" aria-hidden="true">*</span>
</Label>
<Input id="nome" aria-required="true" />
```

**Regras**:
- `htmlFor` obrigatório fora de `FormField` — associa o label ao campo via `id`
- Dentro de `FormField`, usar `FormLabel` — associação automática via contexto interno
- Posicionar **acima** do campo (padrão) ou à esquerda em layouts horizontais
- Peso tipográfico: `font-medium` — padrão do Shadcn, não sobrescrever para `font-bold`

**UX Writing** (ver `19-tom-de-voz.md`):
- Substantivo ou frase nominal curta, sem dois-pontos, sem ponto final
- Capitalização apenas na primeira palavra
- Correto: "Nome completo", "Email profissional"
- Incorreto: "Nome completo:", "Informe seu nome", "nome completo"

---

## Radio Group

**Propósito**: seleção de uma única opção em conjunto mutuamente exclusivo.

**Quando usar**: 2–7 opções com seleção única. Para on/off, usar `Switch`. Para confirmação de uma opção, usar `Checkbox`.

**Implementação**:
```tsx
<RadioGroup
  value={value}
  onValueChange={setValue}
  aria-label="Forma de pagamento"
>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="cartao" id="cartao" />
    <Label htmlFor="cartao">Cartão de crédito</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="pix" id="pix" />
    <Label htmlFor="pix">Pix</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="boleto" id="boleto" />
    <Label htmlFor="boleto">Boleto bancário</Label>
  </div>
</RadioGroup>
```

**Regras**:
- `RadioGroupItem` sempre com `Label` associado via `htmlFor` + `id`
- **Não pré-selecionar** por padrão — apenas quando existe um default genuíno de negócio. Pré-seleção forçada cria erros silenciosos em formulários
- 4+ opções: orientação vertical (padrão do exemplo acima)
- 2–3 opções curtas: pode usar `className="flex gap-6"`

**Integração com FormField**:
```tsx
<FormField
  control={form.control}
  name="pagamento"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Forma de pagamento</FormLabel>
      <FormControl>
        <RadioGroup value={field.value} onValueChange={field.onChange}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="cartao" id="cartao" />
            <Label htmlFor="cartao">Cartão de crédito</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="pix" id="pix" />
            <Label htmlFor="pix">Pix</Label>
          </div>
        </RadioGroup>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Acessibilidade**: Radix aplica `role="radiogroup"` e `role="radio"` automaticamente. Arrow keys navegam entre opções — comportamento nativo.

**Analytics** (ver `21-analytics.md`):
```tsx
<RadioGroup
  onValueChange={(value) => {
    track("field_change", {
      component: "radio_group",
      location: "checkout_form",
      field_name: "pagamento",
      value
    });
    field.onChange(value);
  }}
/>
```

---

## Select

**Propósito**: seleção de uma opção em lista compacta.

**Quando usar**: 3+ opções fixas. Para 2 opções, usar `RadioGroup`. Para listas com busca ou 10+ itens, usar **Combobox** (`Command + Popover`) — o `Select` não tem busca nativa.

**Estrutura de subcomponentes**:
```
Select
├── SelectTrigger
│   └── SelectValue       (placeholder ou valor selecionado)
└── SelectContent
    ├── SelectGroup       (agrupamento opcional)
    │   ├── SelectLabel
    │   └── SelectItem
    └── SelectItem
```

**Implementação**:
```tsx
{/* Select básico */}
<Select value={value} onValueChange={setValue}>
  <SelectTrigger aria-label="Selecionar estado">
    <SelectValue placeholder="Selecione..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="sp">São Paulo</SelectItem>
    <SelectItem value="rj">Rio de Janeiro</SelectItem>
    <SelectItem value="mg">Minas Gerais</SelectItem>
  </SelectContent>
</Select>

{/* Select com grupos */}
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Selecione a região..." />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Sudeste</SelectLabel>
      <SelectItem value="sp">São Paulo</SelectItem>
      <SelectItem value="rj">Rio de Janeiro</SelectItem>
    </SelectGroup>
    <SelectGroup>
      <SelectLabel>Sul</SelectLabel>
      <SelectItem value="rs">Rio Grande do Sul</SelectItem>
      <SelectItem value="sc">Santa Catarina</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

**Regras**:
- Placeholder: "Selecione..." — nunca "-- Escolha --" ou campo vazio
- Opções consistentes entre si — não misturar siglas com nomes completos
- Para 10+ opções com busca: usar **Combobox** em vez de Select

**Integração com FormField**:
```tsx
<FormField
  control={form.control}
  name="estado"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Estado</FormLabel>
      <Select value={field.value} onValueChange={field.onChange}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="sp">São Paulo</SelectItem>
          <SelectItem value="rj">Rio de Janeiro</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Acessibilidade**: Radix aplica `role="combobox"` no trigger e `role="listbox"` + `role="option"` no conteúdo. Arrow keys navegam entre opções — comportamento nativo.

**Analytics** (ver `21-analytics.md`):
```tsx
<Select
  onValueChange={(value) => {
    track("option_select", {
      component: "select",
      location: "profile_form",
      field_name: "estado",
      value,
      label: estadosMap[value]
    });
    field.onChange(value);
  }}
/>
```

---

## Combobox

> **Padrão composto** — não é um componente Shadcn isolado. É a combinação de `Command + Popover` para criar um Select com busca integrada. A implementação completa está em `10-overlay-components.md` → "Command — Combobox".

**Quando usar em vez do Select**:
- Listas com 10+ itens onde busca por texto facilita a seleção
- Itens com nomes longos ou similares
- Seleção com confirmação visual do item escolhido (checkmark)

**Integração com FormField**:
```tsx
<FormField
  control={form.control}
  name="estado"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Estado</FormLabel>
      <FormControl>
        {/* Substituir pelo padrão Combobox de 10-overlay-components.md */}
        {/* Passar field.value como value e field.onChange como onSelect */}
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

**Propósito**: seleção de valor numérico dentro de um intervalo contínuo.

**Implementação**:
```tsx
const [volume, setVolume] = useState([50]);

<div className="space-y-2">
  <div className="flex justify-between text-sm">
    <Label htmlFor="volume">Volume</Label>
    <span
      className="text-muted-foreground"
      aria-live="polite"
      aria-label={`${volume[0]} por cento`}
    >
      {volume[0]}%
    </span>
  </div>
  <Slider
    id="volume"
    min={0}
    max={100}
    step={1}
    value={volume}
    onValueChange={setVolume}
    onValueCommit={(value) => {
      track("field_change", {
        component: "slider",
        location: "settings_page",
        field_name: "volume",
        value: String(value[0])
      });
    }}
    aria-label="Volume de áudio"
    aria-valuetext={`${volume[0]} por cento`}
    className="w-full"
  />
</div>
```

**Regras**:
- Sempre exibir o valor atual externamente via estado — o Slider não exibe valor por padrão
- `aria-live="polite"` no elemento que exibe o valor — anuncia ao leitor de tela
- Definir `min`, `max` e `step` explicitamente
- `onValueChange` recebe array: `[value]` para single thumb, `[min, max]` para range

**Acessibilidade** (ver `11-acessibilidade.md`):
- `aria-label` obrigatório quando não há label visível associado
- `aria-valuetext` para valores que precisam de contexto ("50 por cento" em vez de "50")
- Arrow keys ajustam em `step`, `Shift+Arrow` em 10× step — comportamento nativo do Radix

**Analytics**: usar `onValueCommit` — dispara ao soltar o thumb, não a cada movimento. Evita dezenas de eventos por interação.

---

## Switch

**Propósito**: toggle on/off para configurações com efeito imediato, sem necessidade de submissão.

**Quando usar**: configurações de sistema (notificações, dark mode, visibilidade). Para seleção em formulários com submit, usar `Checkbox`. Para opções de formatação visual, usar `Toggle`.

**Implementação**:
```tsx
{/* Par obrigatório: Switch + Label */}
<div className="flex items-center space-x-2">
  <Switch
    id="notificacoes"
    checked={enabled}
    onCheckedChange={setEnabled}
  />
  <Label htmlFor="notificacoes">Receber notificações por email</Label>
</div>

{/* Switch com descrição em painel de configurações */}
<div className="flex items-center justify-between">
  <div className="space-y-0.5">
    <Label htmlFor="marketing">Emails de marketing</Label>
    <p className="text-sm text-muted-foreground">
      Receba novidades e promoções da plataforma.
    </p>
  </div>
  <Switch
    id="marketing"
    checked={marketing}
    onCheckedChange={setMarketing}
  />
</div>
```

**Regras**:
- `Switch` sempre com `Label` associado via `htmlFor`
- Label descreve o estado **ativo**: "Receber notificações" (não "Notificações")
- Efeito imediato ao alternar — não usar dentro de formulários com submit para preferências

**Integração com FormField** (quando parte de formulário com submit):
```tsx
<FormField
  control={form.control}
  name="newsletter"
  render={({ field }) => (
    <FormItem className="flex items-center space-x-2">
      <FormControl>
        <Switch checked={field.value} onCheckedChange={field.onChange} />
      </FormControl>
      <FormLabel className="!mt-0">Inscrever na newsletter</FormLabel>
    </FormItem>
  )}
/>
```

**Acessibilidade**: Radix aplica `role="switch"` e `aria-checked` automaticamente via `data-state`.

**Analytics** (ver `21-analytics.md`):
```tsx
<Switch
  onCheckedChange={(checked) => {
    track("field_change", {
      component: "switch",
      location: "notification_settings",
      field_name: "email_notifications",
      value: String(checked)
    });
    setEnabled(checked);
  }}
/>
```

---

## Textarea

**Propósito**: entrada de texto de múltiplas linhas.

**Quando usar**: textos longos onde se espera 3+ linhas — bio, descrição, mensagem, observações. Para linha única, usar `Input`.

**Implementação**:
```tsx
<FormField
  control={form.control}
  name="descricao"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Descrição</FormLabel>
      <FormControl>
        <Textarea
          placeholder="ex: Descreva o produto em até 500 caracteres..."
          className="resize-y min-h-[120px]"
          maxLength={500}
          {...field}
        />
      </FormControl>
      <div className="flex justify-between">
        <FormDescription>Descreva o produto com clareza.</FormDescription>
        <span
          className="text-xs text-muted-foreground"
          aria-live="polite"
          aria-label={`${field.value?.length ?? 0} de 500 caracteres usados`}
        >
          {field.value?.length ?? 0}/500
        </span>
      </div>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Classes de resize** (via Tailwind — não prop CSS direta):
- `resize-none` — sem redimensionamento (modais, layouts fixos)
- `resize-y` — vertical apenas (padrão recomendado)
- `resize` — livre (evitar — quebra layouts)

**Regras**:
- `min-h-[120px]` como altura mínima padrão (~3 linhas)
- Contador de caracteres com `aria-live="polite"` — anuncia ao leitor de tela sem interromper
- `maxLength` no elemento + validação Zod — defesa em profundidade

**Acessibilidade**: `aria-invalid` aplicado automaticamente pelo `FormControl` dentro de `FormField`.

---

## Toggle e Toggle Group

**Propósito**: botão de dois estados (ativo/inativo) para opções visuais ou de formatação.

**Quando usar**: formatação de texto (negrito, itálico), filtros de visualização, modos de exibição. Para configurações de sistema, usar `Switch`. Para seleção em formulários, usar `Checkbox`.

**Critério de decisão**:

| Situação | Componente |
|----------|------------|
| Formatação visual (negrito, itálico, sublinhado) | Toggle |
| Configuração com efeito imediato | Switch |
| Seleção em formulário com submit | Checkbox |

**Implementação**:
```tsx
{/* Toggle simples — tamanho default obrigatório */}
<Toggle
  pressed={isBold}
  onPressedChange={setIsBold}
  aria-label="Negrito"
  size="default"
>
  <Bold className="h-4 w-4" aria-hidden="true" />
</Toggle>

{/* Toggle Group — seleção única */}
<ToggleGroup
  type="single"
  value={alignment}
  onValueChange={setAlignment}
  aria-label="Alinhamento do texto"
>
  <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
    <AlignLeft className="h-4 w-4" aria-hidden="true" />
  </ToggleGroupItem>
  <ToggleGroupItem value="center" aria-label="Centralizar">
    <AlignCenter className="h-4 w-4" aria-hidden="true" />
  </ToggleGroupItem>
  <ToggleGroupItem value="right" aria-label="Alinhar à direita">
    <AlignRight className="h-4 w-4" aria-hidden="true" />
  </ToggleGroupItem>
</ToggleGroup>

{/* Toggle Group — seleção múltipla */}
<ToggleGroup type="multiple" value={formats} onValueChange={setFormats}>
  <ToggleGroupItem value="bold" aria-label="Negrito">
    <Bold className="h-4 w-4" aria-hidden="true" />
  </ToggleGroupItem>
  <ToggleGroupItem value="italic" aria-label="Itálico">
    <Italic className="h-4 w-4" aria-hidden="true" />
  </ToggleGroupItem>
</ToggleGroup>
```

**Estrutura do Toggle Group**:
```
ToggleGroup (type="single" | type="multiple")
└── ToggleGroupItem (value="...")
```

**Regras**:
- Tamanho `default` obrigatório — salvo instrução específica
- `type="single"` para seleção exclusiva, `type="multiple"` para múltiplas
- `aria-label` obrigatório em itens com apenas ícone

**Acessibilidade**: Radix aplica `aria-pressed` no `Toggle` e `aria-selected` no `ToggleGroupItem`. Arrow keys navegam entre itens do grupo.

**Analytics** (ver `21-analytics.md`):
```tsx
<ToggleGroup
  onValueChange={(value) => {
    track("field_change", {
      component: "toggle_group",
      location: "editor_toolbar",
      field_name: "text_alignment",
      value: Array.isArray(value) ? value.join(",") : value
    });
  }}
/>
```

---

## Form multi-step (integração com Stepper)

Para formulários com múltiplas etapas sequenciais, o `Form` do arquivo 06 se integra com o `Stepper` do arquivo 05. A validação por etapa usa `form.trigger(fields)` antes de avançar.

```tsx
const formSchema = z.object({
  // Etapa 1
  nome: z.string().min(2),
  email: z.string().email(),
  // Etapa 2
  cep: z.string().min(8),
  cidade: z.string().min(2),
})

const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: { nome: "", email: "", cep: "", cidade: "" },
  mode: "onChange",
})

// Campos por etapa — validar apenas os campos da etapa atual antes de avançar
const fieldsByStep: Record<number, (keyof z.infer<typeof formSchema>)[]> = {
  0: ["nome", "email"],
  1: ["cep", "cidade"],
}

const handleNext = async () => {
  const isValid = await form.trigger(fieldsByStep[currentStep])
  if (isValid) setCurrentStep((s) => s + 1)
}

// O <Form> envolve todo o Stepper — o submit só ocorre na última etapa
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    {/* Stepper e conteúdo de cada etapa */}
    <div className="flex justify-end gap-2 mt-6">
      {currentStep > 0 && (
        <Button type="button" variant="outline" onClick={() => setCurrentStep((s) => s - 1)}>
          Anterior
        </Button>
      )}
      {currentStep < totalSteps - 1 ? (
        <Button type="button" onClick={handleNext}>Próximo</Button>
      ) : (
        <Button type="submit">Finalizar</Button>
      )}
    </div>
  </form>
</Form>
```

**Regras**:
- `mode: "onChange"` no `useForm` — valida em tempo real conforme o usuário preenche
- `form.trigger(fields)` antes de avançar — valida apenas os campos da etapa atual
- `type="button"` nos botões Anterior e Próximo — evita submit acidental
- `type="submit"` apenas no botão da última etapa

---

## Regras transversais de Form Components

**Estrutura obrigatória por campo**:
```
FormField > FormItem > FormLabel + FormControl + FormDescription + FormMessage
```

**Tokens obrigatórios** (ver `16-padroes-design-sistema.md`):
- Input/Textarea/Select: `bg-input border-input text-foreground placeholder:text-muted-foreground`
- Focus: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- Erro: `border-destructive` no campo, `text-destructive` na mensagem
- Label: `font-medium` — não sobrescrever para `font-bold`

**Acessibilidade transversal** (ver `11-acessibilidade.md`):
- `FormControl` aplica `aria-invalid` e `aria-describedby` automaticamente — nunca adicionar manualmente
- `aria-required="true"` em campos obrigatórios
- `aria-live="polite"` em contadores e mensagens dinâmicas
- Nunca rastrear `value` de campos sensíveis (senha, CPF, cartão)

**Analytics transversal** (ver `21-analytics.md`):

| Evento | Quando disparar | Componentes |
|--------|----------------|-------------|
| `button_click` | Ao clicar | Button |
| `form_submit` | Após validação bem-sucedida | Form |
| `form_error` | Quando RHF rejeita submit | Form |
| `form_abandon` | Ao sair sem submeter | Form |
| `field_change` | Ao alterar valor de seleção | Checkbox, Switch, Select, RadioGroup, Slider, Toggle |
| `field_focus` | Ao focar | Input, Textarea (funis críticos) |
| `field_error` | Ao exibir erro | Qualquer campo com FormMessage |
| `option_select` | Ao selecionar opção | Select |

**UX Writing transversal** (ver `19-tom-de-voz.md`):
- Labels: substantivos, sem dois-pontos, capitalização na primeira palavra
- Placeholders: exemplos reais, nunca instruções
- Mensagens de erro: causa + orientação, sem culpar o usuário
- Botão submit: verbo no infinitivo, máximo 3 palavras