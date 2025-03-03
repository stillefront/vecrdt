import { Vec2, AutomergeVec2 } from "../utils/Vec2";

export type SvgElement =
  | CircleElement
  | RectElement
  | LineElement
  | GroupElement;

export interface BaseElement {
  id: string;
  parentId: string;
  type: "circle" | "rect" | "line" | "group";
  pos: Vec2 | AutomergeVec2;
  relPos: Vec2 | AutomergeVec2;
  endPos?: Vec2 | AutomergeVec2;
  endRelPos?: Vec2 | AutomergeVec2;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
}

export interface CircleElement extends BaseElement {
  type: "circle";
  radius: number;
}

export interface RectElement extends BaseElement {
  type: "rect";
  width: number;
  height: number;
}

export interface LineElement extends BaseElement {
  type: "line";
  endPos: Vec2 | AutomergeVec2;
  endRelPos: Vec2 | AutomergeVec2;
}

export interface GroupElement extends BaseElement {
  type: "group";
  order: string[]; // ordering element layers
}
