import { useEffect, useRef, useState } from "react";

/**
 * Single digit slot that scrolls through numbers
 */
function SlotDigit({ digit, duration, delay }) {
  const [offset, setOffset] = useState(100);

  useEffect(() => {
    // Small delay then animate to final position
    const timer = setTimeout(() => {
      setOffset(0);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  // Calculate which digit to show based on scroll position
  const targetDigit = parseInt(digit, 10);

  return (
    <span
      style={{
        display: "inline-block",
        height: "1.2em",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <span
        style={{
          display: "block",
          transform: `translateY(-${targetDigit * 10 + offset}%)`,
          transition: `transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span key={n} style={{ display: "block", height: "1.2em", lineHeight: "1.2em" }}>
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}

/**
 * AnimatedCounter component
 * Displays each digit scrolling up like a slot machine / Robinhood style
 */
function AnimatedCounter({ value, duration = 1000 }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    // Trigger animation on mount
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const target = typeof value === "number" ? value : 0;
  const numStr = target.toLocaleString();
  const chars = numStr.split("");

  if (!isVisible) {
    // Show placeholder to prevent layout shift
    return <span style={{ opacity: 0 }}>{numStr}</span>;
  }

  return (
    <span style={{ display: "inline-flex" }}>
      {chars.map((char, i) => {
        // Check if it's a digit or separator (comma, period)
        if (char >= "0" && char <= "9") {
          // Stagger the animation - rightmost digits animate faster
          const digitDelay = (chars.length - 1 - i) * 50;
          return (
            <SlotDigit
              key={i}
              digit={char}
              duration={duration}
              delay={digitDelay}
            />
          );
        }
        // Non-digit characters (commas, etc)
        return (
          <span key={i} style={{ display: "inline-block" }}>
            {char}
          </span>
        );
      })}
    </span>
  );
}

export default AnimatedCounter;
