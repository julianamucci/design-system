// ─── Exemplos de código — React ───────────────────────────────────────────────
// Estes snippets são exibidos na seção de exemplos da documentação do Button.

export const importExample = `import { Button } from "@/components/ui/button"`;

export const basicExample = `import { Button } from "@/components/ui/button"

export function Demo() {
  return <Button>Salvar</Button>
}`;

export const variantsExample = `import { Button } from "@/components/ui/button"

export function Demo() {
  return (
    <div className="flex gap-2 flex-wrap">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  )
}`;

export const sizesExample = `import { Button } from "@/components/ui/button"

export function Demo() {
  return (
    <div className="flex items-center gap-2">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">⚡</Button>
    </div>
  )
}`;

export const withIconExample = `import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"

export function Demo() {
  return (
    <Button>
      <Mail className="mr-2 h-4 w-4" />
      Enviar email
    </Button>
  )
}`;

export const loadingExample = `import { useState } from "react"
import { Button } from "@/components/ui/button"

export function Demo() {
  const [loading, setLoading] = useState(false)

  return (
    <Button
      disabled={loading}
      onClick={() => {
        setLoading(true)
        setTimeout(() => setLoading(false), 2000)
      }}
    >
      {loading ? "Aguarde..." : "Salvar"}
    </Button>
  )
}`;

export const asChildExample = `import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

export function Demo() {
  return (
    <Button asChild>
      <Link to="/dashboard">Ir para Dashboard</Link>
    </Button>
  )
}`;
