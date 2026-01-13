interface SubmitGenerationParams {
  prompt: string;
  model: 'flash' | 'pro';
  referenceImageUrls?: string[];
  aspectRatio?: string;
}

interface TaskStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  imageUrl?: string;
  error?: string;
}

export class NanoBananaService {
  private baseUrl = 'https://api.nanobananaapi.ai/api/v1/nanobanana';

  constructor(private apiKey: string) {}

  async submitGeneration(params: SubmitGenerationParams): Promise<string> {
    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        prompt: params.prompt,
        model: params.model,
        reference_image_urls: params.referenceImageUrls,
        aspect_ratio: params.aspectRatio || '9:16', // Vertical for reels
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`NanoBanana API error: ${error}`);
    }

    const data = await response.json();
    return data.task_id;
  }

  async checkTaskStatus(taskId: string): Promise<TaskStatus> {
    const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`NanoBanana API error: ${error}`);
    }

    const data = await response.json();

    return {
      status: data.status,
      imageUrl: data.image_url,
      error: data.error,
    };
  }

  async waitForImage(taskId: string, timeoutMs: number = 120000): Promise<string> {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    while (Date.now() - startTime < timeoutMs) {
      const status = await this.checkTaskStatus(taskId);

      if (status.status === 'completed' && status.imageUrl) {
        return status.imageUrl;
      }

      if (status.status === 'failed') {
        throw new Error(status.error || 'Image generation failed');
      }

      await this.sleep(pollInterval);
    }

    throw new Error('Image generation timed out');
  }

  async validateApiKey(): Promise<boolean> {
    try {
      // Try a minimal request to validate the key
      const response = await fetch(`${this.baseUrl}/balance`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
