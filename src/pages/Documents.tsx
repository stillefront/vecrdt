import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import styles from "./Documents.module.scss";
import { AnyDocumentId } from "@automerge/automerge-repo";

interface StoredDoc {
  key: string;
  value: any;
}

const automergeUrl = (url: string): string => {
  return url.startsWith("automerge:") ? url : `automerge:${url}`;
};

const Documents: React.FC = () => {
  const [docs, setDocs] = useState<StoredDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const repo = useRepo();

  // traverses indexeddb initialy and everytime docs are imported or deleted
  useEffect(() => {
    const openRequest = indexedDB.open("crdt-svg-editor", 1);

    openRequest.onerror = (event) => {
      console.error("can't open database:", event);
      setLoading(false);
    };

    openRequest.onsuccess = () => {
      const db = openRequest.result;
      const transaction = db.transaction("documents", "readonly");
      const store = transaction.objectStore("documents");

      const documents: StoredDoc[] = [];
      const cursorRequest = store.openCursor();

      cursorRequest.onerror = (event) => {
        console.error("document traversal error:", event);
        setLoading(false);
      };

      cursorRequest.onsuccess = (event: any) => {
        const cursor = event.target.result;
        if (cursor) {
          documents.push({ key: String(cursor.key), value: cursor.value });
          cursor.continue();
        } else {
          const filteredDocs = documents.filter((doc) => {
            const parts = doc.key.split(",");
            return parts.length >= 2 && parts[1] === "snapshot";
          });
          setDocs(filteredDocs);
          setLoading(false);
        }
      };
    };
  }, [importing]);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      await repo.import(uint8Array);
    } catch (err) {
      console.error("document import error:", err);
    }
    setImporting(false);
  };

  const handleExport = async (docId: string) => {
    const automergeId = automergeUrl(docId) as AnyDocumentId;
    try {
      const exported = await repo.export(automergeId);
      if (exported) {
        const blob = new Blob([exported], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${automergeId}.vecrdt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else {
        console.error("export failed.");
      }
    } catch (err) {
      console.error("export error:", err);
    }
  };

  const handleDelete = async (docId: string) => {
    const automergeId = automergeUrl(docId) as AnyDocumentId;
    setImporting(true);
    try {
      await repo.delete(automergeId);
    } catch (err) {
      console.error("deletion error:", err);
    }
    setImporting(false);
  };

  if (loading) {
    return <div>loading docs from indexeddb</div>;
  }

  return (
    <div className={styles.documentView}>
      <h2>svg-crdt</h2>
      <div className={styles.creationSection}>
        <label htmlFor="file-input" className={styles.creationButton}>
          import
        </label>
        <input
          id="file-input"
          type="file"
          accept=".vecrdt"
          onChange={handleImport}
          style={{ display: "none" }}
        />
        {importing && <p>importing</p>}
        <Link to={"/doc/new"} className={styles.docLink}>
          <button className={styles.creationButton}>
            <div>
              <strong>new</strong>
            </div>
          </button>
        </Link>
      </div>

      {docs.length === 0 ? (
        <p>no documents created yet</p>
      ) : (
        <ul className={styles.docList}>
          {docs.map((doc, index) => {
            // split the key into "id - 'snapshot' - hash"
            const parts = doc.key.split(",");
            const id = parts[0];
            return (
              <li key={index}>
                <Link
                  to={`/doc/${automergeUrl(id)}`}
                  className={styles.docLink}
                >
                  <div>
                    <strong>ID:</strong> {id}
                  </div>
                </Link>
                <div className={styles.docActions}>
                  <button onClick={() => handleExport(id)}>export</button>
                  <button onClick={() => handleDelete(id)}>delete</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Documents;
