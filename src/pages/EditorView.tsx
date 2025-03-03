import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import { isValidAutomergeUrl } from "@automerge/automerge-repo";
import { DocumentProvider } from "../context/DocumentContext";
import { PeerProvider } from "../context/PeerContext";
import App from "../App";
import { SvgDocument } from "../types/SvgDocument";
import { generateId } from "../utils/generateId";
import { generateColor } from "../utils/generateColor";

const EditorView: React.FC = () => {
  const { docId } = useParams<{ docId: string }>();
  const repo = useRepo();

  const [handle, setHandle] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  // try to find a valid automerge doc with provided id or create a new one
  useEffect(() => {
    async function init() {
      let foundHandle;
      if (docId && isValidAutomergeUrl(docId)) {
        foundHandle = repo.find<SvgDocument>(docId);
      } else {
        const now = new Date().toISOString();
        foundHandle = repo.create<SvgDocument>({
          elements: {},
          order: [],
          createdAt: now,
          lastUpdate: now,
          docName: "new Document",
        });
      }
      if (foundHandle.isReady()) {
        await foundHandle.isReady();
      }
      setHandle(foundHandle);
      setIsReady(true);
    }
    init();
  }, [docId, repo]);

  const userId = generateId(4);
  const initialState = {
    ownId: userId,
    userColor: generateColor(userId),
    mousePosition: { x: 0, y: 0 },
  };

  useEffect(() => {
    if (isReady && handle && handle.url) {
      window.history.replaceState(null, "", `/doc/${handle.url}`);
    }
  }, [isReady, handle]);

  if (!isReady || !handle || !handle.url) {
    return <div>loading document</div>;
  }

  return isReady ? (
    <DocumentProvider docUrl={handle.url}>
      <PeerProvider handle={handle} userId={userId} initialState={initialState}>
        <App />
      </PeerProvider>
    </DocumentProvider>
  ) : (
    <div>loading document</div>
  );
};

export default EditorView;
