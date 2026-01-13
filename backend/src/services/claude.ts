import Anthropic from '@anthropic-ai/sdk';

interface GeneratedScene {
  number: number;
  title: string;
  description: string;
  visual_prompt: string;
  duration_seconds: number;
}

interface GeneratedScript {
  title: string;
  theme: string;
  total_duration: number;
  scenes: GeneratedScene[];
}

export class ClaudeService {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generateScript(params: {
    captions: string;
    numScenes: number;
    styleHints?: string;
  }): Promise<{
    title: string;
    theme: string;
    totalDuration: number;
    scenes: Array<{
      number: number;
      title: string;
      description: string;
      visualPrompt: string;
      durationSeconds: number;
    }>;
  }> {
    const prompt = this.buildPrompt(params);

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Claude response');
    }

    const parsed: GeneratedScript = JSON.parse(jsonMatch[0]);

    return {
      title: parsed.title,
      theme: parsed.theme,
      totalDuration: parsed.total_duration,
      scenes: parsed.scenes.map((scene) => ({
        number: scene.number,
        title: scene.title,
        description: scene.description,
        visualPrompt: scene.visual_prompt,
        durationSeconds: scene.duration_seconds,
      })),
    };
  }

  private buildPrompt(params: { captions: string; numScenes: number; styleHints?: string }): string {
    const styleSection = params.styleHints ? `\nSTYL/WSKAZÓWKI: ${params.styleHints}` : '';

    return `Jesteś ekspertem od tworzenia scenariuszy do krótkich filmów (reels/TikTok).

Na podstawie poniższego tekstu/captions stwórz szczegółowy scenariusz składający się z ${params.numScenes} scen.

TEKST WEJŚCIOWY:
${params.captions}
${styleSection}

Dla każdej sceny podaj:
1. Numer sceny
2. Tytuł sceny (krótki, opisowy)
3. Opis narracyjny (co się dzieje, jaki jest przekaz)
4. BARDZO SZCZEGÓŁOWY prompt wizualny do wygenerowania obrazu AI (w języku angielskim, 2-3 zdania opisujące kompozycję, kolory, styl, nastrój, elementy wizualne)
5. Sugerowany czas trwania w sekundach (całość powinna trwać 30-60 sekund)

Odpowiedz TYLKO w formacie JSON:
{
    "title": "Tytuł rolki",
    "theme": "Główny temat/przesłanie",
    "total_duration": liczba_sekund,
    "scenes": [
        {
            "number": 1,
            "title": "Tytuł sceny",
            "description": "Opis narracyjny po polsku",
            "visual_prompt": "Detailed English prompt for AI image generation...",
            "duration_seconds": 3.5
        }
    ]
}

Pamiętaj:
- Visual prompt MUSI być po angielsku i bardzo szczegółowy
- Sceny powinny tworzyć spójną narrację wizualną
- Unikaj tekstu na obrazach (AI słabo go generuje)
- Każda scena powinna być możliwa do wizualizacji`;
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hello' }],
      });
      return true;
    } catch {
      return false;
    }
  }
}
