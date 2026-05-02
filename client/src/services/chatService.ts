// Chat service - streaming AI chat via our own backend server

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface StreamChatOptions {
  messages: Array<{ role: 'user' | 'assistant'; content: string; images?: string[] }>;
  memoryContext?: string;  // Long-term memory context to inject into system prompt
  onDelta: (text: string) => void;
  onSources?: (sources: Array<{ title: string; link: string; snippet: string }>) => void;
  onDone: () => void;
  onError: (error: string) => void;
  signal?: AbortSignal;
}

export async function streamChat({ messages, memoryContext, onDelta, onSources, onDone, onError, signal }: StreamChatOptions): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, memoryContext }),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 429) {
        onError('Hệ thống đang quá tải, vui lòng thử lại sau.');
        return;
      }
      if (response.status === 402) {
        onError('Đã hết hạn mức sử dụng AI. Vui lòng liên hệ quản trị viên.');
        return;
      }
      onError(errorData.error || 'Đã xảy ra lỗi khi kết nối với AI.');
      return;
    }

    if (!response.body) {
      onError('Không nhận được phản hồi từ server.');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let sourcesReceived = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;

        // Check for sources event
        if (line.startsWith('event: sources')) {
          continue;
        }

        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();

        if (jsonStr === '[DONE]') break;

        try {
          const parsed = JSON.parse(jsonStr);

          // Handle sources
          if (parsed.sources && !sourcesReceived) {
            sourcesReceived = true;
            onSources?.(parsed.sources);
            continue;
          }

          // Handle errors from stream
          if (parsed.error) {
            onError(parsed.error);
            return;
          }

          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch {
          // Partial JSON, keep buffering
          buffer = line + '\n' + buffer;
          break;
        }
      }
    }

    // Flush remaining
    if (buffer.trim()) {
      for (let raw of buffer.split('\n')) {
        if (!raw) continue;
        if (raw.endsWith('\r')) raw = raw.slice(0, -1);
        if (!raw.startsWith('data: ')) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch { /* ignore */ }
      }
    }

    onDone();
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      onDone();
      return;
    }
    onError(err instanceof Error ? err.message : 'Lỗi không xác định');
  }
}
