import { SvgElement } from "./SvgElements";

export interface SvgDocument {
  elements: {[key: string]: SvgElement};
  order: string[];
  createdAt?: string;
  lastUpdate?: string;
  docName?: string;
}

export type docAttributes = {
  docName?: string;
  createdAt?: string;
  lastUpdate?: string;
};
