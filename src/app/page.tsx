'use client';

import { useChat } from '@ai-sdk/react';
import { useRef, useState } from 'react';
import { Paperclip } from 'lucide-react';

export default function Chat() {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<FileList | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { messages, sendMessage } = useChat({
    maxSteps: 5,
  });

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
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
                  return <img key={i} src={part.url} alt={part.filename} />;
                }
                return <pre key={i}>{part.filename}</pre>
            }
          })}
        </div>
      ))}


      <form
        className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();

          sendMessage({ text: input, files: files });
          setInput('');
          setFiles(undefined);

          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
      >
        {/* Paperclip button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded hover:bg-zinc-800 transition"
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

        {/* Chat input */}
        <input
          className="flex-1 p-2 rounded bg-zinc-800 border border-zinc-700 text-white"
          value={input}
          placeholder="Say something..."
          onChange={(e) => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
  );
}