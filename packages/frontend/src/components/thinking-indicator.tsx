import { useEffect, useState } from 'react';

const ROTATE_INTERVAL_MS = 4000;

const THINKING_MESSAGES = [
  'Thinking...',
  'Searching the docs...',
  'Reading Unity references...',
  'Fetching relevant sections...',
  'Analyzing your question...',
  'Gathering context...',
  'Cross-referencing sources...',
];

const ThinkingIndicator = () => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const fade = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % THINKING_MESSAGES.length);
        setVisible(true);
      }, 300);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(fade);
  }, []);

  return (
    <div className="flex px-4">
      <div
        className="font-semibold max-w-[72%] bg-muted/40 border border-border/20 px-4 py-2 rounded-2xl rounded-bl-sm text-sm leading-relaxed text-muted-foreground transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {THINKING_MESSAGES[index]}
      </div>
    </div>
  );
};

export default ThinkingIndicator;
