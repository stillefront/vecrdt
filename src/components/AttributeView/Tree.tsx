import { useMemo, useState } from "react";
import { SvgElement, GroupElement } from "../../types/SvgElements";
import { useDocumentContext } from "../../context/DocumentContext";
import { Vec2 } from "../../utils/Vec2";
import { generateId } from "../../utils/generateId";
import IconGroup from "../../assets/icons/icon_group_small.svg?react";
import IconCircle from "../../assets/icons/icon_circle_small.svg?react";
import IconRect from "../../assets/icons/icon_rect_small.svg?react";
import IconLine from "../../assets/icons/icon_bezier_small.svg?react";

import styles from "./Tree.module.scss";

// creates a flat tree from given elements and renders
// a layer representation of the document
interface TreeProps {
  elements: Record<string, SvgElement>;
  elementOrder: string[];
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  selectedId: string | null;
  hoveredId: string | null;
}

interface TreeNode {
  id: string;
  parentId: string | null;
  element: SvgElement;
}

type DropType = "group" | "element" | null;

const getIndentationLevel = (
  nodeId: string,
  elements: Record<string, SvgElement>
): number => {
  let depth = 0;
  let currentElement = elements[nodeId];

  while (currentElement && currentElement.parentId !== "root") {
    depth++;
    currentElement = elements[currentElement.parentId];
  }

  return depth;
};

const Tree: React.FC<TreeProps> = ({
  elements,
  elementOrder,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
}) => {
  const { changeOrder, moveElement, addElement } = useDocumentContext();
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [dropType, setDropType] = useState<DropType>(null);

  const icons = {
    group: IconGroup,
    circle: IconCircle,
    rect: IconRect,
    line: IconLine,
  };

  // create flat tree

  const flatTree = useMemo(() => {
    const result: TreeNode[] = [];
    const elementMap = new Map(Object.entries(elements));

    // traverse recursivelly over the order list
    const traverse = (parentId: string, order: string[]) => {
      order.forEach((id) => {
        const element = elementMap.get(id);
        if (!element) {
          console.warn(`element list corrupt: element with ID ${id} not found.`);
          return;
        }

        result.push({ id: element.id, parentId, element });

        // if the found element is a group, traverse through all of its children elements
        if (element.type === "group") {
          const group = element as GroupElement;
          traverse(element.id, group.order);
        }
      });
    };

    // start with all elements which are in the root level
    const rootOrder = elementOrder.filter(
      (id) => elementMap.get(id)?.parentId === "root"
    );
    traverse("root", rootOrder);

    return result;
  }, [elements, elementOrder]);

  // drag operations

  const handleDragStart = (id: string) => {
    setDraggedItem(id);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDrop = (targetId: string) => {
    if (draggedItem === null || draggedItem === targetId) return;

    const draggedId: string = draggedItem;
    const draggedElement = elements[draggedId];
    const targetElement = elements[targetId];
    if (!draggedElement || !targetElement) return;

    // if our target is a group element, move the dragged element into it
    if (targetElement.type === "group") {
      // check if it is allready in this group
      if (draggedElement.parentId !== targetElement.id) {
        moveElement(draggedId, targetElement.id);
      }
    } else {
      // if our target is just normal element (circle, rect...),
      // move the element to the respective group (or root) by changing its parentId
      const newParentId = targetElement.parentId || "root";
      if (draggedElement.parentId !== newParentId) {
        moveElement(draggedId, newParentId);
      }

      // determine the new index for order, it is the same as the target element's
      let newIndex: number | undefined;
      if (newParentId === "root") {
        newIndex = elementOrder.findIndex((id) => id === targetId);
      } else {
        const parentGroup = elements[newParentId] as GroupElement;
        if (parentGroup && parentGroup.order) {
          newIndex = parentGroup.order.findIndex((id) => id === targetId);
        }
      }

      if (newIndex === undefined || newIndex < 0) return;

      // place the element in its new place
      changeOrder(draggedId, newIndex);
    }

    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragOver = (event: React.DragEvent, id: string) => {
    event.preventDefault();

    setDragOverItem(id);
    const hoveredElement = elements[id];
    console.log(`drags over element of type ${hoveredElement.type}`);

    // setting styles based on element type which an element is hovered over
    if (!hoveredElement) {
      setDropType(null);
      return;
    }
    if (hoveredElement.type === "group") {
      setDropType("group");
    } else {
      setDropType("element");
    }
  };

  // create group

  const createGroup = () => {
    const groupId = generateId(4);
    addElement({
      id: groupId,
      parentId: "root",
      type: "group",
      pos: new Vec2(0, 0),
      relPos: new Vec2(0, 0),
      order: [],
    } as GroupElement);
  };

  return (
    <div className={styles.docTree}>
      <div className={styles.treeHeader}>
        <h3>Layers</h3>
        <button
          title="create new group"
          className={styles.createGroupButton}
          onClick={createGroup}
        >
          <IconGroup />
        </button>
      </div>
      <div className={styles.treeContent}>
        {flatTree.map((node) => {
          const indentationLevel = getIndentationLevel(node.id, elements);
          const Icon = icons[node.element.type] || null;
          const isSelected = selectedId === node.id;
          const isHovered = hoveredId === node.id;

          return (
            <div
              key={node.id}
              className={`
              ${styles.treeNode} 
              ${isSelected ? styles.selected : ""} 
              ${isHovered ? styles.hovered : ""}
              ${draggedItem === node.id ? styles.dragging : ""} 
              ${
                dragOverItem === node.id
                  ? dropType === "group"
                    ? styles.dragoverGroup
                    : styles.dragoverElement
                  : ""
              }
            `}
              draggable
              style={{ marginLeft: `${indentationLevel * 16}px` }}
              onDragStart={() => handleDragStart(node.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(event) => handleDragOver(event, node.id)}
              onDrop={() => handleDrop(node.id)}
              onMouseEnter={() => onHover(node.id)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onSelect(node.id)}
            >
              <div className={styles.nodeContent}>
                {Icon && <Icon className={styles.icon} />}
                <span>{`${node.element.type}: ${node.id}`}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Tree;
