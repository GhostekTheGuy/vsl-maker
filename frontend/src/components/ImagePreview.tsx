import { X, Download } from 'lucide-react';
import { Button } from './ui/Button';

interface ImagePreviewProps {
  imageUrl: string;
  title: string;
  onClose: () => void;
}

export function ImagePreview({ imageUrl, title, onClose }: ImagePreviewProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-12 right-0 flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Pobierz
          </Button>
          <Button variant="secondary" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
        />
        <p className="text-white text-center mt-2">{title}</p>
      </div>
    </div>
  );
}
