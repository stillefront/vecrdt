import { useEffect, useState } from "react";
import { CanvasRenderer } from "./CanvasRenderer";
import { SvgElement } from "../../types/SvgElements";
import { Vec2 } from "../../utils/Vec2";
import { Camera } from "../../types/Camera";
import { generateId } from "../../utils/generateId";
import { useDocumentContext } from "../../context/DocumentContext";
import { usePeerContext } from "../../context/PeerContext";
import { useSelectionContext } from "../../context/SelectionContext";

export const useCanvasInteractions = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  camera: Camera,
  rendererRef: React.RefObject<CanvasRenderer | null>,
  setCamera: React.Dispatch<React.SetStateAction<Camera>>,
  setCursor: React.Dispatch<React.SetStateAction<{ drag: boolean }>>,
  activeMode: string
) => {
  const { addElement, updateElement, removeElement, elements, elementOrder } =
    useDocumentContext();
  const [isDragging, setIsDragging] = useState(false);
  const [firstMousePos, setFirstMousePos] = useState<Vec2 | null>();
  const [lastMousePos, setLastMousePos] = useState<Vec2 | null>();
  const { selectedElement, setSelectedElement } = useSelectionContext();

  const { localState, setLocalState } = usePeerContext();

  const resetMousePos = () => {
    setFirstMousePos(null);
    setLastMousePos(null);
  };

  useEffect(() => {
    if (!canvasRef.current || !rendererRef.current) {
      console.warn("renderer or canvas not ready, interactions disabled");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ctrl+scroll = zoom, scroll = move canvas
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (e.ctrlKey) {
        // get the scroll delta
        const zoomFactor = Math.pow(0.99, e.deltaY * 0.1);
        const newZoom = camera.zoom * zoomFactor;

        // mouse Position in world coords before delta
        const mouseWorldBefore = new Vec2(
          camera.pos.x() + mouseX / camera.zoom,
          camera.pos.y() + mouseY / camera.zoom
        );
        // mouse Position in world coords after delta
        const mouseWorldAfter = new Vec2(
          camera.pos.x() + mouseX / newZoom,
          camera.pos.y() + mouseY / newZoom
        );

        // keep view centered by applying center in delta
        setCamera((prev) => ({
          pos: prev.pos.add(mouseWorldBefore.sub(mouseWorldAfter)),
          zoom: newZoom,
        }));
      } else {
        setCamera((prev) => ({
          pos: prev.pos.add(
            new Vec2(e.deltaX / prev.zoom, e.deltaY / prev.zoom)
          ),
          zoom: prev.zoom,
        }));
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      switch (e.button) {
        // left mouseButton
        case 0: {
          if (
            activeMode === "createCircle" ||
            activeMode === "createRect" ||
            activeMode === "createLine"
          ) {
            if (activeMode === "createLine") {
              console.log(mouseX + "||" + mouseY);
              console.log(camera.pos.x() + "||" + camera.pos.y());
              const worldPos = new Vec2(
                mouseX / camera.zoom + camera.pos.x(),
                mouseY / camera.zoom + camera.pos.y()
              );
              setFirstMousePos(worldPos);
              console.log("started drawing line");
              console.log("firstPos: " + firstMousePos);
            }
            return;
          }
          const element = rendererRef.current?.isMouseOver(mouseX, mouseY);
          if (element) {
            setSelectedElement(element);
            rendererRef.current?.setMode("selected", element.id);
            setLastMousePos(new Vec2(mouseX, mouseY));
          }

          break;
        }
        // middle mouseButton = dragging canvas
        case 1: {
          setIsDragging(true);
          setCursor({ drag: true });
          setLastMousePos(new Vec2(e.clientX, e.clientY));
          break;
        }
        default:
          break;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const worldMouseX = camera.pos.x() + mouseX / camera.zoom;
      const worldMouseY = camera.pos.y() + mouseY / camera.zoom;

      // share mouse coordinates
      setLocalState({
        ...localState,
        mousePosition: { x: worldMouseX, y: worldMouseY },
      });

      if (activeMode === "createLine" && firstMousePos) {
        const worldEnd = new Vec2(
          mouseX / camera.zoom + camera.pos.x(),
          mouseY / camera.zoom + camera.pos.y()
        );
        // render a preview element for lines
        const previewLine: SvgElement = {
          id: "preview", // just a mock id, since it is temporary
          parentId: "root",
          type: "line",
          pos: firstMousePos,
          relPos: firstMousePos,
          endPos: worldEnd,
          endRelPos: worldEnd,
          stroke: "#c3c4c3",
          strokeWidth: 0.5,
        };
        rendererRef.current?.setPreviewElement(previewLine);
        rendererRef.current?.render();
      }

      if (isDragging && lastMousePos) {
        const deltaX = e.clientX - lastMousePos.x();
        const deltaY = e.clientY - lastMousePos.y();

        setLastMousePos(new Vec2(e.clientX, e.clientY));

        setCamera((prev) => ({
          pos: prev.pos.sub(new Vec2(deltaX / prev.zoom, deltaY / prev.zoom)),
          zoom: prev.zoom,
        }));
        return;
      }
      if (selectedElement && lastMousePos) {
        // delta in canvas coordinate space
        const deltaX = (mouseX - lastMousePos.x()) / camera.zoom;
        const deltaY = (mouseY - lastMousePos.y()) / camera.zoom;

        setLastMousePos(new Vec2(mouseX, mouseY));

        if (selectedElement.type === "line") {
          // shift start and end point as well
          selectedElement.relPos.__x += deltaX;
          selectedElement.relPos.__y += deltaY;
          selectedElement.endRelPos.__x += deltaX;
          selectedElement.endRelPos.__y += deltaY;

          updateElement(selectedElement.id, {
            relPos: new Vec2(
              selectedElement.relPos.__x,
              selectedElement.relPos.__y
            ),
            endRelPos: new Vec2(
              selectedElement.endRelPos.__x,
              selectedElement.endRelPos.__y
            ),
          });
        } else {
          // shift only start point
          selectedElement.relPos.__x += deltaX;
          selectedElement.relPos.__y += deltaY;
          updateElement(selectedElement.id, {
            relPos: new Vec2(
              selectedElement.relPos.__x,
              selectedElement.relPos.__y
            ),
          });
        }

        rendererRef.current?.render();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 1) {
        setIsDragging(false);
        setCursor({ drag: false });
        resetMousePos();
      }

      if (e.button === 0) {
        if (activeMode === "createLine" && firstMousePos) {
          const rect = canvas.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          const worldEnd = new Vec2(
            mouseX / camera.zoom + camera.pos.x(),
            mouseY / camera.zoom + camera.pos.y()
          );
          const newLine: SvgElement = {
            id: generateId(10),
            parentId: "root",
            type: "line",
            pos: firstMousePos,
            relPos: firstMousePos,
            endPos: worldEnd,
            endRelPos: worldEnd,
          };
          addElement(newLine);
          rendererRef.current?.setPreviewElement(null);
          rendererRef.current?.setElements(elements, elementOrder);
          rendererRef.current?.render();
          resetMousePos();
        } else {
          setSelectedElement(null);
          resetMousePos();
        }
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!rendererRef.current) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const worldPos = new Vec2(
        mouseX / camera.zoom + camera.pos.x(),
        mouseY / camera.zoom + camera.pos.y()
      );

      if (activeMode === "createCircle") { // creation methods should be external, or part of an interface
        const newCircle: SvgElement = {
          id: generateId(10),
          parentId: "root",
          type: "circle",
          pos: worldPos,
          relPos: worldPos,
          radius: 20,
        };

        addElement(newCircle);

        rendererRef.current.setElements(elements, elementOrder);
        rendererRef.current.render();
        setFirstMousePos(null);
        setLastMousePos(null);
      } else if (activeMode == "createRectangle") {
        const newRectangle: SvgElement = {
          id: generateId(10),
          parentId: "root",
          type: "rect",
          pos: worldPos,
          relPos: worldPos,
          width: 40,
          height: 40,
        };

        addElement(newRectangle);
        rendererRef.current.setElements(elements, elementOrder);
        rendererRef.current.render();
        resetMousePos();
      } else if (activeMode === "select" && rendererRef.current) {
        const clickedElement = rendererRef.current.isMouseOver(mouseX, mouseY);
        if (clickedElement) {
          setSelectedElement(clickedElement);
          rendererRef.current?.setMode("selected", clickedElement.id);
        } else {
          setSelectedElement(null);
          rendererRef.current?.setMode("deselect");
        }
      }
    };

    canvas.addEventListener("wheel", handleWheel);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("click", handleClick);

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("click", handleClick);
    };
  }, [
    canvasRef,
    camera,
    rendererRef,
    activeMode,
    setCamera,
    setCursor,
    isDragging,
    firstMousePos,
    lastMousePos,
  ]);

  // todo: keyboard interactions should be moved to a dedicated useKeyboardInteractions hook!
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      //console.log(e);
      if (e.key === "Delete" || e.key === "Del") {
        if (selectedElement) {
          removeElement(selectedElement.id);
          setSelectedElement(null);

          rendererRef.current?.render();
        }
      } else if (e.key === "0") {
        const initCamera = { pos: new Vec2(0, 0), zoom: 1 };
        setCamera(initCamera);
        rendererRef.current?.render();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedElement, removeElement, setSelectedElement, rendererRef]);
};
