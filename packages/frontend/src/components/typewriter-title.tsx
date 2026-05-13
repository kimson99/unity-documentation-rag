import { useEffect, useRef, useState } from 'react';

interface TypewriterTitleProps {
  title: string | null;
  speed?: number;
}

export function TypewriterTitle({ title, speed = 40 }: TypewriterTitleProps) {
  const [displayed, setDisplayed] = useState(title ?? '');
  const prevTitleRef = useRef(title);

  useEffect(() => {
    const prev = prevTitleRef.current;
    prevTitleRef.current = title;

    if (!title) {
      setDisplayed('');
      return;
    }

    if (!prev || prev === title) {
      setDisplayed(title);
      return;
    }

    setDisplayed('');
    let i = 0;
    const timer = setInterval(() => {
      setDisplayed(title.substring(0, ++i));
      if (i >= title.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [title, speed]);

  return <span>{displayed}</span>;
}
