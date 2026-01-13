import { Loader2 } from 'lucide-react';

interface GenerationProgressProps {
  completedScenes: number;
  totalScenes: number;
  status: string;
}

export function GenerationProgress({
  completedScenes,
  totalScenes,
  status,
}: GenerationProgressProps) {
  const progress = totalScenes > 0 ? (completedScenes / totalScenes) * 100 : 0;

  const getStatusText = () => {
    if (status === 'generating_script') {
      return 'Generowanie scenariusza...';
    }
    if (status === 'generating_images') {
      return `Generowanie obrazow: ${completedScenes} / ${totalScenes}`;
    }
    return '';
  };

  if (status !== 'generating_script' && status !== 'generating_images') {
    return null;
  }

  return (
    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
        <span className="font-medium text-primary-900">{getStatusText()}</span>
      </div>

      {status === 'generating_images' && (
        <div className="w-full bg-primary-200 rounded-full h-2.5">
          <div
            className="bg-primary-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
