import { FC, useState, useEffect } from "react";
import styles from "./AttributeView.module.scss";
import Tree from "./Tree";

import { useRendererContext } from "../../context/RendererContext";
import { useSelectionContext } from "../../context/SelectionContext";
import { useDocumentContext } from "../../context/DocumentContext";

import AttributeEditor from "./AttributeEditor";
import DocumentEditor from "./DocumentEditor";

const AttributeView: FC = () => {
  const rendererRef = useRendererContext();
  const { selectedElement, setSelectedElement } = useSelectionContext();
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

  const { updateElement, findElementById, elements, elementOrder } =
    useDocumentContext();

  useEffect(() => {
    if (!selectedElement) return;
    rendererRef.current?.setMode("selected", selectedElement.id);
  }, [selectedElement]);

  const handleChange = (key: string, value: any) => {
    if (!selectedElement) return;
    updateElement(selectedElement.id, { [key]: value });
    rendererRef.current?.render();
  };

  return (
    <div className={styles.attributeView}>
      <div className={styles.editorContainer}>
        {selectedElement ? (
          <AttributeEditor element={selectedElement} onChange={handleChange} />
        ) : (
          <DocumentEditor />
        )}
      </div>
      <div className={styles.treeContainer}>
        <Tree
          elements={elements}
          elementOrder={elementOrder}
          selectedId={selectedElement?.id || null}
          hoveredId={hoveredElement}
          onSelect={(id) => {
            const selected = findElementById(id);
            if (selected) {
              setSelectedElement(selected);
            }
          }}
          onHover={(id) => setHoveredElement(id)}
        />
      </div>
    </div>
  );
};

export default AttributeView;
