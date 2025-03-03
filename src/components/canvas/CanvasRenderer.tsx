import { GroupElement, SvgElement } from "../../types/SvgElements";
import { Vec2 } from "../../utils/Vec2";
import { Camera } from "../../types/Camera";
import { PeerInfo } from "../../types/PeerInfo";

type groupAttributes = {
  fill: string | undefined;
  stroke: string | undefined;
  strokeWidth: number | undefined;
};

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  public camera: Camera;
  private elements: Record<string, SvgElement> = {};
  private elementOrder: string[] = [];
  private orderedElements: Record<string, SvgElement> = {};
  private lastHoveredElement: SvgElement | null = null;
  private animationFrameId: number | null = null;
  private selectedElement: SvgElement | null = null;
  private previewElement: SvgElement | null = null;
  private peers: Record<string, PeerInfo> = {};

  constructor(ctx: CanvasRenderingContext2D, camera: Camera) {
    this.ctx = ctx;
    this.camera = camera;
  }

  public setPreviewElement(element: SvgElement | null) {
    this.previewElement = element;
    this.render();
  }

  public setElements(
    elements: Record<string, SvgElement>,
    elementOrder: string[]
  ) {
    this.elements = elements;
    this.elementOrder = elementOrder;
    this.orderedElements = this.computeRenderList();
    // addition for synchronization of selected elements, in order to update bounding box position
    if (this.selectedElement) {
      const updatedElement = this.orderedElements[this.selectedElement.id];
      if (updatedElement) {
        this.selectedElement = updatedElement;
      } else {
        this.selectedElement = null;
      }
    }
  }

  private computeRenderList(): Record<string, SvgElement> {
    const renderMap: Record<
      string,
      SvgElement & { groupContext?: groupAttributes }
    > = {};

    const traverse = (
      id: string,
      parentOffset: Vec2 = Vec2.zero(),
      groupContext?: groupAttributes
    ) => {
      const element = this.elements[id];
      if (!element) return;

      let newContext = groupContext;
      if (element.type === "group") {
        // take the group context and overwrite nonexisting attribute fields inside of elements
        newContext = {
          fill: element.fill || groupContext?.fill,
          stroke: element.stroke || groupContext?.stroke,
          strokeWidth: element.strokeWidth || groupContext?.strokeWidth,
        };
      }

      // calculate absolute positions from relative positions
      const absolutePos = parentOffset.add(element.relPos);

      if (element.type === "line") {
        const absoluteEndPos = parentOffset.add(element.endRelPos);
        renderMap[id] = {
          ...element,
          pos: absolutePos,
          endPos: absoluteEndPos,
          groupContext: newContext,
        };
      } else {
        renderMap[id] = {
          ...element,
          pos: absolutePos,
          groupContext: newContext,
        };
      }

      if (element.type === "group") {
        const group = element as GroupElement;
        group.order.forEach((childId) =>
          traverse(childId, absolutePos, newContext)
        );
      }
    };

    this.elementOrder.forEach((id) => traverse(id));
    return renderMap;
  }

  public getElements(): Record<string, SvgElement> {
    return this.elements;
  }

  public setPeers(peers: Record<string, PeerInfo>) {
    this.peers = peers;
  }

  private clearCanvas() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  public resizeCanvas(width: number, height: number) {
    this.ctx.canvas.width = width;
    this.ctx.canvas.height = height;
  }

  public render() {

    if (this.animationFrameId !== null) return;

    // requestAnimationFrame for smoother rendering
    this.animationFrameId = requestAnimationFrame(() => {
      this.clearCanvas();
      this.drawElements();

      if (this.previewElement) {
        this.drawElement(this.previewElement);
      }

      if (this.peers) {
        this.drawCursors(this.peers);
      }
      // bounding box rendering
      if (this.selectedElement) {
        this.drawBoundingBox(this.selectedElement);
      }
      this.animationFrameId = null;
    });
  }

  // helpers for interaction
  private drawBoundingBox(element: SvgElement) {
    const renderedElement = this.orderedElements[element.id];
    if (!renderedElement) return;
    let x = 0,
      y = 0,
      width = 0,
      height = 0;

    if (element.type === "circle") {
      // bounding box for circles
      const radius = element.radius + (element.strokeWidth || 1) / 2;
      x = (element.pos.__x - radius - this.camera.pos.x()) * this.camera.zoom;
      y = (element.pos.__y - radius - this.camera.pos.y()) * this.camera.zoom;
      width = 2 * radius * this.camera.zoom;
      height = 2 * radius * this.camera.zoom;
    } else if (element.type === "rect") {
      const halfStroke = (element.strokeWidth || 1) / 2 + 0.5;
      x =
        (element.pos.__x - halfStroke - this.camera.pos.x()) * this.camera.zoom;
      y =
        (element.pos.__y - halfStroke - this.camera.pos.y()) * this.camera.zoom;
      width = ((element.width || 0) + halfStroke * 2) * this.camera.zoom;
      height = ((element.height || 0) + halfStroke * 2) * this.camera.zoom;
    } else if (element.type === "line") {
      // https://medium.com/@egimata/understanding-and-creating-the-bounding-box-of-a-geometry-d6358a9f7121
      const x1 = Math.min(element.pos.__x, element.endPos.__x);
      const y1 = Math.min(element.pos.__y, element.endPos.__y);
      const x2 = Math.max(element.pos.__x, element.endPos.__x);
      const y2 = Math.max(element.pos.__y, element.endPos.__y);

      const halfStroke = (element.strokeWidth || 1) / 2;
      const minX = x1 - halfStroke;
      const minY = y1 - halfStroke;
      const maxX = x2 + halfStroke;
      const maxY = y2 + halfStroke;

      x = (minX - this.camera.pos.x()) * this.camera.zoom;
      y = (minY - this.camera.pos.y()) * this.camera.zoom;
      width = (maxX - minX) * this.camera.zoom;
      height = (maxY - minY) * this.camera.zoom;
    } else {
      return;
    }

    // draw bounding box
    this.ctx.save();
    this.ctx.setLineDash([3, 3]);
    this.ctx.strokeStyle = "#ff0032";
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, width, height);
    this.ctx.restore();
  }

  private drawElements() {
    Object.values(this.orderedElements).forEach((element) => {
      const groupContext = (
        element as SvgElement & { groupContext?: groupAttributes }
      ).groupContext;
      this.drawElement(element, groupContext);
    });
  }

  private drawElement(element: SvgElement, context?: groupAttributes) {
    if (element.type === "circle") {
      this.drawCircle(element, context);
    } else if (element.type === "rect") {
      this.drawRectangle(element, context);
    } else if (element.type === "line") {
      this.drawLine(element, context);
    }
  }

  private drawCircle(circle: SvgElement, groupContext?: groupAttributes) {
    if (circle.type !== "circle") return;

    const fill = circle.fill || groupContext?.fill || "transparent";
    const stroke = circle.stroke || groupContext?.stroke || "#c3c4c3";
    const strokeWidth = circle.strokeWidth || groupContext?.strokeWidth || 0.5;

    this.ctx.beginPath();
    this.ctx.arc(
      (circle.pos.__x - this.camera.pos.x()) * this.camera.zoom,
      (circle.pos.__y - this.camera.pos.y()) * this.camera.zoom,
      circle.radius * this.camera.zoom,
      0,
      Math.PI * 2
    );
    this.ctx.fillStyle = fill;
    this.ctx.fill();
    this.ctx.lineWidth = strokeWidth * this.camera.zoom;
    this.ctx.strokeStyle = stroke;
    this.ctx.stroke();
  }

  private drawRectangle(rect: SvgElement, groupContext?: groupAttributes) {
    if (rect.type !== "rect") return;

    const fill = rect.fill || groupContext?.fill || "transparent";
    const stroke = rect.stroke || groupContext?.stroke || "#c3c4c3";
    const strokeWidth = rect.strokeWidth || groupContext?.strokeWidth || 0.5;

    const x = (rect.pos.__x - this.camera.pos.x()) * this.camera.zoom;
    const y = (rect.pos.__y - this.camera.pos.y()) * this.camera.zoom;
    const width = (rect.width || 0) * this.camera.zoom;
    const height = (rect.height || 0) * this.camera.zoom;

    this.ctx.fillStyle = fill;
    this.ctx.fillRect(x, y, width, height);

    this.ctx.lineWidth = strokeWidth * this.camera.zoom;
    this.ctx.strokeStyle = stroke;
    this.ctx.strokeRect(x, y, width, height);
  }

  private drawLine(line: SvgElement, groupContext?: groupAttributes) {
    if (line.type !== "line") return;
    if (!line.pos || !line.endPos) return;
    const start = line.pos;
    const end = line.endPos;

    const stroke =
      line.stroke ||
      (groupContext ? groupContext.stroke : undefined) ||
      "#c3c4c3";
    const strokeWidth =
      line.strokeWidth ||
      (groupContext ? groupContext.strokeWidth : undefined) ||
      0.5;
    const x1 = (start.__x - this.camera.pos.x()) * this.camera.zoom;
    const y1 = (start.__y - this.camera.pos.y()) * this.camera.zoom;
    const x2 = (end.__x - this.camera.pos.x()) * this.camera.zoom;
    const y2 = (end.__y - this.camera.pos.y()) * this.camera.zoom;

    this.ctx.strokeStyle = stroke;
    this.ctx.lineWidth = strokeWidth * this.camera.zoom;
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }

  private drawCursors(peers: Record<string, PeerInfo>) {
    this.ctx.save();

    Object.values(peers).forEach(({ userColor, mousePosition }) => {
      const screenX =
        (mousePosition.x - this.camera.pos.x()) * this.camera.zoom;
      const screenY =
        (mousePosition.y - this.camera.pos.y()) * this.camera.zoom;
      //console.log(`drawing cursor for ${userId}: (${x}, ${y})`);

      // cursors as little circles
      this.ctx.beginPath();
      this.ctx.arc(screenX, screenY, 10, 0, Math.PI * 2);
      this.ctx.fillStyle = userColor;
      this.ctx.fill();
    });

    this.ctx.restore();
  }

  // change element modes
  public setMode(mode: string, id?: string): void {
    if (id) {
      const element = this.orderedElements[id];
      if (!element) return;
      this.selectedElement = element;
    } else {
      this.selectedElement = null;
    }

    switch (mode) {
      case "selected":
        /* console.log(
          `element ${id} with parent id ${this.selectedElement?.parentId} is selected`
        ); */
        break;
      case "default":
        if (this.selectedElement?.id === id) {
          this.selectedElement = null;
        }
        break;
      case "deselect":
        this.selectedElement = null;
        break;
      default:
        console.warn(`Unknown mode: ${mode}`);
        return;
    }
    this.render();
  }

  // Collision checks
  // todo: optimizations: quadtree collision checks!
  // todo: feature: bounding box for groups and recursive collision checks for elements in groups

  public isMouseOver(mouseX: number, mouseY: number): SvgElement | null {
    const worldX = this.camera.pos.x() + mouseX / this.camera.zoom;
    const worldY = this.camera.pos.y() + mouseY / this.camera.zoom;

    let hoveredElement: SvgElement | null = null;

    const traverseOrder = (order: string[]): boolean => {
      // start iterating from the end, since those elements are in foreground
      for (let i = order.length - 1; i >= 0; i--) {
        const id = order[i];
        const element = this.orderedElements[id];
        if (!element) continue;

        // http://www.jeffreythompson.org/collision-detection/point-circle.php
        if (element.type === "circle") {
          const dx = worldX - element.pos.__x;
          const dy = worldY - element.pos.__y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= element.radius) {
            hoveredElement = element;
            return true;
          }
        }
        // http://www.jeffreythompson.org/collision-detection/point-rect.php
        else if (element.type === "rect") {
          const rectX = element.pos.__x;
          const rectY = element.pos.__y;
          const rectWidth = element.width;
          const rectHeight = element.height;
          if (
            worldX >= rectX &&
            worldX <= rectX + rectWidth &&
            worldY >= rectY &&
            worldY <= rectY + rectHeight
          ) {
            hoveredElement = element;
            return true;
          }
        }
        // http://www.jeffreythompson.org/collision-detection/line-point.php
        else if (element.type === "line") {
          if (element.pos && element.endPos) {
            const d = this.distancePointToLineSegment(
              worldX,
              worldY,
              element.pos.__x,
              element.pos.__y,
              element.endPos.__x,
              element.endPos.__y
            );
            const tolerance = (element.strokeWidth || 1) * 1.5;
            if (d <= tolerance) {
              hoveredElement = element;
              console.log("line collision");
              return true;
            }
          }
        }
        // if element is a group, check every element inside it, based on order
        if (element.type === "group") {
          const group = element as GroupElement;
          if (traverseOrder(group.order)) {
            return true;
          }
        }
      }
      return false;
    };

    // start traversing trough root
    traverseOrder(this.elementOrder);

    // stump: hovering elements
    if (hoveredElement !== this.lastHoveredElement) {
      this.lastHoveredElement = hoveredElement;
      this.render();
    }

    return hoveredElement;
  }
  // http://www.jeffreythompson.org/collision-detection/line-point.php
  private distancePointToLineSegment = (
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let nearestX: number;
    let nearestY: number;
    if (param < 0) {
      nearestX = x1;
      nearestY = y1;
    } else if (param > 1) {
      nearestX = x2;
      nearestY = y2;
    } else {
      nearestX = x1 + param * C;
      nearestY = y1 + param * D;
    }

    const dx = px - nearestX;
    const dy = py - nearestY;
    return Math.sqrt(dx * dx + dy * dy);
  };
}
