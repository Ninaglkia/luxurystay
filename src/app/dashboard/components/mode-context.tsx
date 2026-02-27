"use client";

import { createContext, useContext, useState, useEffect } from "react";

type Mode = "travel" | "host";

const ModeContext = createContext<{
  mode: Mode;
  setMode: (m: Mode) => void;
}>({ mode: "travel", setMode: () => {} });

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("travel");

  // Persist to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("luxurystay-mode");
    if (saved === "host" || saved === "travel") setMode(saved);
  }, []);

  function handleSetMode(m: Mode) {
    setMode(m);
    localStorage.setItem("luxurystay-mode", m);
  }

  return (
    <ModeContext.Provider value={{ mode, setMode: handleSetMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  return useContext(ModeContext);
}
