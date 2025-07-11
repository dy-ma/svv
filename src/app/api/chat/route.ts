import { openai } from '@ai-sdk/openai';
import {
  streamText,
  UIMessage,
  convertToModelMessages,
} from 'ai';

export const maxDuration = 30;

export function logMessages(messages: UIMessage[]) {
  // Strip file blobs for readability
  const safeMessages = messages.map((msg) => ({
    ...msg,
    parts: msg.parts.map((part) => {
      if (part.type === 'file') {
        return {
          ...part,
          url: '[Redacted]'
        }
      }
      return part
    })
  }))

  console.log(JSON.stringify(safeMessages, null, 2))
  return
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}