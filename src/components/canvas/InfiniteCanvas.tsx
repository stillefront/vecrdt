import { useRef, useState, useEffect } from "react";
import { CanvasRenderer } from "./CanvasRenderer";
import { useCanvasInteractions } from "./useCanvasInteractions";
import { useDocumentContext } from "../../context/DocumentContext";
import { useRendererContext } from "../../context/RendererContext";
import { usePeerContext } from "../../context/PeerContext";
import { PeerInfo } from "../../types/PeerInfo";
import { Camera } from "../../types/Camera";

import Toolbar from "../toolbar/Toolbar";
import { Vec2 } from "../../utils/Vec2";

type Cursor = { drag: boolean };

export const InfiniteCanvas = () => {
  const { elements, elementOrder } = useDocumentContext();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRendererContext();
  const [camera, setCamera] = useState<Camera>({ pos: new Vec2(0,0), zoom: 1 });
  const [cursors, setCursor] = useState<Cursor>({ drag: false });
  const [activeMode, setActiveMode] = useState<string>("select");
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const { peerStates } = usePeerContext();

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) {
      console.error(
        "could not initialize CanvasRenderingContext2D."
      );
      return;
    }

    if (rendererRef.current === null) {
      console.log("instantiating CanvasRenderer in InfiniteCanvas.");
      rendererRef.current = new CanvasRenderer(ctx, camera);
    } else {
      rendererRef.current.camera = camera;
    }

    rendererRef.current.setElements(elements, elementOrder);

    // peer information for rendering multiple cursors

    const peers: Record<string, PeerInfo> = {};
    Object.entries(peerStates).forEach(([peerId, peerState]) => {
      peers[peerId] = {
        userId: peerId,
        userColor: peerState.userColor,
        mousePosition: peerState.mousePosition,
      };
    });
    rendererRef.current.setPeers(peers);
    rendererRef.current.render();
  }, [elements, elementOrder, camera, rendererRef, peerStates]);

  useCanvasInteractions(
    canvasRef,
    camera,
    rendererRef,
    setCamera,
    setCursor,
    activeMode
  );

  useEffect(() => {
    const handleResize = () => {
      const newDimensions = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      setDimensions(newDimensions);

      // provide renderer updated information about viewport size
      if (rendererRef.current) {
        rendererRef.current.resizeCanvas(
          newDimensions.width,
          newDimensions.height
        );
        rendererRef.current.render();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <>
      <Toolbar setActiveMode={setActiveMode} activeMode={activeMode} />
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{
          border: "none",
          cursor: cursors.drag ? "grabbing" : "default",
        }}
      />
    </>
  );
};
