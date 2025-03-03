import React, { createContext, useContext } from "react";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { SvgDocument, docAttributes } from "../types/SvgDocument";
import { AnyDocumentId } from "@automerge/automerge-repo";
import { GroupElement, SvgElement } from "../types/SvgElements";
import { Vec2 } from "../utils/Vec2";

import * as Automerge from "@automerge/automerge";

interface DocumentContextType {
  elements: SvgDocument["elements"];
  elementOrder: SvgDocument["order"];
  addElement: (element: SvgElement) => void;
  removeElement: (elementId: string) => void;
  moveElement: (elementId: string, parentId: string | "root") => void;
  updateElement: (
    elementId: string,
    updatedProperties: Partial<SvgElement>
  ) => void;
  addAttribute: (elementId: string, key: keyof SvgElement, value: any) => void;
  removeAttribute: (elementId: string, key: keyof SvgElement) => void;
  findElementById: (elementId: string) => SvgElement | undefined;
  changeOrder: (elementId: string, newIndex: number) => void;
  printDocument: () => void;
  changeDocName: (docName: string) => void;
  getDocAttributes: () => docAttributes;
}

const DocumentContext = createContext<DocumentContextType | null>(null);

export const DocumentProvider = ({
  docUrl,
  children,
}: {
  docUrl: AnyDocumentId;
  children: React.ReactNode;
}) => {
  const [doc, changeDoc] = useDocument<SvgDocument>(docUrl);

  const printDocument = () => {
    changeDoc((doc) => {
      console.log(
        "current crdt object:",
        Automerge.view(doc, Automerge.getHeads(doc))
      );
    });
  };

  const updateTime = () => {
    changeDoc((doc) => {
      const now = new Date().toISOString();
      doc.lastUpdate = now;
    });
  };

  const getDocAttributes = (): docAttributes => {
    if (!doc) {
      return {
        docName: "",
        createdAt: "",
        lastUpdate: "",
      };
    }
    return {
      docName: doc.docName,
      createdAt: doc.createdAt,
      lastUpdate: doc.lastUpdate,
    };
  };

  const changeDocName = (docName: string) => {
    changeDoc((doc) => {
      doc.docName = docName;
      console.log(`changeDocName: changed document name to ${doc.docName}`);
    });
  };


  const addElement = (element: SvgElement) => {
    changeDoc((doc) => {
      if (element.type === "group") {
        doc.elements[element.id] = {
          ...element,
          order: [], // cast to automerge list
        };
      } else {
        doc.elements[element.id] = element;
      }
      doc.order.push(element.id); // add to order array for svg rendering
    });
    updateTime();
  };


  const removeElement = (elementId: string) => {
    changeDoc((doc) => {
      const element = doc.elements[elementId];
      if (!element) return;

      const parentId = element.parentId;
      if (parentId && doc.elements[parentId]?.type === "group") {
        const parentGroup = doc.elements[parentId];
        if (parentGroup.type === "group") {
          parentGroup.order = parentGroup.order.filter(
            (orderId) => orderId !== elementId
          );
        }
      } else {
        doc.order = doc.order.filter((orderId) => orderId !== elementId);
      }
      delete doc.elements[elementId];
    });
    updateTime();
  };

  const computeAbsolutePosition = (doc: any, elementId: string): Vec2 => {
    const element = doc.elements[elementId];
    if (!element) return Vec2.zero();
    if (element.parentId === "root") {
      return Vec2.from(element.relPos);
    } else {
      const parentAbs = computeAbsolutePosition(doc, element.parentId);
      return parentAbs.add(Vec2.from(element.relPos));
    }
  };

  const moveElement = (elementId: string, newParentId: string | "root") => {
    changeDoc((doc) => {
      const element = doc.elements[elementId];
      if (!element) {
        console.error(`moveElement: Element ${elementId} not found.`);
        return;
      }

      if (newParentId !== "root" && !doc.elements[newParentId]) {
        console.error(`moveElement: Parent ${newParentId} does not exist.`);
        return;
      }

      if (
        newParentId !== "root" &&
        doc.elements[newParentId]?.type !== "group"
      ) {
        console.error(`moveElement: Parent ${newParentId} is not a group.`);
        return;
      }

      if (elementId === newParentId) {
        console.error(
          `moveElement: Element ${elementId} can not be its own parent.`
        );
        return;
      }

      const currentParentId = element.parentId;
      if (currentParentId === newParentId) {
        console.log(
          `moveElement: Element ${elementId} allready in ${newParentId}.`
        );
        return;
      }

      // Bcalculate the absolute position for further proceedings
      const absolutePos = computeAbsolutePosition(doc, elementId);

      // just for the second point of line element
      let oldParentAbs = Vec2.zero();
      let absoluteEndPos = Vec2.zero();

      if (element.type === "line" && currentParentId === "root") {
        oldParentAbs = Vec2.zero();
        absoluteEndPos = oldParentAbs.add(element.endRelPos);
      } else if (element.type === "line" && currentParentId !== "root") {
        oldParentAbs = computeAbsolutePosition(doc, currentParentId);
        absoluteEndPos = oldParentAbs.add(Vec2.from(element.endRelPos));
      }

      // remove element from old parent
      if (currentParentId && doc.elements[currentParentId]?.type === "group") {
        const currentParent = doc.elements[currentParentId] as GroupElement;
        currentParent.order = currentParent.order.filter(
          (id) => id !== elementId
        );
      } else {
        doc.order = doc.order.filter((id) => id !== elementId);
      }

      // only change the relative position of the inserted element
      if (newParentId === "root") {
        doc.order.push(elementId);
        element.parentId = "root";
        // absolute and relative position have are the same in root, since root has no offset
        element.relPos = absolutePos.toObject();
        if (element.type === "line") {
          element.endRelPos = absoluteEndPos.toObject();
        }
      } else {
        const newParent = doc.elements[newParentId] as GroupElement;
        if (!newParent.order.includes(elementId)) {
          newParent.order.push(elementId);
        }
        element.parentId = newParentId;
        // calculate the new relative position, according to the absolute position of the parent
        const parentAbs = computeAbsolutePosition(doc, newParentId);
        element.relPos = absolutePos.sub(parentAbs).toObject();

        if (element.type === "line" && absoluteEndPos) {
          // calculate new relative position of the endpoint of a line
          element.endRelPos = absoluteEndPos.sub(parentAbs).toObject();
        }
      }

      console.log(`moveElement: Element ${elementId} moved to ${newParentId}`);
    });
    updateTime();
  };

  const addAttribute = (
    elementId: string,
    key: keyof SvgElement,
    value: any
  ) => {
    changeDoc((doc) => {
      const element = doc.elements[elementId];
      if (!element) {
        console.warn(`addAttribute: Element with ID ${elementId} not found.`);
        return;
      }
      (element as any)[key] = value; // weird hack, asserting that the type of key is available
    });
    updateTime();
  };

  const removeAttribute = (elementId: string, key: keyof SvgElement) => {
    changeDoc((doc) => {
      const element = doc.elements[elementId];
      if (!element) {
        console.warn(
          `removeAttribute: Element with ID ${elementId} not found.`
        );
        return;
      }
      if (element && key in element) {
        delete element[key];
      }
    });
    updateTime();
  };

  const updateElement = (
    elementId: string,
    updatedProperties: Partial<SvgElement>
  ) => {
    changeDoc((doc) => {
      const element = doc.elements[elementId];
      if (!element) {
        console.warn(`updateElement: Element with ID ${elementId} not found.`);
        return;
      }

      if (element.type !== "group") {
        Object.assign(element, updatedProperties);
        return;
      }

      const group = element as GroupElement;
      const oldPos = Vec2.from(group.pos);
      const newPos = updatedProperties.pos
        ? Vec2.from(updatedProperties.pos)
        : oldPos;
      const translation = newPos.sub(oldPos); // calculate group translation

      // update positions of children as well
      group.order.forEach((childId) => {
        const child = doc.elements[childId];
        if (!child) return;

        child.pos = Vec2.from(child.pos).add(translation).toObject();
        if (child.endPos) {
          child.endPos = Vec2.from(child.endPos).add(translation).toObject();
        }
      });

      Object.assign(group, updatedProperties);
    });
    updateTime();
  };

  const changeOrder = (elementId: string, newIndex: number) => {
    changeDoc((doc) => {
      const element = doc.elements[elementId];
      if (!element) {
        console.error(`changeOrder: Element with ID ${elementId} not found.`);
        return;
      }

      const parentId = element.parentId;

      if (parentId !== "root" && doc.elements[parentId]?.type === "group") {
        const parentGroup = doc.elements[parentId] as GroupElement;
        const currentIndex = parentGroup.order.findIndex(
          (id) => id === elementId
        );
        if (currentIndex === -1) {
          console.error(
            `changeOrder: Element ${elementId} not in group ${parentId}.`
          );
          return;
        }

        parentGroup.order.splice(currentIndex, 1);

        const clampedIndex = Math.max(
          0,
          Math.min(newIndex, parentGroup.order.length)
        );
        parentGroup.order.splice(clampedIndex, 0, elementId);
        console.log(
          `changeOrder: Element ${elementId} in group ${parentId} was moved from ${currentIndex} to ${clampedIndex}.`
        );
      } else {
        // reordering in root
        const currentIndex = doc.order.findIndex((id) => id === elementId);
        if (currentIndex === -1) {
          console.error(`changeOrder: Element ${elementId} not in root.`);
          return;
        }

        // delete element
        doc.order.splice(currentIndex, 1);
        // indices between 0 and order.length are valid
        const clampedIndex = Math.max(0, Math.min(newIndex, doc.order.length));
        doc.order.splice(clampedIndex, 0, elementId);
        console.log(
          `changeOrder: Element ${elementId} in root was moved from ${currentIndex} to ${clampedIndex}.`
        );
      }
    });
    updateTime();
  };

  const findElementById = (elementId: string): SvgElement | undefined => {
    const element = doc?.elements[elementId];
    if (!element) {
      console.warn(`findElementById: Element with ID ${elementId} not found.`);
    }
    return element;
  };

  return (
    <DocumentContext.Provider
      value={{
        elements: doc?.elements || {},
        elementOrder: doc?.order || [],
        addElement,
        removeElement,
        moveElement,
        updateElement,
        addAttribute,
        removeAttribute,
        findElementById,
        changeOrder,
        printDocument,
        changeDocName,
        getDocAttributes,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocumentContext = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error(
      "useDocumentContext must be used within a DocumentProvider"
    );
  }
  return context;
};
