'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import useMessaging, { type ChatMessageMetadata } from '@/hooks/use-messaging';
import { cn } from '@/lib/utils';
import {
  AlertTriangleIcon,
  ArrowUpIcon,
  GaugeCircleIcon,
  ImageUpIcon,
  ScrollTextIcon,
  Zap,
} from 'lucide-react';
import { useRef, useState } from 'react';

const PROMPTS = [
  {
    icon: ScrollTextIcon,
    text: 'Write documentation',
    prompt:
      'Write comprehensive documentation for this codebase, including setup instructions, API references, and usage examples.',
  },
  {
    icon: GaugeCircleIcon,
    text: 'Optimize performance',
    prompt:
      'Analyze the codebase for performance bottlenecks and suggest optimizations to improve loading times and runtime efficiency.',
  },
  {
    icon: AlertTriangleIcon,
    text: 'Find and fix 3 bugs',
    prompt:
      'Scan through the codebase to identify and fix 3 critical bugs, providing detailed explanations for each fix.',
  },
];

const TEMPERATURES = [
  {
    value: 'high',
    name: 'High',
    description: 'Creative and diverse responses',
  },
  {
    value: 'medium',
    name: 'Medium',
    description: 'Balanced responses',
  },
  {
    value: 'low',
    name: 'Low',
    description: 'Focused and deterministic responses',
  },
];

interface ChatFormProps {
  handleSendMessage: (
    message: string,
    metadata: ChatMessageMetadata,
  ) => Promise<void>;
}

export default function ChatForm({ handleSendMessage }: ChatFormProps) {
  const [inputValue, setInputValue] = useState('');
  const [selectedTemperature, setSelectedTemperature] = useState(
    TEMPERATURES[0],
  );
  const { sessionId, mutateSession } = useMessaging();

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handlePromptClick = (prompt: string) => {
    if (inputRef.current) {
      inputRef.current.value = prompt;
      setInputValue(prompt);
      inputRef.current.focus();
    }
  };

  const handleTemperatureChange = (value: string) => {
    const temperature = TEMPERATURES.find((m) => m.value === value);
    if (temperature) {
      setSelectedTemperature(temperature);
    }
  };

  const handleSend = async () => {
    if (inputValue.trim() === '') return;
    let _sessionId = sessionId;
    if (!_sessionId) {
      const result = await mutateSession.mutateAsync();
      _sessionId = result.id;
    }
    console.log('Sending message with session ID:', _sessionId);
    handleSendMessage(inputValue, { sessionId: _sessionId });
    setInputValue('');
  };

  const handleInputKeyDown = async (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      await handleSend();
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-3xl">
      <div className="flex min-h-[120px] flex-col rounded-2xl cursor-text bg-card border border-border shadow-lg">
        <div className="flex-1 relative overflow-y-auto max-h-[258px]">
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask anything"
            className="w-full border-0 p-3 transition-[padding] duration-200 ease-in-out min-h-[48.4px] outline-none text-[16px] text-foreground resize-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent! whitespace-pre-wrap wrap-break-word"
            onKeyDown={handleInputKeyDown}
          />
        </div>

        <div className="flex min-h-10 items-center gap-2 p-2 pb-1">
          <div className="flex aspect-1 items-center gap-1 rounded-full bg-muted p-1.5 text-xs">
            <Zap className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="relative flex items-center">
            <Select
              value={selectedTemperature.value}
              onValueChange={handleTemperatureChange}
            >
              <SelectTrigger className="w-fit border-none bg-transparent! p-0 text-sm text-muted-foreground hover:text-foreground focus:ring-0 shadow-none">
                <SelectValue>
                  <span>{selectedTemperature.name}</span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TEMPERATURES.map((temperature) => (
                  <SelectItem key={temperature.value} value={temperature.value}>
                    <span>{temperature.name}</span>
                    <span className="text-muted-foreground block text-xs">
                      {temperature.description}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground transition-colors duration-100 ease-out"
              title="Attach images"
              aria-label="Attach images"
            >
              <ImageUpIcon className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(
                'rounded-full transition-colors duration-100 ease-out cursor-pointer bg-primary',
                inputValue && 'bg-primary hover:bg-primary/90!',
              )}
              disabled={!inputValue}
              aria-label="Send message"
              onClick={handleSend}
            >
              <ArrowUpIcon className="h-4 w-4 text-primary-foreground" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {PROMPTS.map((button) => {
          const IconComponent = button.icon;
          return (
            <Button
              key={button.text}
              variant="ghost"
              className="group flex items-center gap-2 rounded-full border px-3 py-2 text-sm text-foreground transition-colors duration-200 ease-out hover:bg-muted/30 h-auto bg-transparent dark:bg-muted"
              onClick={() => handlePromptClick(button.prompt)}
            >
              <IconComponent className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
              <span>{button.text}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
