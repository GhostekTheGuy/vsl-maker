import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useProjects } from '../../hooks/useProjects';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { formatDate, formatDuration, getStatusColor, getStatusLabel } from '../../lib/utils';
import { Film, Plus, Image as ImageIcon, Clock, FolderOpen } from 'lucide-react';

export const Route = createFileRoute('/projects/')({
  component: ProjectsPage,
});

function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredProjects = projects?.filter((project) => {
    if (statusFilter === 'all') return true;
    return project.status === statusFilter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="py-12 text-center">
          <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Brak projektow</h2>
          <p className="text-gray-600 mb-4">
            Nie masz jeszcze zadnych projektow. Stworz swoja pierwsza rolke!
          </p>
          <Link to="/create">
            <Button>
              <Plus className="h-4 w-4" />
              Stworz nowa rolke
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Projekty</h1>
        <div className="flex items-center gap-4">
          <Select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'Wszystkie' },
              { value: 'completed', label: 'Zakonczone' },
              { value: 'script_ready', label: 'Scenariusz gotowy' },
              { value: 'generating_images', label: 'Generowanie' },
              { value: 'error', label: 'Z bledami' },
            ]}
            className="w-40"
          />
          <Link to="/create">
            <Button>
              <Plus className="h-4 w-4" />
              Nowa rolka
            </Button>
          </Link>
        </div>
      </div>

      {/* Projects grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects?.map((project) => (
          <Link
            key={project.id}
            to="/projects/$projectId"
            params={{ projectId: project.id }}
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full group">
              <CardContent className="p-4">
                {/* Thumbnail */}
                <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
                  {project.scenes[0]?.imageUrl ? (
                    <img
                      src={project.scenes[0].imageUrl}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Title & status */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-1 flex-1">
                    {project.title}
                  </h3>
                  <Badge className={getStatusColor(project.status)}>
                    {getStatusLabel(project.status)}
                  </Badge>
                </div>

                {/* Theme */}
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {project.theme}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" />
                    {project.scenes.filter((s) => s.imageStatus === 'completed').length}/
                    {project.scenes.length} obrazow
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(project.totalDuration)}
                  </span>
                </div>

                {/* Date */}
                <p className="text-xs text-gray-400 mt-2">
                  {formatDate(project.createdAt)}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
