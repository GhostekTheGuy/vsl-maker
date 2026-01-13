import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useSettings, useSaveSettings, useValidateKeys } from '../hooks/useSettings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Slider } from '../components/ui/Slider';
import { Badge } from '../components/ui/Badge';
import { Settings, Key, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const saveSettings = useSaveSettings();
  const validateKeys = useValidateKeys();

  const [formData, setFormData] = useState({
    anthropicApiKey: '',
    nanobananaApiKey: '',
    defaultModel: 'flash' as 'flash' | 'pro',
    defaultNumScenes: 12,
  });

  const [keyStatus, setKeyStatus] = useState<{
    anthropic?: boolean;
    nanobanana?: boolean;
  }>({});

  useEffect(() => {
    if (settings) {
      setFormData((prev) => ({
        ...prev,
        defaultModel: settings.defaultModel,
        defaultNumScenes: settings.defaultNumScenes,
      }));
    }
  }, [settings]);

  const handleValidateKeys = async () => {
    const result = await validateKeys.mutateAsync({
      anthropicApiKey: formData.anthropicApiKey || undefined,
      nanobananaApiKey: formData.nanobananaApiKey || undefined,
    });

    setKeyStatus(result);

    if (result.anthropic && result.nanobanana) {
      toast.success('Oba klucze sa poprawne!');
    } else if (result.anthropic || result.nanobanana) {
      toast.success('Niektore klucze sa poprawne');
    } else {
      toast.error('Klucze sa niepoprawne');
    }
  };

  const handleSave = () => {
    const dataToSave: Record<string, unknown> = {
      defaultModel: formData.defaultModel,
      defaultNumScenes: formData.defaultNumScenes,
    };

    if (formData.anthropicApiKey) {
      dataToSave.anthropicApiKey = formData.anthropicApiKey;
    }
    if (formData.nanobananaApiKey) {
      dataToSave.nanobananaApiKey = formData.nanobananaApiKey;
    }

    saveSettings.mutate(dataToSave);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Ustawienia</h1>
      </div>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Klucze API
          </CardTitle>
          <CardDescription>
            Skonfiguruj klucze API dla Anthropic (Claude) i NanoBanana (obrazy)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current status */}
          <div className="flex gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Anthropic:</span>
              {settings?.hasAnthropicKey ? (
                <Badge variant="success">Skonfigurowany</Badge>
              ) : (
                <Badge variant="error">Brak</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">NanoBanana:</span>
              {settings?.hasNanobananaKey ? (
                <Badge variant="success">Skonfigurowany</Badge>
              ) : (
                <Badge variant="error">Brak</Badge>
              )}
            </div>
          </div>

          {/* Anthropic API Key */}
          <div className="relative">
            <Input
              id="anthropicApiKey"
              label="Anthropic API Key"
              type="password"
              placeholder="sk-ant-..."
              value={formData.anthropicApiKey}
              onChange={(e) =>
                setFormData({ ...formData, anthropicApiKey: e.target.value })
              }
            />
            {keyStatus.anthropic !== undefined && (
              <div className="absolute right-3 top-8">
                {keyStatus.anthropic ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            )}
          </div>

          {/* NanoBanana API Key */}
          <div className="relative">
            <Input
              id="nanobananaApiKey"
              label="NanoBanana API Key"
              type="password"
              placeholder="nb-..."
              value={formData.nanobananaApiKey}
              onChange={(e) =>
                setFormData({ ...formData, nanobananaApiKey: e.target.value })
              }
            />
            {keyStatus.nanobanana !== undefined && (
              <div className="absolute right-3 top-8">
                {keyStatus.nanobanana ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            )}
          </div>

          <Button
            variant="secondary"
            onClick={handleValidateKeys}
            disabled={!formData.anthropicApiKey && !formData.nanobananaApiKey}
            loading={validateKeys.isPending}
          >
            {validateKeys.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sprawdzanie...
              </>
            ) : (
              'Sprawdz klucze'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Default settings */}
      <Card>
        <CardHeader>
          <CardTitle>Domyslne ustawienia</CardTitle>
          <CardDescription>
            Ustaw domyslne wartosci dla nowych projektow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            id="defaultModel"
            label="Domyslny model generowania obrazow"
            value={formData.defaultModel}
            onChange={(e) =>
              setFormData({
                ...formData,
                defaultModel: e.target.value as 'flash' | 'pro',
              })
            }
            options={[
              { value: 'flash', label: 'Flash (szybszy, tanszy)' },
              { value: 'pro', label: 'Pro (lepsza jakosc)' },
            ]}
          />

          <Slider
            id="defaultNumScenes"
            label="Domyslna liczba scen"
            min={10}
            max={15}
            step={1}
            value={formData.defaultNumScenes}
            onChange={(e) =>
              setFormData({
                ...formData,
                defaultNumScenes: parseInt(e.target.value),
              })
            }
          />
        </CardContent>
      </Card>

      {/* Save button */}
      <Button
        onClick={handleSave}
        loading={saveSettings.isPending}
        className="w-full"
        size="lg"
      >
        Zapisz ustawienia
      </Button>
    </div>
  );
}
