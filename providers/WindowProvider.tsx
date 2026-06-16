"use client";

import { createContext, useContext, useState } from "react";

type Window = 20 | 60 | 252;

interface WindowContextType {
  window: Window;
  setWindow: (w: Window) => void;
}

const WindowContext = createContext<WindowContextType>({
  window: 60,
  setWindow: () => {},
});

export function WindowProvider({ children }: { children: React.ReactNode }) {
  const [window, setWindow] = useState<Window>(60);
  return (
    <WindowContext.Provider value={{ window, setWindow }}>
      {children}
    </WindowContext.Provider>
  );
}

export function useWindow() {
  return useContext(WindowContext);
}
