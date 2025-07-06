import { useEffect, useState, useRef, useLayoutEffect } from "react";
import "./Technologies.css";
import initSequence from "./InitializationSequence.txt?raw";
import { DEFAULT_ASCII_WIDTH, TERMINAL_TOP_SCROLL_COOLDOWN_MS } from "../../config";
import LoginService from "../../services/LoginService";
import TechnologyService from "../../services/TechnologyService";

// Terminal programs system
import { TerminalProgram, ProgramContext } from "./programs/ProgramTypes";
import HelpProgram from "./programs/HelpProgram";
import ExoProgram from "./programs/ExoProgram";
import TechnologiesProgram from "./programs/TechnologiesProgram";
import { createTechnologyDetailsProgram } from "./programs/TechnologyDetailsProgram";
import { createEditTechnologyProgram } from "./programs/EditTechnologyProgram";
import { createFieldEditProgram } from "./programs/FieldEditProgram";
import { createDeleteTechnologyProgram } from "./programs/DeleteTechnologyProgram";
import { createIconEditProgram } from "./programs/IconEditProgram";
import { createCategoryEditProgram } from "./programs/CategoryEditProgram";

import type { Technology } from "../../types/Technology";
import { convertImageToAscii } from "../../utils/aa";

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
 *  │ output (scrollable, grows upward)             │
 *  │ prompt-line →  EXO> _ (input + blinking)      │
 *  └───────────────────────────────────────────────┘
 */

import type { OutputLine } from "./programs/ProgramTypes";

// Utility sleep helper
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Disallowed program prefixes that should never be the target of a < Back navigation from outside the editing flow
const EDIT_PROGRAM_PREFIXES = [
  'tech-edit-',           // main edit menu
  'edit-field-',          // field edit
  'icon-edit-',           // icon edit
  'category-edit-',       // category edit
  'delete-tech-'          // delete confirm
];

// Utility to know if a program id is an edit-related one
const isEditRelatedProgram = (id: string | null | undefined) => {
  if (!id) return false;
  return EDIT_PROGRAM_PREFIXES.some((p) => id.startsWith(p));
};

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
  const [isAdmin, setIsAdmin] = useState<boolean>(LoginService.isCurrentUserAdmin());
  const [activeTechnology, setActiveTechnology] = useState<Technology | null>(null);

  // Program system state
  const [programHistory, setProgramHistory] = useState<{ id: string | null; output: OutputLine[] }[]>([]);
  const [currentProgramId, setCurrentProgramId] = useState<string | null>(null);
  const [technologiesExecutedOnce, setTechnologiesExecutedOnce] = useState(false);
  
  // Edit context tracking for proper back navigation
  const [editContext, setEditContext] = useState<{
    editProgramId: string | null;
    sourceProgramId: string | null;
    sourceOutput: OutputLine[];
    isCreateMode: boolean;
  } | null>(null);

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

  const [editSession, setEditSession] = useState<{ tech: Technology; field: "name" | "description" | "link" | "icon" | "category" } | null>(null);
  const [deleteSession, setDeleteSession] = useState<{ tech: Technology } | null>(null);
  const [iconUploadSession, setIconUploadSession] = useState<{ tech: Technology; file: File } | null>(null);
  const [newTechDraft, setNewTechDraft] = useState<Technology | null>(null);
  const [tempIconFile, setTempIconFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingUploadTechRef = useRef<Technology | null>(null);

  /** Utility to clear terminal output */
  const clearOutput = () => {
    setOutput([]);
    setSelectedIndex(null);
  };

  const appendOutput = (lines: OutputLine[]) => {
    setOutput((prev) => [...prev, ...lines]);
  };

  /** Navigate back to previous program (skips any edit-related programs) */
  const goBack = () => {
    setProgramHistory((prev) => {
      if (prev.length === 0) return prev;
      // Make a mutable copy so we can pop freely
      const newHistory = [...prev];

      // Pop edit-related programs that should be invisible to the global back flow
      while (newHistory.length > 0 && isEditRelatedProgram(newHistory[newHistory.length - 1].id)) {
        newHistory.pop();
      }

      // Retrieve next valid history entry (if any)
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
  
  /** Navigate back to edit program from sub-edit program */
  const goBackToEditProgram = async () => {
    if (editContext?.editProgramId && activeTechnology) {
      // Clear the program history to remove the sub-edit program
      // This ensures that when we go back from the edit program, we go to the original source
      setProgramHistory((prev) => {
        // Remove the last entry if it's a sub-edit program
        if (prev.length > 0) {
          const lastEntry = prev[prev.length - 1];
          if (lastEntry.id?.startsWith('edit-field-') || lastEntry.id?.startsWith('icon-edit-') || 
              lastEntry.id?.startsWith('category-edit-') || lastEntry.id?.startsWith('delete-tech-')) {
            return prev.slice(0, -1);
          }
        }
        return prev;
      });
      
      // Re-run the edit program for the current technology
      // The edit context should already be set up correctly with the original source
      const editProgram = createEditTechnologyProgram({ 
        technology: activeTechnology, 
        isCreate: editContext.isCreateMode 
      });
      await runProgram(editProgram, []);
    } else {
      // Fallback to normal back navigation
      goBack();
    }
  };
  
  /** Navigate back from edit program to source */
  const goBackFromEditProgram = async () => {
    // The history is now managed correctly by the purge logic in runProgram,
    // so a standard goBack() is all that's needed.
    goBack();
  };

  /** Core executor for a program (internal & command-driven) */
  const runProgram = async (program: TerminalProgram, args: string[] = []) => {
    // Exo acts as hard reset: clear history and currentProgram
    if (program.id === "exo") {
      setProgramHistory([]);
      setCurrentProgramId(null);
      setEditContext(null);
    }

    const prevProgramId = currentProgramId;
    const isReload = prevProgramId === program.id;

    // Determine clearing behavior considering first technologies run
    const skipClearForTechFirst = program.id === "know" && !technologiesExecutedOnce;
    const willClear = program.clear && !skipClearForTechFirst;

    // Handle edit context for back navigation
    if (willClear) {
      if (prevProgramId !== null && program.id !== "exo" && !isReload) {
        // Check if we're entering an edit program
        if (program.id.startsWith('tech-edit-')) {
          // This is the main edit program - store the source context
          // If we already have an edit context, preserve the original source
          const originalSource = editContext?.sourceProgramId || prevProgramId;
          const originalOutput = editContext?.sourceOutput || [...output];
          const originalCreateMode = editContext?.isCreateMode || program.id.includes('undefined') || program.id.includes('temp');
          
          setEditContext({
            editProgramId: program.id,
            sourceProgramId: originalSource,
            sourceOutput: originalOutput,
            isCreateMode: originalCreateMode
          });
          setProgramHistory((prev) => [...prev, { id: prevProgramId, output }]);
        } else if (program.id.startsWith('edit-field-') || program.id.startsWith('icon-edit-') || 
                   program.id.startsWith('category-edit-') || program.id.startsWith('delete-tech-')) {
          // This is a sub-edit program - back should go to the edit program
          if (editContext?.editProgramId) {
            // Don't add to history here - we'll handle the back navigation specially
            // The edit program should already be in history from when we entered it
          } else {
            // Fallback to normal history if no edit context
            setProgramHistory((prev) => [...prev, { id: prevProgramId, output }]);
          }
        } else if (program.id.startsWith('tech-detail-') && prevProgramId?.startsWith('tech-edit-')) {
          // Coming from edit menu back to detail – push original source program instead of the edit menu.
          if (editContext?.sourceProgramId) {
            setProgramHistory((prev) => [...prev, { id: editContext.sourceProgramId, output: editContext.sourceOutput }]);
          }
        } else {
          // Regular program - normal history
          setProgramHistory((prev) => [...prev, { id: prevProgramId, output }]);
        }
      } else if (program.id === "exo") {
        setProgramHistory([]);
        setEditContext(null);
      }
      clearOutput();
    }

    // If navigating to a technology details program, purge trailing edit-related programs from history
    if (program.id.startsWith('tech-detail-')) {
      setProgramHistory((prev) => {
        const newHist = [...prev];
        while (newHist.length > 0 && isEditRelatedProgram(newHist[newHist.length - 1].id)) {
          newHist.pop();
        }
        return newHist;
      });
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
      isAdmin,
      startFieldEditSession: (t, f) => setEditSession({ tech: t, field: f as any }),
      startDeleteSession: (t) => setDeleteSession({ tech: t }),
    };

    // Register display name for this program
    if (program.displayName) {
      programNamesRef.current.set(program.id, program.displayName);
    }

    // If the program has a technology context, make it active
    if (program.technology) {
      setActiveTechnology(program.technology);
      
      // Update edit context if we're navigating to a technology detail view after creation
      if (program.id.startsWith('tech-detail-') && editContext?.isCreateMode) {
        setEditContext(prev => prev ? {
          ...prev,
          sourceProgramId: program.id,
          sourceOutput: [...output],
          isCreateMode: false
        } : null);
      }
    }
    
    // Clear edit context if we're navigating to a non-edit program
    if (!program.id.startsWith('tech-edit-') && !program.id.startsWith('edit-field-') && 
        !program.id.startsWith('icon-edit-') && !program.id.startsWith('category-edit-') && 
        !program.id.startsWith('delete-tech-') && program.id !== 'exo') {
      setEditContext(null);
    }
    
    // Preserve edit context when navigating between edit programs
    if (program.id.startsWith('edit-field-') || program.id.startsWith('icon-edit-') || 
        program.id.startsWith('category-edit-') || program.id.startsWith('delete-tech-')) {
      // Don't clear edit context for sub-edit programs
    }

    await program.run(args, context);

    const hadHistory = currentProgramId !== null || programHistory.length > 0;

    // Add Edit line for admins on technology detail view
    if (isAdmin && program.id.startsWith("tech-detail-") && program.technology) {
      appendOutput([
        { id: getNextId(), text: " " },
        { 
          id: getNextId(), 
          text: "Edit", 
          isEditLine: true, 
          technology: program.technology,
          action: 'show-edit-menu'
        },
      ]);
    }
    
    if (program.id !== "exo" && willClear && hadHistory) {
      let backText = "< Back";
      const lastProgramInHistory = programHistory.length > 0 ? programHistory[programHistory.length - 1] : null;
      const backTargetForName = isReload ? lastProgramInHistory?.id : prevProgramId;
      
      // Handle special back navigation for edit programs
      if (program.id.startsWith('edit-field-') || program.id.startsWith('icon-edit-') || 
          program.id.startsWith('category-edit-') || program.id.startsWith('delete-tech-')) {
        // Sub-edit programs → back to main edit
        if (editContext?.editProgramId) {
          const editName = programNamesRef.current.get(editContext.editProgramId) || 'Edit Menu';
          backText = `< Back - ${editName}`;
        }
      } else if (program.id.startsWith('tech-edit-')) {
        // Main edit program → back to original source
        if (editContext?.sourceProgramId) {
          const sourceName = programNamesRef.current.get(editContext.sourceProgramId) || 'Technologies';
          backText = `< Back - ${sourceName}`;
        }
      } else if (backTargetForName) {
        // Regular programs
        const name = programNamesRef.current.get(backTargetForName) || backTargetForName;
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

    setSelectedIndex(null);
    setCurrentInput('');
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

  // Listen to login status changes
  useEffect(() => {
    const handleLoginStatusChange = () => {
      setIsAdmin(LoginService.isCurrentUserAdmin());
    };
    window.addEventListener("loginStatusChanged", handleLoginStatusChange as EventListener);
    return () => window.removeEventListener("loginStatusChanged", handleLoginStatusChange as EventListener);
  }, []);

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

    // Emergency exit commands that work everywhere
    if (cmd === "nuke" || cmd === "clear") {
      clearOutput();
      setProgramHistory([]);
      setCurrentProgramId(null);
      setEditContext(null);
      setEditSession(null);
      setDeleteSession(null);
      setCurrentInput("");
      setSelectedIndex(null);
      return;
    }

    if (cmd === "exo") {
      setEditSession(null);
      setDeleteSession(null);
      await runProgram(ExoProgram, args);
      setCurrentInput("");
      setSelectedIndex(null);
      return;
    }

    // Handle active edit session input
    if (editSession) {
      const value = rawCmd.trim();
      if (value.toLowerCase() === 'cancel') {
        appendOutput([{ id: getNextId(), text: 'Edit cancelled.' }]);
        setEditSession(null);
        // Return to edit program instead of technology details
        if (activeTechnology) {
          await runProgram(createEditTechnologyProgram({ technology: activeTechnology! }), []);
        }
        setCurrentInput('');
        return;
      }
      try {
        const techId = editSession.tech.id;
        if (techId === undefined) {
          // Creating new tech draft: update local draft
          setNewTechDraft((prev) => ({ ...(prev ?? {}), [editSession.field]: value } as Technology));
          appendOutput([{ id: getNextId(), text: `${editSession.field} set.` }]);
          setEditSession(null);
          await runProgram(createEditTechnologyProgram({ technology: { ...(newTechDraft ?? {}), [editSession.field]: value } as Technology, isCreate: true }), []);
          setCurrentInput('');
          return;
        }
        if (editSession.field === 'icon') {
          // For icon, treat value as path URL on server
          await TechnologyService.updateIconPath(techId, value);
        } else {
          // Merge existing technology data with the updated field to satisfy backend requirements
          const base = {
            name: (editSession.tech.name ?? ''),
            description: (editSession.tech.description ?? ''),
            link: (editSession.tech.link ?? ''),
            category: (editSession.tech.category ?? ''),
            iconPath: editSession.tech.iconString, // preserve existing icon path
          } as any;

          base[editSession.field] = value;

          await TechnologyService.updateTechnology(techId, base);
        }
        // Fetch updated tech
        const updatedTech = await TechnologyService.getTechnologyById(techId);
        setActiveTechnology(updatedTech);
        appendOutput([{ id: getNextId(), text: `${editSession.field} updated successfully.` }]);
        setEditSession(null);
        // Return to edit program instead of technology details
        await runProgram(createEditTechnologyProgram({ technology: updatedTech! }), []);
      } catch (err) {
        console.error(err);
        appendOutput([{ id: getNextId(), text: 'Failed to update.', severity: 'error' }]);
      }
      setCurrentInput('');
      return;
    }

    if (deleteSession) {
      const val = rawCmd.trim().toLowerCase();
      if (val === 'cancel' || val === 'n' || val === 'no') {
        appendOutput([{ id: getNextId(), text: 'Delete cancelled.' }]);
        setDeleteSession(null);
        // Return to edit program instead of technology details
        await runProgram(createEditTechnologyProgram({ technology: deleteSession!.tech }), []);
        setCurrentInput('');
        return;
      }
      if (val === 'confirm' || val === 'y' || val === 'yes') {
        try {
          const techId = deleteSession.tech.id;
          if (techId === undefined) throw new Error('Technology ID missing');
          await TechnologyService.deleteTechnology(techId);
          appendOutput([{ id: getNextId(), text: 'Technology deleted.' }]);
          setDeleteSession(null);
          // After deletion, go back to technologies list
          await runProgram(TechnologiesProgram, []);
        } catch (err) {
          console.error(err);
          appendOutput([{ id: getNextId(), text: 'Failed to delete.', severity: 'error' }]);
        }
        setCurrentInput('');
        return;
      }
      // Unknown input in delete session, prompt again
      appendOutput([{ id: getNextId(), text: "Please type 'confirm' or 'cancel'.", severity: 'warning' }]);
      setCurrentInput('');
      return;
    }

    // Handle special commands first
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

    if (cmd === 'reload') {
      if (!isAdmin) {
        appendOutput([{ id: getNextId(), text: `Unknown command: '${cmd}' (try 'info')`, severity: 'error' }]);
        setCurrentInput('');
        return;
      }
      await runProgram(TechnologiesProgram, []);
      setCurrentInput('');
      setSelectedIndex(null);
      return;
    }

    // Edit command (admin only)
    if (cmd === "edit") {
      if (!isAdmin) {
        appendOutput([
          {
            id: getNextId(),
            text: `Unknown command: '${cmd}' (try 'info')`,
            severity: "error",
          },
        ]);
        setCurrentInput("");
        return;
      }

      // If a specific field is provided (edit name, edit description, etc.)
      const validFields = ['name', 'description', 'link', 'icon', 'category'];
      if (args.length > 0 && validFields.includes(args[0])) {
        if (!activeTechnology) {
          appendOutput([
            { id: getNextId(), text: 'No technology selected. View a technology before trying to edit it.', severity: 'warning' },
          ]);
          setCurrentInput('');
          return;
        }
        const field = args[0] as 'name' | 'description' | 'link' | 'icon' | 'category';
        if (field === 'icon') {
          const iconProg2 = createIconEditProgram({ technology: activeTechnology });
          await runProgram(iconProg2, args.slice(1));
        } else if (field === 'category') {
          const categoryProg = createCategoryEditProgram({ technology: activeTechnology });
          await runProgram(categoryProg, args.slice(1));
        } else {
          const fieldProgram = createFieldEditProgram({ technology: activeTechnology, field });
          await runProgram(fieldProgram, args.slice(1));
        }
        setSelectedIndex(null);
        setCurrentInput('');
        return;
      }

      if (!activeTechnology) {
        appendOutput([
          {
            id: getNextId(),
            text: "No technology selected. View a technology before trying to edit it.",
            severity: "warning",
          },
        ]);
        setCurrentInput("");
        return;
      }
      const editProgram = createEditTechnologyProgram({ technology: activeTechnology });
      await runProgram(editProgram, args);
      setCurrentInput("");
      return;
    }

    // Delete command (admin only)
    if (cmd === "delete") {
      if (!isAdmin) {
        appendOutput([
          {
            id: getNextId(),
            text: `Unknown command: '${cmd}' (try 'info')`,
            severity: "error",
          },
        ]);
        setCurrentInput("");
        return;
      }
      if (!activeTechnology) {
        appendOutput([
          {
            id: getNextId(),
            text: "No technology selected. View a technology before trying to delete it.",
            severity: "warning",
          },
        ]);
        setCurrentInput("");
        return;
      }
      const delProgram = createDeleteTechnologyProgram({ technology: activeTechnology });
      await runProgram(delProgram, []);
      setSelectedIndex(null);
      setCurrentInput('');
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

    // Add command (admin only)
    if (cmd === 'add') {
      if (!isAdmin) {
        appendOutput([{ id: getNextId(), text: `Unknown command: '${cmd}' (try 'info')`, severity: 'error' }]);
        setCurrentInput('');
        return;
      }
      const draft: Technology = { name: '', description: '', link: '' };
      setNewTechDraft(draft);
      setTempIconFile(null);
      const createProg = createEditTechnologyProgram({ technology: draft, isCreate: true });
      await runProgram(createProg, []);
      setCurrentInput('');
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
      // Check if we're in a sub-edit program and should go back to edit program
      if (currentProgramId?.startsWith('edit-field-') || currentProgramId?.startsWith('icon-edit-') || 
          currentProgramId?.startsWith('category-edit-') || currentProgramId?.startsWith('delete-tech-')) {
        await goBackToEditProgram();
      } else if (currentProgramId?.startsWith('tech-edit-')) {
        // Main edit program should go back to source
        await goBackFromEditProgram();
      } else {
        goBack();
      }
      return;
    }

    // If the line is an edit line, handle the action
    if (isAdmin && line.isEditLine && line.technology) {
      if (line.action === 'show-edit-menu') {
        const editProgram = createEditTechnologyProgram({ technology: line.technology });
        await runProgram(editProgram, []);
        setSelectedIndex(null);
        setCurrentInput("");
        return;
      }
      // Placeholder for specific edit actions from the edit menu
      if (line.action) {
        if (line.action === 'delete') {
          const delProgram = createDeleteTechnologyProgram({ technology: line.technology });
          await runProgram(delProgram, []);
          setSelectedIndex(null);
          setCurrentInput('');
          return;
        }
        if (line.action === 'upload-icon') {
          pendingUploadTechRef.current = line.technology;
          fileInputRef.current?.click();
          return; // wait for file selection
        }
        if (line.action === 'save-new-icon') {
          if (iconUploadSession && iconUploadSession.tech.id) {
            try {
              await TechnologyService.uploadIcon(iconUploadSession.tech.id, iconUploadSession.file);
              appendOutput([{ id: getNextId(), text: 'Icon updated successfully.' }]);
              const updatedTech = await TechnologyService.getTechnologyById(iconUploadSession.tech.id);
              setActiveTechnology(updatedTech);
              setIconUploadSession(null);
              // Return to edit program instead of technology details
              await runProgram(createEditTechnologyProgram({ technology: updatedTech }), []);
            } catch (err) {
              console.error(err);
              appendOutput([{ id: getNextId(), text: 'Failed to upload icon.', severity: 'error' }]);
            }
          }
          // Handle create mode: just store the file in the draft
          else if (iconUploadSession && newTechDraft) {
            setTempIconFile(iconUploadSession.file);
            setNewTechDraft(prev => ({ ...prev!, iconString: 'temp-uploaded' }));
            appendOutput([{ id: getNextId(), text: 'Icon set for new technology.' }]);
            setIconUploadSession(null);
            await runProgram(createEditTechnologyProgram({ technology: { ...newTechDraft!, iconString: 'temp-uploaded' } as Technology, isCreate: true }), []);
          }
          setSelectedIndex(null);
          setCurrentInput('');
          return;
        }
        if (line.action === 'discard-new-icon') {
          if (iconUploadSession) {
            if (newTechDraft) {
              setTempIconFile(null);
            }
            setIconUploadSession(null);
          }
          // Return to icon edit program
          const iconProg2 = createIconEditProgram({ technology: line.technology });
          await runProgram(iconProg2, []);
          setSelectedIndex(null);
          setCurrentInput('');
          return;
        }
        if (line.action === 'delete-yes') {
          // Perform deletion similar to yes command
          if (line.technology.id !== undefined) {
            try {
              await TechnologyService.deleteTechnology(line.technology.id);
              appendOutput([{ id: getNextId(), text: 'Technology deleted.' }]);
              await runProgram(TechnologiesProgram, []);
            } catch (err) {
              console.error(err);
              appendOutput([{ id: getNextId(), text: 'Failed to delete.', severity: 'error' }]);
            }
            setSelectedIndex(null);
            setCurrentInput('');
          }
          return;
        }
        if (line.action === 'delete-no') {
          // Cancel deletion - return to edit program instead of technology details
          await runProgram(createEditTechnologyProgram({ technology: line.technology }), []);
          setSelectedIndex(null);
          setCurrentInput('');
          return;
        }
        if (line.action === 'add-new-tech') {
          const draft: Technology = { name: '', description: '', link: '' };
          setNewTechDraft(draft);
          setTempIconFile(null);
          const createProg = createEditTechnologyProgram({ technology: draft, isCreate: true });
          await runProgram(createProg, []);
          setSelectedIndex(null);
          setCurrentInput('');
          return;
        }
        if (line.action === 'create-save') {
          if (newTechDraft) {
            try {
              const createdTech = await TechnologyService.createTechnology({
                name: newTechDraft.name,
                description: newTechDraft.description,
                link: newTechDraft.link,
                iconPath: newTechDraft.iconString === 'temp-uploaded' ? undefined : newTechDraft.iconString,
                category: newTechDraft.category,
              });
              
              // Upload icon if we have a temp file
              if (tempIconFile && createdTech.id) {
                await TechnologyService.uploadIcon(createdTech.id, tempIconFile);
              }
              
              appendOutput([{ id: getNextId(), text: 'Technology created successfully.' }]);
              setNewTechDraft(null);
              setTempIconFile(null);
              
              // Navigate to the newly created technology's detail view
              // Update edit context to reflect that we're now viewing the created technology
              setEditContext(prev => prev ? {
                ...prev,
                sourceProgramId: `tech-detail-${createdTech.id}`,
                sourceOutput: [],
                isCreateMode: false
              } : null);
              await runProgram(createTechnologyDetailsProgram({ technology: createdTech }), []);
            } catch (err) {
              console.error(err);
              appendOutput([{ id: getNextId(), text: 'Failed to create technology.', severity: 'error' }]);
            }
          }
          setSelectedIndex(null);
          setCurrentInput('');
          return;
        }
        if (line.action === 'create-cancel') {
          setNewTechDraft(null);
          setTempIconFile(null);
          await runProgram(TechnologiesProgram, []);
          setSelectedIndex(null);
          setCurrentInput('');
          return;
        }
        // Handle category selection from category edit program
        if (line.action && line.action.startsWith('select-category-')) {
          setEditSession(null);
          const selectedCategory = line.action.replace('select-category-', '');
          if (line.technology.id !== undefined) {
            try {
              // Update the technology with the selected category
              const base = {
                name: (line.technology.name ?? ''),
                description: (line.technology.description ?? ''),
                link: (line.technology.link ?? ''),
                category: selectedCategory,
                iconPath: line.technology.iconString,
              } as any;
              
              await TechnologyService.updateTechnology(line.technology.id, base);
              const updatedTech = await TechnologyService.getTechnologyById(line.technology.id);
              setActiveTechnology(updatedTech);
              appendOutput([{ id: getNextId(), text: `Category updated to: ${selectedCategory}` }]);
              // Return to edit program instead of technology details
              await runProgram(createEditTechnologyProgram({ technology: updatedTech! }), []);
            } catch (err) {
              console.error(err);
              appendOutput([{ id: getNextId(), text: 'Failed to update category.', severity: 'error' }]);
            }
          } else if (newTechDraft) {
            // For new technology draft
            setNewTechDraft(prev => ({ ...prev!, category: selectedCategory }));
            appendOutput([{ id: getNextId(), text: `Category set to: ${selectedCategory}` }]);
            await runProgram(createEditTechnologyProgram({ technology: { ...newTechDraft!, category: selectedCategory } as Technology, isCreate: true }), []);
          }
          setSelectedIndex(null);
          setCurrentInput('');
          return;
        }
        const field = line.action.replace('edit-', '') as 'name' | 'description' | 'link' | 'icon' | 'category';
        if (field === 'icon') {
          const iconProg2 = createIconEditProgram({ technology: line.technology });
          await runProgram(iconProg2, []);
        } else if (field === 'category') {
          const categoryProg = createCategoryEditProgram({ technology: line.technology });
          await runProgram(categoryProg, []);
        } else {
          const fieldProgram = createFieldEditProgram({ technology: line.technology, field });
          await runProgram(fieldProgram, []);
        }
        setSelectedIndex(null);
        setCurrentInput('');
        return;
      }
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

    // If the line is an add-new-tech action (no tech)
    if (isAdmin && line.isEditLine && line.action === 'add-new-tech') {
      const draft: Technology = { name: '', description: '', link: '' };
      setNewTechDraft(draft);
      setTempIconFile(null);
      const createProg = createEditTechnologyProgram({ technology: draft, isCreate: true });
      await runProgram(createProg, []);
      setSelectedIndex(null);
      setCurrentInput('');
      return;
    }

    // Handle reload list action
    if (isAdmin && line.isEditLine && line.action === 'reload-list') {
      await runProgram(TechnologiesProgram, []);
      setSelectedIndex(null);
      setCurrentInput('');
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
            } ${line.isBackLine ? "back-line" : ""} ${
              line.action === 'reload-list' ? 'reload-line' : ''
            }`}
            style={
              line.severity === "error"
                ? { color: "#ef4444" }
                : line.severity === "warning"
                ? { color: "#eab308" }
                : line.severity === "success"
                ? { color: "#22c55e" }
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
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        aria-label="Upload icon file"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const tech = pendingUploadTechRef.current;
          if (!tech) return;
          const objectUrl = URL.createObjectURL(file);
          try {
            const asciiArr = await convertImageToAscii(objectUrl, { colored: true, width: asciiWidth });
            URL.revokeObjectURL(objectUrl);
            const asciiLines = asciiArr.map((htmlStr) => ({
              id: getNextId(),
              text: htmlStr.replace(/<[^>]+>/g, ''),
              html: htmlStr,
              isAsciiLine: true,
            }));
            appendOutput([
              { id: getNextId(), text: '\u00A0' },
              ...asciiLines,
              { id: getNextId(), text: '\u00A0' },
              { id: getNextId(), text: 'Save new icon', isEditLine: true, technology: tech, action: 'save-new-icon' },
              { id: getNextId(), text: 'Discard', isEditLine: true, technology: tech, action: 'discard-new-icon' },
            ]);
            setIconUploadSession({ tech, file });
          } catch (err) {
            console.error(err);
            appendOutput([{ id: getNextId(), text: 'Failed to render icon.', severity: 'error' }]);
          }
          // reset input value
          e.target.value = '';
        }}
      />
    </div>
  );
};

export default Technologies;
