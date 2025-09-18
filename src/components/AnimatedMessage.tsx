import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AnimatedMessageProps {
  content: string;
  isStreaming?: boolean;
  className?: string;
}

export const AnimatedMessage = ({ content, isStreaming = false, className = "" }: AnimatedMessageProps) => {
  const [displayedContent, setDisplayedContent] = useState("");
  const [showCursor, setShowCursor] = useState(false);

  useEffect(() => {
    if (isStreaming && content) {
      setShowCursor(true);
      let currentIndex = 0;
      
      const interval = setInterval(() => {
        if (currentIndex <= content.length) {
          setDisplayedContent(content.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(interval);
          setShowCursor(false);
        }
      }, 30); // Скорость печати

      return () => clearInterval(interval);
    } else {
      setDisplayedContent(content);
      setShowCursor(false);
    }
  }, [content, isStreaming]);

  return (
    <div className={className}>
      <span>{displayedContent}</span>
      <AnimatePresence>
        {showCursor && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ repeat: Infinity, duration: 0.8, repeatType: "reverse" }}
            className="inline-block w-2 h-5 bg-primary ml-1 align-text-bottom"
          />
        )}
      </AnimatePresence>
    </div>
  );
};