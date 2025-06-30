import { useEffect, useState, useRef, useLayoutEffect } from "react";
import "./Technologies.css";
import SectionService from "../../services/SectionService";
import LoadingSpinner from "../LoadingSpinner";
import type { Section } from "../../types/Section";
import initSequence from "./InitializationSequence.txt?raw";
import TechnologyService from "../../services/TechnologyService";

/**
 * Technologies Component
 * ----------------------
 * Terminal-like UI
 */

/* -----------------------------------------------------------
 * Terminal-like Technologies component
 * -----------------------------------------------------------
 * Structure
 *  ┌───────────────────────────────────────────────┐
 *  │ output (scrollable, grows upward)            │
 *  │ prompt-line →  EXO> _ (input + blinking)      │
 *  └───────────────────────────────────────────────┘
 */

interface OutputLine {
  id: number;
  text: string;
  isInitLine?: boolean;
}

// Utility sleep helper
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const Technologies = () => {
  /* ------------------------------
   * State / refs
   * ----------------------------*/
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [promptEnabled, setPromptEnabled] = useState(false);

  const outputEndRef = useRef<HTMLDivElement>(null);
  // Container that controls scrolling (no native scrollbar displayed)
  const outputContainerRef = useRef<HTMLDivElement>(null);
  // Track which line should be at the top of the visible area
  const topVisibleLineRef = useRef<number>(0);
  const initRan = useRef(false);

  /* ------------------------------
   * Effects
   * ----------------------------*/
  // Helper to scroll to a specific line index (making it the top visible line)
  const scrollToLine = (lineIndex: number) => {
    if (!outputContainerRef.current) return;
    
    const maxLine = Math.max(0, output.length - 1);
    const clampedIndex = Math.max(0, Math.min(maxLine, lineIndex));
    
    const lineElement = outputContainerRef.current.querySelector(
      `[data-line-index="${clampedIndex}"]`
    ) as HTMLElement;
    
    if (lineElement) {
      lineElement.scrollIntoView({ 
        behavior: "auto", 
        block: "start" 
      });
      topVisibleLineRef.current = clampedIndex;
    }
  };

  // Helper to scroll by a number of lines relative to current position
  const scrollByLines = (count: number) => {
    scrollToLine(topVisibleLineRef.current + count);
  };

  // Update top visible line when user scrolls manually
  useEffect(() => {
    const container = outputContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Find which line is currently at the top
      const containerRect = container.getBoundingClientRect();
      const lines = container.querySelectorAll('[data-line-index]');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i] as HTMLElement;
        const lineRect = line.getBoundingClientRect();
        
        if (lineRect.top >= containerRect.top - 1) { // -1 for floating point precision
          const lineIndex = parseInt(line.getAttribute('data-line-index') || '0');
          topVisibleLineRef.current = lineIndex;
          return;
        }
      }
      
      // If no line is found (e.g., we're at the bottom), set to last line
      if (lines.length > 0) {
        const lastLine = lines[lines.length - 1] as HTMLElement;
        const lineIndex = parseInt(lastLine.getAttribute('data-line-index') || '0');
        topVisibleLineRef.current = lineIndex;
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [output]);

  // Scroll to bottom whenever output grows (e.g. new command responses)
  useLayoutEffect(() => {
    const container = outputContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
      // Update our tracking to reflect we're at the bottom
      setTimeout(() => {
        container.dispatchEvent(new Event('scroll'));
      }, 0);
    }
  }, [output]);

  // Wheel scrolling – move exactly one line per wheel event
  useEffect(() => {
    const container = outputContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      const direction = e.deltaY > 0 ? 1 : -1;

      const atTop = container.scrollTop <= 0 && direction < 0;

      if (atTop) {
        // Allow event to bubble so Home.tsx can handle viewport hide
        return;
      }

      // For all other cases, handle internally
      e.preventDefault();
      e.stopPropagation();

      // Calculate current position more reliably
      const containerRect = container.getBoundingClientRect();
      const lines = container.querySelectorAll('[data-line-index]');
      let currentTopLine = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i] as HTMLElement;
        const lineRect = line.getBoundingClientRect();

        if (lineRect.top >= containerRect.top - 1) {
          currentTopLine = parseInt(line.getAttribute('data-line-index') || '0');
          break;
        }
        if (lineRect.bottom > containerRect.top) {
          currentTopLine = Math.max(0, parseInt(line.getAttribute('data-line-index') || '0'));
          break;
        }
      }

      // At bottom guard
      if (direction > 0) {
        const isAtBottom = container.scrollTop >= container.scrollHeight - container.clientHeight - 1;
        if (isAtBottom) return;
      }

      const targetLine = currentTopLine + direction;
      scrollToLine(targetLine);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [output, outputContainerRef.current]);

  // Touch scrolling for mobile – swipe up / down per line
  useEffect(() => {
    const container = outputContainerRef.current;
    if (!container) return;

    let startY = 0;
    let hasMoved = false;

    const onStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      hasMoved = false;
    };

    const onMove = (e: TouchEvent) => {
      // Move one line per 50px of touch movement
      if (Math.abs(e.touches[0].clientY - startY) >= 50 && !hasMoved) {
        const direction = e.touches[0].clientY > startY ? 1 : -1;
        scrollByLines(direction);
        hasMoved = true;
      }
    };

    container.addEventListener("touchstart", onStart);
    container.addEventListener("touchmove", onMove);
    return () => {
      container.removeEventListener("touchstart", onStart);
      container.removeEventListener("touchmove", onMove);
    };
  }, [outputContainerRef.current]);

  // Ensure selected line stays within visible window when navigating with arrows
  useEffect(() => {
    if (
      selectedIndex === null ||
      !outputContainerRef.current
    ) {
      return;
    }

    // Scroll the selected line into view
    const selectedElement = outputContainerRef.current.querySelector(
      `[data-line-index="${selectedIndex}"]`
    ) as HTMLElement;
    
    if (selectedElement) {
      selectedElement.scrollIntoView({ 
        behavior: "auto", 
        block: "nearest" 
      });
    }
  }, [selectedIndex]);

  // Key events for prompt input & selection navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!promptEnabled) return;
      if (e.key === "ArrowUp") {
        const atTop =
          outputContainerRef.current?.scrollTop === 0 &&
          (selectedIndex === null || selectedIndex === 0);

        if (atTop) {
          // Dispatch synthetic wheel-up event so Home.tsx reacts consistently
          window.dispatchEvent(new WheelEvent("wheel", { deltaY: -100 }));
          return; // allow default
        }

        // Navigate selection up
        setSelectedIndex((prev) => {
          if (prev === null) return output.length - 1;
          return Math.max(0, prev - 1);
        });
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        setSelectedIndex((prev) => {
          if (prev === null) return 0;
          return Math.min(output.length - 1, prev + 1);
        });
        e.preventDefault();
      } else if (e.key === "Backspace") {
        setCurrentInput((prev) => prev.slice(0, -1));
        e.preventDefault();
      } else if (e.key === "Enter") {
        if (currentInput.trim() !== "") {
          executeCommand(currentInput.trim());
        }
        e.preventDefault();
      } else if (e.key.length === 1) {
        // Regular character
        setCurrentInput((prev) => prev + e.key);
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentInput, output.length, promptEnabled]);

  /* ------------------------------
   * Command execution stub
   * ----------------------------*/
  const executeCommand = async (cmd: string) => {
    const idBase = Date.now();
    setOutput((prev) => [...prev, { id: idBase, text: `EXO> ${cmd}` }]);

    // Placeholder responses until actual logic is defined
    let responseLines: string[];
    if (cmd.toLowerCase() === "exo") {
      await playInit(false);
      setCurrentInput("");
      return;
    } else if (cmd.toLowerCase() === "technologies") {
      try {
        const techResp = await TechnologyService.getAllTechnologies(
          0,
          100,
          "name",
          "asc"
        );
        const techNames = techResp.content.map((t) => t.name);
        const sorted = [...techNames].sort((a, b) => a.localeCompare(b));
        responseLines = sorted.map((name, idx) => `${idx + 1}. ${name}`);
      } catch (err) {
        console.error("Failed to fetch technologies", err);
        responseLines = ["Error: unable to fetch technologies"];
      }
    } else {
      switch (cmd.toLowerCase()) {
        case "help":
          responseLines = [
            "Available commands:",
            "  help      – display this message",
            "  clear     – clear the screen",
            "  technologies  – list technologies alphabetically",
            "  exo       – restart the console intro",
          ];
          break;
        case "clear":
          setOutput([]);
          setCurrentInput("");
          setSelectedIndex(null);
          return;
        default:
          responseLines = [`Unknown command: '${cmd}' (try 'help')`];
      }
    }

    // Append response lines
    setOutput((prev) => [
      ...prev,
      ...responseLines.map((t, i) => ({ id: idBase + i + 1, text: t })),
    ]);

    // Reset prompt
    setCurrentInput("");
    setSelectedIndex(null);
  };

  /* ------------------------------
   * Initialization animation
   * ----------------------------*/
  const playInit = async (autoCommand: boolean) => {
    setCurrentInput("");
    setPromptEnabled(false);
    setOutput([]);

    const lines = initSequence.split(/\r?\n/);
    for (const line of lines) {
      const rendered = line.trim() === "" ? "\u00A0" : line;
      setOutput((prev) => [
        ...prev,
        { id: Math.random(), text: rendered, isInitLine: true },
      ]);
      await sleep(80);
    }

    if (autoCommand) {
      await sleep(1200);

      const autoCmd = "technologies";
      for (let i = 0; i < autoCmd.length; i++) {
        setCurrentInput(autoCmd.slice(0, i + 1));
        await sleep(40);
      }

      await executeCommand(autoCmd);
      setCurrentInput("");
    }

    setPromptEnabled(true);
  };

  useEffect(() => {
    if (initRan.current) return; // Guard against React StrictMode double-call
    initRan.current = true;

    playInit(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------
   * Line click handler
   * ----------------------------*/
  const handleLineClick = (index: number) => {
    setSelectedIndex(index);
  };

  /* ------------------------------
   * Render
   * ----------------------------*/
  return (
    <div className="technologies-component terminal">
      <div
        className="output-container"
        ref={outputContainerRef}
        aria-label="terminal output container"
      >
        <div className="output" aria-label="terminal output">
          {output.map((line, idx) => (
            <div
              key={line.id}
              className={`line ${line.isInitLine ? "init-line" : ""} ${
                selectedIndex === idx ? "selected" : ""
              }`}
              onClick={() => handleLineClick(idx)}
              data-line-index={idx}
            >
              {line.text.startsWith("EXO>") ? (
                <>
                  <span className="prompt-label">EXO&gt;</span>{" "}
                  {line.text.slice(4)}
                </>
              ) : (
                line.text
              )}
            </div>
          ))}
          {/* Dummy div to keep scroll at bottom */}
          <div ref={outputEndRef} />
        </div>
      </div>

      <div className="prompt-line" aria-label="terminal prompt">
        <span className="prompt-label">EXO&gt;</span>
        <span className="prompt-input">{currentInput}</span>
        <span className="prompt-cursor" aria-hidden="true" />
      </div>
    </div>
  );
};

export default Technologies;
