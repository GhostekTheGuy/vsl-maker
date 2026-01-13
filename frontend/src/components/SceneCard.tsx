import { useState } from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { Badge } from './ui/Badge';
import { formatDuration } from '../lib/utils';
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  RefreshCw,
  Clock,
  Check,
  X,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { Scene } from '../types';

interface SceneCardProps {
  scene: Scene;
  onEdit: (data: Partial<Scene>) => void;
  onRegenerateImage: () => void;
  isGenerating: boolean;
  onImageClick?: () => void;
}

export function SceneCard({
  scene,
  onEdit,
  onRegenerateImage,
  isGenerating,
  onImageClick,
}: SceneCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    description: scene.description,
    visualPrompt: scene.visualPrompt,
    durationSeconds: scene.durationSeconds,
  });

  const handleSave = () => {
    onEdit(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      description: scene.description,
      visualPrompt: scene.visualPrompt,
      durationSeconds: scene.durationSeconds,
    });
    setIsEditing(false);
  };

  const getStatusBadge = () => {
    switch (scene.imageStatus) {
      case 'completed':
        return <Badge variant="success">Gotowy</Badge>;
      case 'generating':
        return <Badge variant="warning">Generowanie...</Badge>;
      case 'error':
        return <Badge variant="error">Blad</Badge>;
      default:
        return <Badge variant="default">Oczekuje</Badge>;
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex">
        {/* Image section */}
        <div
          className="w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 bg-gray-100 relative cursor-pointer"
          onClick={onImageClick}
        >
          {scene.imageStatus === 'generating' ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : scene.imageUrl ? (
            <img
              src={scene.imageUrl}
              alt={scene.title}
              className="w-full h-full object-cover"
            />
          ) : scene.imageStatus === 'error' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500">
              <AlertCircle className="h-8 w-8" />
              <span className="text-xs mt-1">Blad</span>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
              <ImageIcon className="h-8 w-8" />
              <span className="text-xs mt-1">Brak obrazu</span>
            </div>
          )}
        </div>

        {/* Content section */}
        <CardContent className="flex-1 p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-primary-600">#{scene.number}</span>
                <h4 className="font-semibold text-gray-900">{scene.title}</h4>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge()}
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(scene.durationSeconds)}
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                disabled={isGenerating}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRegenerateImage}
                disabled={isGenerating}
                loading={scene.imageStatus === 'generating'}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                label="Opis (PL)"
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={2}
              />
              <Textarea
                label="Visual Prompt (EN)"
                value={editData.visualPrompt}
                onChange={(e) => setEditData({ ...editData, visualPrompt: e.target.value })}
                rows={3}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave}>
                  <Check className="h-4 w-4" />
                  Zapisz
                </Button>
                <Button size="sm" variant="secondary" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                  Anuluj
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-700 line-clamp-2">{scene.description}</p>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 mt-2 text-xs text-primary-600 hover:text-primary-700"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    Zwiń prompt
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    Pokaz prompt
                  </>
                )}
              </button>

              {isExpanded && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                  <p className="font-medium mb-1">Visual Prompt:</p>
                  <p>{scene.visualPrompt}</p>
                </div>
              )}

              {scene.errorMessage && (
                <p className="mt-2 text-xs text-red-600">{scene.errorMessage}</p>
              )}
            </>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
