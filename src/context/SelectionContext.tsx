import React, { createContext, useContext, useState } from "react";
import type { SvgElement } from "../types/SvgElements";

interface SelectionContextType {
  selectedElement: SvgElement | null;
  setSelectedElement: (element: SvgElement | null) => void;
}

const SelectionContext = createContext<SelectionContextType | null>(null);

export const SelectionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [selectedElement, setSelectedElement] = useState<SvgElement | null>(
    null
  );

  return (
    <SelectionContext.Provider value={{ selectedElement, setSelectedElement }}>
      {children}
    </SelectionContext.Provider>
  );
};

export const useSelectionContext = () => {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error(
      "useSelectionContext must be used within a SelectionProvider"
    );
  }
  return context;
};
