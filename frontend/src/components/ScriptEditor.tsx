import { useState } from 'react';
import { SceneCard } from './SceneCard';
import { ImagePreview } from './ImagePreview';
import type { Scene } from '../types';

interface ScriptEditorProps {
  scenes: Scene[];
  onUpdateScene: (sceneId: string, data: Partial<Scene>) => void;
  onRegenerateImage: (sceneId: string) => void;
  isGenerating: boolean;
}

export function ScriptEditor({
  scenes,
  onUpdateScene,
  onRegenerateImage,
  isGenerating,
}: ScriptEditorProps) {
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  return (
    <>
      <div className="space-y-4">
        {scenes.map((scene) => (
          <SceneCard
            key={scene.id}
            scene={scene}
            onEdit={(data) => onUpdateScene(scene.id, data)}
            onRegenerateImage={() => onRegenerateImage(scene.id)}
            isGenerating={isGenerating}
            onImageClick={() => {
              if (scene.imageUrl) {
                setPreviewImage({ url: scene.imageUrl, title: scene.title });
              }
            }}
          />
        ))}
      </div>

      {previewImage && (
        <ImagePreview
          imageUrl={previewImage.url}
          title={previewImage.title}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </>
  );
}
