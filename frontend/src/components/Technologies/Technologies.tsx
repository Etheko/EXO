import { useEffect, useState, useRef, useLayoutEffect } from "react";
import "./Technologies.css";
import initSequence from "./InitializationSequence.txt?raw";
import { DEFAULT_ASCII_WIDTH, TERMINAL_TOP_SCROLL_COOLDOWN_MS } from "../../config";

// Terminal programs system
import { TerminalProgram, ProgramContext } from "./programs/ProgramTypes";
import HelpProgram from "./programs/HelpProgram";
import ExoProgram from "./programs/ExoProgram";
import TechnologiesProgram from "./programs/TechnologiesProgram";
import { createTechnologyDetailsProgram } from "./programs/TechnologyDetailsProgram";

import type { Technology } from "../../types/Technology";

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
  technology?: Technology;
  isAsciiLine?: boolean;
  html?: string; // if present, render with innerHTML (for colored ASCII)
  linkUrl?: string;
  isBackLine?: boolean;
  /** Optional severity styling */
  severity?: "error" | "warning";
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
  // ASCII art width in characters (resolution)
  const [asciiWidth, setAsciiWidth] = useState<number>(DEFAULT_ASCII_WIDTH);

  // Program system state
  const [programHistory, setProgramHistory] = useState<{ id: string | null; output: OutputLine[] }[]>([]);
  const [currentProgramId, setCurrentProgramId] = useState<string | null>(null);
  const [technologiesExecutedOnce, setTechnologiesExecutedOnce] = useState(false);

  // Registry of available programs
  const programs: TerminalProgram[] = [HelpProgram, ExoProgram, TechnologiesProgram];

  const outputEndRef = useRef<HTMLDivElement>(null);
  // Container that controls scrolling (no native scrollbar displayed)
  const outputContainerRef = useRef<HTMLDivElement>(null);
  // Track which line should be at the top of the visible area
  const topVisibleLineRef = useRef<number>(0);
  /** Timestamp of when the output first reached the very top (scrollTop === 0). Used
   *  to impose a small cooldown before allowing the wheel-up event to propagate to
   *  Home.tsx (which would otherwise immediately trigger the hide animation).
   */
  const topReachedTimeRef = useRef<number | null>(null);
  /** Whether the output was at the very top in the previous wheel event. */
  const wasAtTopRef = useRef<boolean>(false);
  const initRan = useRef(false);

  // Map program id -> display name
  const programNamesRef = useRef<Map<string, string>>(new Map());

  // Unique id generator for lines
  const nextIdRef = useRef<number>(1);
  const getNextId = () => nextIdRef.current++;

  /** Utility to clear terminal output */
  const clearOutput = () => {
    setOutput([]);
    setSelectedIndex(null);
  };

  const appendOutput = (lines: OutputLine[]) => {
    setOutput((prev) => [...prev, ...lines]);
  };

  /** Navigate back to previous program */
  const goBack = () => {
    setProgramHistory((prev) => {
      if (prev.length === 0) return prev;
      const newHistory = [...prev];
      const last = newHistory.pop();
      if (last) {
        setOutput(last.output);
        setCurrentProgramId(last.id);
        setSelectedIndex(null);
        setCurrentInput("");
      }
      return newHistory;
    });
  };

  /** Core executor for a program (internal & command-driven) */
  const runProgram = async (program: TerminalProgram, args: string[] = []) => {
    // Exo acts as hard reset: clear history and currentProgram
    if (program.id === "exo") {
      setProgramHistory([]);
      setCurrentProgramId(null);
    }

    // Determine clearing behavior considering first technologies run
    const skipClearForTechFirst = program.id === "know" && !technologiesExecutedOnce;
    const willClear = program.clear && !skipClearForTechFirst;

    const prevProgramId = currentProgramId;

    if (willClear) {
      if (prevProgramId !== null && program.id !== "exo") {
        setProgramHistory((prev) => [...prev, { id: prevProgramId, output }]);
      } else if (program.id === "exo") {
        setProgramHistory([]);
      }
      clearOutput();
    }

    const context: ProgramContext = {
      appendLines: appendOutput,
      setOutput,
      clearOutput,
      asciiWidth,
      setAsciiWidth,
      setPromptEnabled,
      executeCommand,
      technologiesExecutedOnce,
      markTechnologiesExecuted: () => setTechnologiesExecutedOnce(true),
      getNextId,
    };

    // Register display name for this program
    if (program.displayName) {
      programNamesRef.current.set(program.id, program.displayName);
    }

    await program.run(args, context);

    const hadHistory = currentProgramId !== null || programHistory.length > 0;
    if (program.id !== "exo" && willClear && hadHistory) {
      let backText = "< Back";
      if (prevProgramId) {
        const name = programNamesRef.current.get(prevProgramId) || prevProgramId;
        backText = `< Back - ${name}`;
      }
      appendOutput([
        { id: getNextId(), text: "\u00A0" },
        { id: getNextId(), text: backText, isBackLine: true },
      ]);
    }

    if (program.id === "know" && !technologiesExecutedOnce) {
      setTechnologiesExecutedOnce(true);
    }

    if (willClear) {
      setCurrentProgramId(program.id);
    } else if (currentProgramId === null) {
      setCurrentProgramId(program.id);
    }
  };

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

      const isAtTop = container.scrollTop <= 0;

      // ------------------------------------------------------------------
      // Top-detector & cooldown logic
      // ------------------------------------------------------------------
      // Mark the first moment we reach the absolute top (scrollTop === 0).
      if (isAtTop && !wasAtTopRef.current) {
        topReachedTimeRef.current = Date.now();
        wasAtTopRef.current = true;
      } else if (!isAtTop && wasAtTopRef.current) {
        // We moved away from top – reset flag so next reach records a new time.
        wasAtTopRef.current = false;
      }

      const cooldownActive =
        isAtTop && direction < 0 &&
        topReachedTimeRef.current !== null &&
        Date.now() - topReachedTimeRef.current < TERMINAL_TOP_SCROLL_COOLDOWN_MS; // cooldown from config

      const shouldBubbleToHome = isAtTop && direction < 0 && !cooldownActive;

      if (shouldBubbleToHome) {
        // Cooldown elapsed – allow Home.tsx to handle viewport hide.
        return;
      }

      // Either we are not at the top OR the cooldown is still active.
      // In both cases we handle the scroll internally.

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
        const atScrollTop = outputContainerRef.current?.scrollTop === 0;
        if (selectedIndex === null) {
          if (atScrollTop) {
            // Select the very first line instead of bubbling to Home
            setSelectedIndex(0);
            e.preventDefault();
            return;
          }
        }

        const atTop = atScrollTop && selectedIndex === 0;

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
        if (selectedIndex === null) {
          setCurrentInput((prev) => prev.slice(0, -1));
        }
        e.preventDefault();
      } else if (e.key === "Enter") {
        // If a line is selected, "Enter" acts on it
        if (selectedIndex !== null) {
          handleLineClick(selectedIndex);
        } else if (currentInput.trim() !== "") {
          // Otherwise, execute the command in the prompt
          executeCommand(currentInput.trim());
        }
        e.preventDefault();
      } else if (e.key.length === 1) {
        // If a line is selected, typing deselects it and starts a new input
        if (selectedIndex !== null) {
          setSelectedIndex(null);
          setCurrentInput(e.key);
        } else {
          setCurrentInput((prev) => prev + e.key);
        }
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentInput, output.length, promptEnabled, selectedIndex]);

  /* ------------------------------
   * Command execution (program system)
   * ----------------------------*/
  const executeCommand = async (rawCmd: string) => {
    if (!rawCmd) return;

    // Echo the command (no extra spacing after prompt)
    appendOutput([{ id: getNextId(), text: `EXO> ${rawCmd}` }]);

    const parts = rawCmd.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Handle special commands first
    if (cmd === "nuke" || cmd === "clear") {
      clearOutput();
      setProgramHistory([]);
      setCurrentProgramId(null);
      setCurrentInput("");
      setSelectedIndex(null);
      return;
    }

    if (cmd === "undo" || cmd === "back") {
      const hadHistory = programHistory.length > 0;
      if (hadHistory) {
        goBack();
      } else {
        appendOutput([
          {
            id: getNextId(),
            text: "Nowhere to go back to!",
            severity: "warning",
          },
        ]);
      }
      setCurrentInput("");
      return;
    }

    // Resolution command (does not clear)
    const resMatch = rawCmd.match(/^(?:enhance|resolution)\s+(\d{1,3})$/i);
    if (resMatch) {
      const newWidth = Math.max(10, Math.min(100, parseInt(resMatch[1], 10)));
      setAsciiWidth(newWidth);
      appendOutput([{ id: getNextId(), text: `ASCII resolution width set to ${newWidth} characters.` }]);
      setCurrentInput("");
      setSelectedIndex(null);
      return;
    }

    // Find program by alias
    const program = programs.find((p) => p.aliases.includes(cmd));

    if (!program) {
      // Unknown command
      appendOutput([
        {
          id: getNextId(),
          text: `Unknown command: '${cmd}' (try 'info')`,
          severity: "error",
        },
      ]);
      setCurrentInput("");
      setSelectedIndex(null);
      return;
    }

    await runProgram(program, args);

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
        { id: getNextId(), text: rendered, isInitLine: true },
      ]);
      await sleep(80);
    }

    if (autoCommand) {
      await sleep(1200);

      const autoCmd = "know";
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
  const handleLineClick = async (index: number) => {
    const line = output[index];

    // If the line has a URL, open it and stop further processing
    if (line.linkUrl) {
      window.open(line.linkUrl, "_blank", "noopener,noreferrer");
      return;
    }

    // Back navigation line
    if (line.isBackLine) {
      goBack();
      return;
    }

    // If the clicked line represents a technology, show its details
    if (line?.technology) {
      const tech = line.technology;
      const detailProgram = createTechnologyDetailsProgram({ technology: tech });
      await runProgram(detailProgram, []);
      setSelectedIndex(null);
      setCurrentInput("");
      return;
    }

    // Fallback to simple selection highlight
    setSelectedIndex(index);
  };

  const handlePromptClick = () => {
    setSelectedIndex(null);
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
              line.isAsciiLine ? "ascii" : ""
            } ${selectedIndex === idx ? "selected" : ""} ${
              line.linkUrl ? "link-line" : ""
            } ${line.isBackLine ? "back-line" : ""}`}
            style={
              line.severity === "error"
                ? { color: "#ef4444" }
                : line.severity === "warning"
                ? { color: "#eab308" }
                : undefined
            }
            onClick={() => handleLineClick(idx)}
              data-line-index={idx}
          >
            {line.html ? (
              <span
                className={line.isAsciiLine ? "ascii-html" : ""}
                dangerouslySetInnerHTML={{ __html: line.html }}
              />
            ) : line.text.startsWith("EXO>") ? (
              <>
                <span className="prompt-label">EXO&gt;</span>
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

      <div
        className="prompt-line"
        aria-label="terminal prompt"
        onClick={handlePromptClick}
      >
        <span className="prompt-label">EXO&gt;</span>
        &nbsp;
        <span className="prompt-input">{currentInput}</span>
        {selectedIndex === null && (
          <span className="prompt-cursor" aria-hidden="true" />
        )}
      </div>
    </div>
  );
};

export default Technologies;

export type { OutputLine };
