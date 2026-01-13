import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useSettings } from '../hooks/useSettings';
import { useCreateProject } from '../hooks/useGenerateScript';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Slider } from '../components/ui/Slider';
import { CaptionsInput } from '../components/CaptionsInput';
import { AlertCircle, Sparkles } from 'lucide-react';

export const Route = createFileRoute('/create')({
  component: CreatePage,
});

function CreatePage() {
  const navigate = useNavigate();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const createProject = useCreateProject();

  const [formData, setFormData] = useState({
    captions: '',
    numScenes: 12,
    styleHints: '',
    referenceImageUrl: '',
    model: 'flash' as 'flash' | 'pro',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};

    if (formData.captions.length < 50) {
      newErrors.captions = 'Tekst musi miec co najmniej 50 znakow';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    createProject.mutate({
      captions: formData.captions,
      numScenes: formData.numScenes,
      styleHints: formData.styleHints || undefined,
      referenceImageUrl: formData.referenceImageUrl || undefined,
      model: formData.model,
    });
  };

  // Check if API keys are configured
  const hasKeys = settings?.hasAnthropicKey;

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!hasKeys) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Skonfiguruj klucze API</h2>
          <p className="text-gray-600 mb-4">
            Aby korzystac z generatora, musisz najpierw skonfigurowac klucze API.
          </p>
          <Button onClick={() => navigate({ to: '/settings' })}>
            Przejdz do ustawien
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary-600" />
            Stworz nowa rolke
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Captions */}
            <CaptionsInput
              value={formData.captions}
              onChange={(value) => setFormData({ ...formData, captions: value })}
              error={errors.captions}
            />

            {/* Number of scenes */}
            <Slider
              id="numScenes"
              label="Liczba scen"
              min={10}
              max={15}
              step={1}
              value={formData.numScenes}
              onChange={(e) =>
                setFormData({ ...formData, numScenes: parseInt(e.target.value) })
              }
            />

            {/* Style hints */}
            <Input
              id="styleHints"
              label="Wskazowki stylistyczne (opcjonalnie)"
              placeholder="np. minimalistyczny, ciemne kolory, futurystyczny..."
              value={formData.styleHints}
              onChange={(e) =>
                setFormData({ ...formData, styleHints: e.target.value })
              }
            />

            {/* Reference image URL */}
            <Input
              id="referenceImageUrl"
              label="URL obrazu referencyjnego (opcjonalnie)"
              placeholder="https://example.com/image.jpg"
              type="url"
              value={formData.referenceImageUrl}
              onChange={(e) =>
                setFormData({ ...formData, referenceImageUrl: e.target.value })
              }
            />

            {/* Model selection */}
            <Select
              id="model"
              label="Model generowania obrazow"
              value={formData.model}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  model: e.target.value as 'flash' | 'pro',
                })
              }
              options={[
                { value: 'flash', label: 'Flash (szybszy)' },
                { value: 'pro', label: 'Pro (lepsza jakosc)' },
              ]}
            />

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={createProject.isPending}
            >
              <Sparkles className="h-5 w-5" />
              Generuj scenariusz
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
