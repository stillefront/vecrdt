import { usePeerContext } from "../../context/PeerContext";

import styles from "./PeerView.module.scss";

const PeerView = ({}) => {
  const { localState, peerStates, heartbeats } =
    usePeerContext();

  const peers = [
    { id: localState.ownId, state: localState, isLocal: true },
    ...Object.entries(peerStates).map(([peerId, state]) => ({
      id: peerId,
      state,
      isLocal: false,
    })),
  ];

  return (
    <ul className={styles.peerViewContainer}>
      {peers.map((peer) => (
        <li
          key={peer.id}
          className={peer.isLocal ? styles.localPeer : styles.remotePeer}
        >
          <div
            style={{
              backgroundColor: peer.state.userColor,
            }}
            className={styles.peerInfo}
          >
            {peer.id.substring(0, 2).toUpperCase()}
            <div className={styles.tooltip}>
              ID: {peer.id} <br /> last seen:{" "}
              {new Date(heartbeats[peer.id] || 0).toLocaleTimeString()}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default PeerView;
