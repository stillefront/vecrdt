import React, { createContext, useContext, useRef, useEffect } from "react";
import { CanvasRenderer } from "../components/canvas/CanvasRenderer";

const RendererContext =
  createContext<React.MutableRefObject<CanvasRenderer | null> | null>(null);

export const RendererProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const rendererRef = useRef<CanvasRenderer | null>(null);
  useEffect(() => {
    if (!rendererRef.current) {
      console.log("initializing RendererRef.");
    }
  }, []);

  return (
    <RendererContext.Provider value={rendererRef}>
      {children}
    </RendererContext.Provider>
  );
};

export const useRendererContext = () => {
  const context = useContext(RendererContext);
  if (!context) {
    throw new Error("useRendererContext must be used within RendererProvider");
  }
  return context;
};
