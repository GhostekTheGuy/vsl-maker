import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useProject } from '../../hooks/useProject';
import { useRegenerateScript } from '../../hooks/useGenerateScript';
import {
  useGenerateImages,
  useGenerateSingleImage,
  useUpdateScene,
} from '../../hooks/useGenerateImages';
import type { Scene } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { ScriptEditor } from '../../components/ScriptEditor';
import { GenerationProgress } from '../../components/GenerationProgress';
import {
  formatDate,
  formatDuration,
  getStatusColor,
  getStatusLabel,
} from '../../lib/utils';
import {
  ArrowLeft,
  Image as ImageIcon,
  RefreshCw,
  Download,
  FileText,
  Clock,
  Trash2,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import toast from 'react-hot-toast';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const Route = createFileRoute('/projects/$projectId')({
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: project, isLoading, error } = useProject(projectId);
  const regenerateScript = useRegenerateScript(projectId);
  const generateImages = useGenerateImages(projectId);
  const generateSingleImage = useGenerateSingleImage(projectId);
  const updateScene = useUpdateScene(projectId);

  const [selectedModel, setSelectedModel] = useState<'flash' | 'pro'>('flash');

  const deleteProject = useMutation({
    mutationFn: () => api.delete(`/projects/${projectId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate({ to: '/projects' });
      toast.success('Projekt usuniety');
    },
    onError: () => {
      toast.error('Nie udalo sie usunac projektu');
    },
  });

  const handleGenerateAllImages = () => {
    generateImages.mutate({ model: selectedModel });
  };

  const handleRegenerateImage = (sceneId: string) => {
    generateSingleImage.mutate({ sceneId, model: selectedModel });
  };

  const handleUpdateScene = (sceneId: string, data: Partial<Scene>) => {
    updateScene.mutate({ sceneId, data });
  };

  const handleDownloadZip = async () => {
    if (!project) return;

    const zip = new JSZip();
    const imgFolder = zip.folder('images');

    for (const scene of project.scenes) {
      if (scene.imageUrl) {
        try {
          const response = await fetch(scene.imageUrl);
          const blob = await response.blob();
          imgFolder?.file(`scene_${scene.number}_${scene.title.replace(/\s+/g, '_')}.png`, blob);
        } catch (error) {
          console.error(`Failed to download image for scene ${scene.number}:`, error);
        }
      }
    }

    // Add script as JSON
    const scriptJson = JSON.stringify(
      {
        title: project.title,
        theme: project.theme,
        totalDuration: project.totalDuration,
        scenes: project.scenes.map((s) => ({
          number: s.number,
          title: s.title,
          description: s.description,
          visualPrompt: s.visualPrompt,
          durationSeconds: s.durationSeconds,
        })),
      },
      null,
      2
    );
    zip.file('script.json', scriptJson);

    // Add script as TXT
    let scriptTxt = `${project.title}\n${'='.repeat(50)}\n\n`;
    scriptTxt += `Temat: ${project.theme}\n`;
    scriptTxt += `Czas trwania: ${formatDuration(project.totalDuration)}\n\n`;
    scriptTxt += `${'='.repeat(50)}\nSCENARIUSZ\n${'='.repeat(50)}\n\n`;

    for (const scene of project.scenes) {
      scriptTxt += `--- Scena ${scene.number}: ${scene.title} ---\n`;
      scriptTxt += `Czas: ${formatDuration(scene.durationSeconds)}\n\n`;
      scriptTxt += `Opis:\n${scene.description}\n\n`;
      scriptTxt += `Visual Prompt:\n${scene.visualPrompt}\n\n`;
    }
    zip.file('script.txt', scriptTxt);

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${project.title.replace(/\s+/g, '_')}.zip`);
    toast.success('Pobrano ZIP');
  };

  const handleDownloadScript = () => {
    if (!project) return;

    const scriptJson = JSON.stringify(
      {
        title: project.title,
        theme: project.theme,
        totalDuration: project.totalDuration,
        scenes: project.scenes.map((s) => ({
          number: s.number,
          title: s.title,
          description: s.description,
          visualPrompt: s.visualPrompt,
          durationSeconds: s.durationSeconds,
        })),
      },
      null,
      2
    );

    const blob = new Blob([scriptJson], { type: 'application/json' });
    saveAs(blob, `${project.title.replace(/\s+/g, '_')}_script.json`);
    toast.success('Pobrano scenariusz');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="py-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Nie znaleziono projektu</h2>
          <p className="text-gray-600 mb-4">
            Projekt o podanym ID nie istnieje lub zostal usuniety.
          </p>
          <Button onClick={() => navigate({ to: '/projects' })}>
            <ArrowLeft className="h-4 w-4" />
            Wroc do listy
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isGenerating =
    project.status === 'generating_script' || project.status === 'generating_images';
  const completedImages = project.scenes.filter((s) => s.imageStatus === 'completed').length;
  const hasImages = completedImages > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/projects' })}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Wroc do listy
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
          <p className="text-gray-600 mt-1">{project.theme}</p>
          <div className="flex items-center gap-3 mt-2">
            <Badge className={getStatusColor(project.status)}>
              {getStatusLabel(project.status)}
            </Badge>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDuration(project.totalDuration)}
            </span>
            <span className="text-sm text-gray-500">
              {project.scenes.length} scen
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Utworzono: {formatDate(project.createdAt)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Select
            id="model"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as 'flash' | 'pro')}
            options={[
              { value: 'flash', label: 'Flash' },
              { value: 'pro', label: 'Pro' },
            ]}
            className="w-24"
          />
          <Button
            onClick={handleGenerateAllImages}
            disabled={isGenerating}
            loading={generateImages.isPending}
          >
            <ImageIcon className="h-4 w-4" />
            Generuj obrazy
          </Button>
          <Button
            variant="secondary"
            onClick={() => regenerateScript.mutate({})}
            disabled={isGenerating}
            loading={regenerateScript.isPending}
          >
            <RefreshCw className="h-4 w-4" />
            Regeneruj
          </Button>
          {hasImages && (
            <>
              <Button variant="secondary" onClick={handleDownloadZip}>
                <Download className="h-4 w-4" />
                ZIP
              </Button>
              <Button variant="secondary" onClick={handleDownloadScript}>
                <FileText className="h-4 w-4" />
                JSON
              </Button>
            </>
          )}
          <Button
            variant="danger"
            onClick={() => {
              if (confirm('Czy na pewno chcesz usunac ten projekt?')) {
                deleteProject.mutate();
              }
            }}
            loading={deleteProject.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Generation progress */}
      <GenerationProgress
        status={project.status}
        completedScenes={completedImages}
        totalScenes={project.scenes.length}
      />

      {/* Original captions */}
      <Card>
        <CardHeader>
          <CardTitle>Oryginalny tekst</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 whitespace-pre-wrap">{project.captions}</p>
        </CardContent>
      </Card>

      {/* Scenes */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Sceny ({project.scenes.length})</h2>
        <ScriptEditor
          scenes={project.scenes}
          onUpdateScene={handleUpdateScene}
          onRegenerateImage={handleRegenerateImage}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  );
}
