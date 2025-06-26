"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { Progress } from "@components/ui/progress";

interface LoadingIndicatorProps {
  isVisible: boolean;
  onComplete?: () => void;
  inDrawer?: boolean;
}

export function LoadingIndicator({
  isVisible,
  onComplete: _onComplete,
  inDrawer = false,
}: Readonly<LoadingIndicatorProps>) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    "Uploading receipts...",
    "Analyzing with AI...",
    "Extracting line items...",
    "Processing data...",
    "Almost done...",
  ];

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setCurrentStep(0);
      return;
    }

    // More realistic timing for AI processing
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          // Slow down near the end to simulate real processing
          return prev + Math.random() * 2 + 0.5;
        }
        if (prev >= 80) {
          return prev + Math.random() * 3 + 1;
        }
        if (prev >= 50) {
          return prev + Math.random() * 5 + 2;
        }
        return prev + Math.random() * 8 + 3; // Faster at the beginning
      });
    }, 1000); // Slower updates for more realistic feel

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(stepInterval);
          return steps.length - 1;
        }
        return prev + 1;
      });
    }, 3000); // Longer intervals between steps

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, [isVisible, steps.length]);

  if (!isVisible) return null;

  const positioningClass = inDrawer
    ? "absolute bottom-0 left-0 right-0 z-50 border-t border-green-200 bg-white/95 shadow-lg backdrop-blur-sm"
    : "fixed bottom-0 left-0 right-0 z-50 border-t border-green-200 bg-white/95 shadow-lg backdrop-blur-sm";

  return (
    <div className={positioningClass}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-green-600">
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span className="text-sm font-medium">AI Processing</span>
          </div>
          <div className="flex-1">
            <Progress value={progress} className="h-2" />
          </div>
          <div className="text-sm font-medium text-green-600">{Math.round(progress)}%</div>
        </div>
        <div className="mt-2 text-sm text-gray-600">{steps[currentStep]}</div>
      </div>
    </div>
  );
}
