import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { BookOpen, Palette, Code, Zap, Users, Heart } from 'lucide-react';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const popularComponents = [
    { name: 'Button', path: 'button', description: 'Botões para todas as ações' },
    { name: 'Card', path: 'card', description: 'Containers para agrupar conteúdo' },
    { name: 'Input', path: 'input', description: 'Campos de entrada de dados' },
    { name: 'Dialog', path: 'dialog', description: 'Modais e dialogs' },
    { name: 'Form', path: 'form', description: 'Construção de formulários' },
    { name: 'Table', path: 'table', description: 'Tabelas de dados' }
  ];

  return (
    <div className="w-full">
      <div className="p-8 space-y-12 max-w-4xl mx-auto">
        <header className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground text-2xl font-bold">S</span>
            </div>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight">Documentação Shadcn/UI</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Biblioteca de componentes reutilizáveis construída com React e Tailwind CSS.
            Copie e cole os componentes que precisar em seu projeto.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Button onClick={() => onNavigate('button')}>
              <Code className="h-4 w-4 mr-2" aria-hidden="true" />
              Começar
            </Button>
            <Button variant="outline" onClick={() => onNavigate('accordion')}>
              <BookOpen className="h-4 w-4 mr-2" aria-hidden="true" />
              Ver Componentes
            </Button>
          </div>
        </header>

        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-semibold">Por que usar Shadcn/UI?</h2>
            <p className="text-muted-foreground">
              Uma biblioteca moderna e flexível para desenvolvimento rápido
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-md flex items-center justify-center">
                    <Zap className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <CardTitle>Rápido</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Componentes prontos para uso que aceleram o desenvolvimento.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-md flex items-center justify-center">
                    <Palette className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <CardTitle>Personalizável</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Sistema de design flexível baseado em variáveis CSS.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-md flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <CardTitle>Acessível</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Construído seguindo diretrizes WCAG 2.1 AA de acessibilidade.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-semibold">Componentes Populares</h2>
            <p className="text-muted-foreground">
              Comece com os componentes mais utilizados
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularComponents.map((component) => (
              <Card
                key={component.path}
                role="button"
                className="hover:shadow-md transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                tabIndex={0}
                onClick={() => onNavigate(component.path)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onNavigate(component.path);
                  }
                }}
              >
                <CardHeader className="pb-3">
                  <CardTitle>{component.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">{component.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-semibold">Como Navegar na Documentação</h2>
            <p className="text-muted-foreground">
              Guia rápido para aproveitar ao máximo esta documentação
            </p>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="secondary">1</Badge>
                  Sidebar de Navegação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Use a sidebar à esquerda para navegar entre componentes. Os componentes estão organizados
                  por categorias (Layout, Formulários, Feedback, etc.) para facilitar a busca.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="secondary">2</Badge>
                  Estrutura das Páginas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Cada componente tem uma estrutura padronizada: demonstração, guidelines, casos de uso,
                  exemplos de código, propriedades e dicas. Siga essa ordem para entender completamente o componente.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="secondary">3</Badge>
                  Código Pronto para Usar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Todos os exemplos mostram o código completo. Você pode copiar e colar diretamente em seu projeto.
                  As importações necessárias estão sempre documentadas.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="secondary">4</Badge>
                  Guidelines Obrigatórias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Preste atenção às seções &#34;Guidelines Obrigatórias&#34; e &#34;Quando e Como Usar&#34;.
                  Elas contêm regras importantes para usar os componentes corretamente.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="text-center space-y-4">
          <div className="flex justify-center">
            <Heart className="h-8 w-8 text-destructive" aria-hidden="true" />
          </div>
          <h3 className="text-xl font-semibold">Pronto para começar?</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Explore os componentes na sidebar ou comece com os componentes populares acima.
          </p>
          <Button onClick={() => onNavigate('button')}>
            Explorar Componentes
          </Button>
        </section>
      </div>
    </div>
  );
}
