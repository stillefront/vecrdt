import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// pages
import EditorView from "./pages/EditorView.tsx";
import Documents from "./pages/Documents.tsx";

import "./styles/base.scss";

// automerge import
import { Repo } from "@automerge/automerge-repo";
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { RepoContext } from "@automerge/automerge-repo-react-hooks";


const repo = new Repo({
  network: [new BrowserWebSocketClientAdapter("wss://sync.automerge.org")],
  storage: new IndexedDBStorageAdapter("crdt-svg-editor", "documents"),
});


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RepoContext.Provider value={repo}>
      <Router>
        <Routes>
          <Route path="/" element={<Documents />} />
          <Route path="/doc/:docId/" element={<EditorView />} />
          <Route path="/doc/" element={<EditorView />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </RepoContext.Provider>
  </React.StrictMode>
);
