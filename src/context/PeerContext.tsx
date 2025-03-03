import React, { createContext, useContext } from "react";
import {
  useLocalAwareness,
  useRemoteAwareness,
} from "@automerge/automerge-repo-react-hooks";
import { DocHandle } from "@automerge/automerge-repo/slim";

interface PeerContextType {
  localState: any;
  setLocalState: (state: any) => void;
  peerStates: { [userId: string]: any };
  heartbeats: { [userId: string]: number };
}

const PeerContext = createContext<PeerContextType | null>(null);

export const PeerProvider = ({
  children,
  handle,
  userId,
  initialState,
}: {
  children: React.ReactNode;
  handle: DocHandle<unknown>;
  userId: string;
  initialState: any;
}) => {
  const [localState, setLocalState] = useLocalAwareness({
    handle,
    userId,
    initialState,
    heartbeatTime: 15000,
  });

  // remote awareness payload
  const [peerStates, heartbeats] = useRemoteAwareness({
    handle,
    localUserId: userId, // filtering own messages
    offlineTimeout: 3000,
  });

  return (
    <PeerContext.Provider
      value={{
        localState,
        setLocalState,
        peerStates,
        heartbeats,
      }}
    >
      {children}
    </PeerContext.Provider>
  );
};

export const usePeerContext = () => {
  const context = useContext(PeerContext);
  if (!context) {
    throw new Error("usePeerContext must be used within a PeerProvider");
  }
  return context;
};
