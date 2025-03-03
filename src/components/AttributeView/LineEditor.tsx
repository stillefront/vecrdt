import { FC, useEffect, useState } from "react";
import styles from "./Editor.module.scss";
import { useDocumentContext } from "../../context/DocumentContext";

import IconAddAttribute from "../../assets/icons/addAttribute.svg?react";
import IconRemoveAttribute from "../../assets/icons/removeAttribute.svg?react";

type LineAttributes = {
  id: string;
  parentId: string;
  type: "line";
  relPos: { __x: number; __y: number };
  endRelPos: { __x: number; __y: number };
  stroke?: string;
  strokeWidth?: number;
};

type LineEditorProps = {
  attributes: LineAttributes;
  onChange: (key: string, value: any) => void;
};

const LineEditor: FC<LineEditorProps> = ({ attributes, onChange }) => {
  const [localAttributes, setLocalAttributes] = useState(attributes);
  const { addAttribute, removeAttribute } = useDocumentContext();

  useEffect(() => {
    setLocalAttributes(attributes);
  }, [attributes]);

  const handleInputChange = (key: keyof LineAttributes, value: any) => {
    const updatedAttributes = { ...localAttributes, [key]: value };
    setLocalAttributes(updatedAttributes);
    onChange(key, value);
  };

  return (
    <div className={styles.editorContainer}>
      <div className={styles.elementName}>
        <h3>Line</h3>
        <span>id: {localAttributes.id}</span>
      </div>

      {/* Start Position */}
      <div className={styles.attributeGroup}>
        <p className={styles.attributeName}>Start Position</p>
        <div className={styles.attributeRow}>
          <div className={styles.inputGroup}>
            <label>X</label>
            <input
              type="number"
              value={Math.round(localAttributes.relPos.__x) ?? 0}
              onChange={(e) =>
                handleInputChange("relPos", {
                  ...localAttributes.relPos,
                  __x: parseFloat(e.target.value),
                })
              }
              onFocus={(e) => e.target.select()}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Y</label>
            <input
              type="number"
              value={Math.round(localAttributes.relPos.__y) ?? 0}
              onChange={(e) =>
                handleInputChange("relPos", {
                  ...localAttributes.relPos,
                  __y: parseFloat(e.target.value),
                })
              }
              onFocus={(e) => e.target.select()}
            />
          </div>
        </div>
      </div>

      {/* End Position */}
      <div className={styles.attributeGroup}>
        <p className={styles.attributeName}>End Position</p>
        <div className={styles.attributeRow}>
          <div className={styles.inputGroup}>
            <label>X</label>
            <input
              type="number"
              value={Math.round(localAttributes.endRelPos.__x) ?? 0}
              onChange={(e) =>
                handleInputChange("endRelPos", {
                  ...localAttributes.endRelPos,
                  __x: parseFloat(e.target.value),
                })
              }
              onFocus={(e) => e.target.select()}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Y</label>
            <input
              type="number"
              value={Math.round(localAttributes.endRelPos.__y) ?? 0}
              onChange={(e) =>
                handleInputChange("endRelPos", {
                  ...localAttributes.endRelPos,
                  __y: parseFloat(e.target.value),
                })
              }
              onFocus={(e) => e.target.select()}
            />
          </div>
        </div>
      </div>

      {/* Style */}
      <div className={styles.attributeGroup}>
        <p className={styles.attributeName}>Style</p>

        {/* Stroke */}
        <div className={styles.addAttributeContainer}>
          <div
            className={
              localAttributes.stroke === undefined
                ? `${styles.colorInput} ${styles.disabledInput}`
                : styles.colorInput
            }
          >
            <label htmlFor="strokeInput">Stroke</label>
            <input
              id="strokeInput"
              type="text"
              value={
                localAttributes.stroke !== undefined
                  ? localAttributes.stroke
                  : ""
              }
              onChange={(e) => handleInputChange("stroke", e.target.value)}
              onFocus={(e) => e.target.select()}
              disabled={localAttributes.stroke === undefined}
              className={
                localAttributes.stroke === undefined ? styles.disabledInput : ""
              }
            />
            <input
              id="strokeColorInput"
              type="color"
              value={
                localAttributes.stroke !== undefined
                  ? localAttributes.stroke
                  : "#000000"
              }
              onChange={(e) => handleInputChange("stroke", e.target.value)}
            />
          </div>
          {localAttributes.stroke === undefined ? (
            <button
              className={styles.addAttribute}
              onClick={() => {
                addAttribute(localAttributes.id, "stroke", "#000000");
                setLocalAttributes((prev) => ({ ...prev, stroke: "#000000" }));
              }}
            >
              <IconAddAttribute />
            </button>
          ) : (
            <button
              className={styles.removeAttribute}
              onClick={() => {
                removeAttribute(localAttributes.id, "stroke");
                setLocalAttributes((prev) => {
                  const newAttrs = { ...prev };
                  delete newAttrs.stroke;
                  return newAttrs;
                });
              }}
            >
              <IconRemoveAttribute />
            </button>
          )}
        </div>

        {/* Stroke Width */}
        <div className={styles.addAttributeContainer}>
          <div
            className={
              localAttributes.strokeWidth === undefined
                ? `${styles.inputGroup} ${styles.disabledInput}`
                : styles.inputGroup
            }
          >
            <label htmlFor="strokeWidthInput">Stroke Width</label>
            <input
              id="strokeWidthInput"
              type="number"
              value={
                localAttributes.strokeWidth !== undefined
                  ? localAttributes.strokeWidth
                  : ""
              }
              onChange={(e) =>
                handleInputChange("strokeWidth", parseFloat(e.target.value))
              }
              onFocus={(e) => e.target.select()}
              disabled={localAttributes.strokeWidth === undefined}
              className={
                localAttributes.strokeWidth === undefined
                  ? styles.disabledInput
                  : ""
              }
            />
          </div>
          {localAttributes.strokeWidth === undefined ? (
            <button
              className={styles.addAttribute}
              onClick={() => {
                addAttribute(localAttributes.id, "strokeWidth", 1);
                setLocalAttributes((prev) => ({ ...prev, strokeWidth: 1 }));
              }}
            >
              <IconAddAttribute />
            </button>
          ) : (
            <button
              className={styles.removeAttribute}
              onClick={() => {
                removeAttribute(localAttributes.id, "strokeWidth");
                setLocalAttributes((prev) => {
                  const newAttrs = { ...prev };
                  delete newAttrs.strokeWidth;
                  return newAttrs;
                });
              }}
            >
              <IconRemoveAttribute />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LineEditor;
