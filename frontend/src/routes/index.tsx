import { createFileRoute, Link } from '@tanstack/react-router';
import { useProjects } from '../hooks/useProjects';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatDate, getStatusColor, getStatusLabel } from '../lib/utils';
import { Film, ArrowRight, Sparkles, Image as ImageIcon, Zap } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const { data: projects, isLoading } = useProjects();
  const recentProjects = projects?.slice(0, 3) || [];

  return (
    <div className="space-y-12">
      {/* Hero section */}
      <section className="text-center py-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
          <Sparkles className="h-4 w-4" />
          Powered by AI
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Generuj scenariusze do{' '}
          <span className="text-primary-600">rolek</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Przeksztalc swoj tekst w profesjonalny scenariusz z obrazami AI.
          Idealne dla TikTok, Instagram Reels i YouTube Shorts.
        </p>
        <Link to="/create">
          <Button size="lg" className="text-lg px-8">
            <Film className="h-5 w-5" />
            Stworz nowa rolke
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 text-primary-600 rounded-lg mb-4">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Scenariusze AI</h3>
            <p className="text-gray-600">
              Claude AI generuje profesjonalne scenariusze z podzialem na sceny
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-lg mb-4">
              <ImageIcon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Obrazy AI</h3>
            <p className="text-gray-600">
              Automatyczne generowanie obrazow dla kazdej sceny
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 text-yellow-600 rounded-lg mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Szybko i prosto</h3>
            <p className="text-gray-600">
              Od tekstu do gotowego scenariusza w kilka minut
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Recent projects */}
      {recentProjects.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Ostatnie projekty</h2>
            <Link to="/projects" className="text-primary-600 hover:text-primary-700 font-medium">
              Zobacz wszystkie
              <ArrowRight className="h-4 w-4 inline ml-1" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-32" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  to="/projects/$projectId"
                  params={{ projectId: project.id }}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">
                          {project.title}
                        </h3>
                        <Badge className={getStatusColor(project.status)}>
                          {getStatusLabel(project.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {project.theme}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(project.createdAt)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
