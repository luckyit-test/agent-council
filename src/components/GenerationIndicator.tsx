import { motion } from 'framer-motion';
import { Loader2, Brain, Sparkles, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface GenerationIndicatorProps {
  isGenerating: boolean;
  isTyping: boolean;
  elapsedTime: number;
  providerIcon?: React.ReactNode;
}

export const GenerationIndicator = ({ 
  isGenerating, 
  isTyping, 
  elapsedTime,
  providerIcon 
}: GenerationIndicatorProps) => {
  if (!isGenerating && !isTyping) return null;

  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex justify-start mb-4"
    >
      <Card className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <div className="flex items-center gap-3">
          {/* Animated icon */}
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1, repeat: Infinity }
            }}
            className="text-primary"
          >
            {providerIcon || <Brain className="w-5 h-5" />}
          </motion.div>

          {/* Status text with animated dots */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {isTyping ? 'Агент думает' : 'Генерирую ответ'}
            </span>
            
            <motion.div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 h-1 bg-primary rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </motion.div>
          </div>

          {/* Timer */}
          {elapsedTime > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full"
            >
              {formatElapsedTime(elapsedTime)}
            </motion.div>
          )}

          {/* Animated particles */}
          <div className="relative">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-primary/40 rounded-full"
                animate={{
                  y: [-10, -20, -10],
                  x: [0, Math.sin(i) * 10, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3
                }}
                style={{
                  left: i * 8,
                  top: 0
                }}
              />
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};