import { FC, useEffect, useState } from "react";
import styles from "./Editor.module.scss";
import { useDocumentContext } from "../../context/DocumentContext";
import { docAttributes } from "../../types/SvgDocument";

import { calculateViewBox } from "../FileManager/ExportSvg";
import { generateSvg } from "../FileManager/ExportSvg";

const DocumentEditor: FC = () => {
  const {
    changeDocName,
    getDocAttributes,
    printDocument,
    elements,
    elementOrder,
  } = useDocumentContext();
  const [localAttributes, setLocalAttributes] = useState<docAttributes>(
    getDocAttributes()
  );
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const attributes = getDocAttributes();
    setLocalAttributes(attributes);
  }, [getDocAttributes]);

  const handleInputChange = (key: keyof docAttributes, value: any) => {
    const updatedAttributes = { ...localAttributes, [key]: value };
    setLocalAttributes(updatedAttributes);

    if (key === "docName") {
      changeDocName(value);
    } else return;
  };

  return (
    <div className={styles.editorContainer}>
      <div className={styles.documentHeader}>
        {isEditing ? (
          <input
            type="text"
            value={localAttributes.docName}
            onChange={(e) => handleInputChange("docName", e.target.value)}
            onBlur={() => setIsEditing(false)}
            onFocus={(e) => e.target.select()}
            className={styles.docNameEdit}
            autoFocus
          />
        ) : (
          <h3 className={styles.docName} onClick={() => setIsEditing(true)}>
            {localAttributes.docName}
          </h3>
        )}
      </div>

      <div className={styles.groupActions}>
        <button
          onClick={() => {
            calculateViewBox(elements, elementOrder);
          }}
        >
          viewbox
        </button>
        <button
          onClick={() => {
            printDocument();
          }}
        >
          print doc
        </button>
        <button
          onClick={() => {
            generateSvg(elements, elementOrder);
          }}
        >
          svg export
        </button>
      </div>
    </div>
  );
};

export default DocumentEditor;
