import { useEffect, useState, useRef } from "react";
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
  const initRan = useRef(false);

  /* ------------------------------
   * Effects
   * ----------------------------*/
  // Scroll to bottom whenever output grows
  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output]);

  // Key events for prompt input & selection navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!promptEnabled) return;
      if (e.key === "ArrowUp") {
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
      <div className="output" aria-label="terminal output">
        {output.map((line, idx) => (
          <div
            key={line.id}
            className={`line ${line.isInitLine ? "init-line" : ""} ${
              selectedIndex === idx ? "selected" : ""
            }`}
            onClick={() => handleLineClick(idx)}
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

      <div className="prompt-line" aria-label="terminal prompt">
        <span className="prompt-label">EXO&gt;</span>
        <span className="prompt-input">{currentInput}</span>
        <span className="prompt-cursor" aria-hidden="true" />
      </div>
    </div>
  );
};

export default Technologies;
