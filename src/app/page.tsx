'use client';

import { useChat } from '@ai-sdk/react';
import { useRef, useState } from 'react';
import { Paperclip } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Chat() {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<FileList | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSending, setIsSending] = useState(false);

  const { messages, sendMessage } = useChat({
    maxSteps: 5,
  });

  return (
    <div className="flex flex-col w-full max-w-md py-24 pb-40 mx-auto stretch overflow-y-auto">
      {/* Render chat messages */}
      {messages.map((message) => (
        <div key={message.id} className="whitespace-pre-wrap mb-4">
          <div className='font-bold'>
            {message.role === 'user' ? 'User: ' : 'Livia: '}
          </div>

          {message.parts.map((part, i) => {
            switch (part.type) {
              case 'text':
                return <div key={i}>{part.text}</div>;
              case 'file':
                if (
                  part.type === 'file' &&
                  part.mediaType?.startsWith('image/')
                ) {
                  return <img key={i} src={part.url} alt={part.filename} className='rounded-2xl m-1' />;
                }
                return <pre key={i}>{part.filename}</pre>
              case 'tool-weather':
              case 'tool-convertFahrenheitToCelsius':
              case 'tool-reviewClaim':
              case 'tool-convertCurrency':
              case 'tool-verifyCustomer':
                return (
                  <Card>
                    <CardHeader>
                      <CardTitle className="capitalize">{part.type}</CardTitle>
                      <CardDescription className="break-all">{part.toolCallId}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">Input</div>
                        <pre className="rounded bg-muted p-4 text-sm font-mono whitespace-pre-wrap break-words">
                          {JSON.stringify(part.input, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">Output</div>
                        <pre className="rounded bg-muted p-4 text-sm font-mono whitespace-pre-wrap break-words">
                          {JSON.stringify(part.output, null, 2)}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                );
            }
          })}
        </div>
      ))}


      {/* Chat input + submit */}
      <form
        className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-4 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl flex flex-col gap-2"
        onSubmit={async (e) => {
          e.preventDefault();

          if (!input.trim() || isSending) return;

          setIsSending(true);
          setInput('');

          await sendMessage({ text: input, files });
          setFiles(undefined);
          setIsSending(false);

          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
      >
        {/* File button + badge */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative p-2 rounded hover:bg-zinc-800 transition"
            title="Attach files"
          >
            <Paperclip />
            {files && files.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {files.length}
              </span>
            )}
          </button>

          {/* Hidden file input */}
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files) {
                setFiles(e.target.files);
              }
            }}
            className="hidden"
          />

          <span className="text-sm text-zinc-500">
            {isSending ? 'Sending...' : ''}
          </span>
        </div>

        {/* Growing text area */}
        <textarea
          rows={1}
          value={input}
          placeholder="Type a message..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (!isSending && input.trim()) {
                e.currentTarget.form?.requestSubmit();
              }
            }
          }}
          className="resize-none w-full p-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white max-h-40 overflow-y-auto"
        />
      </form>
    </div>
  );
}