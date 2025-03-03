// export svg file from automerge crdt

import { SvgElement } from "../../types/SvgElements";
import { GroupElement } from "../../types/SvgElements";

export const calculateViewBox = (
  elements: Record<string, SvgElement>,
  rootOrder: string[]
): string => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const traverse = (
    order: string[],
    parentOffset: { x: number; y: number }
  ) => {
    order.forEach((id) => {
      const element = elements[id];
      if (!element) return;

      const absX = parentOffset.x + element.relPos.__x;
      const absY = parentOffset.y + element.relPos.__y;

      if (element.type === "circle") {
        const r = element.radius;
        minX = Math.min(minX, absX - r);
        minY = Math.min(minY, absY - r);
        maxX = Math.max(maxX, absX + r);
        maxY = Math.max(maxY, absY + r);
      } else if (element.type === "rect") {
        const width = element.width || 0;
        const height = element.height || 0;
        minX = Math.min(minX, absX);
        minY = Math.min(minY, absY);
        maxX = Math.max(maxX, absX + width);
        maxY = Math.max(maxY, absY + height);
      } else if (element.type === "line") {
        if (element.endPos) {
          const endX = parentOffset.x + element.endRelPos.__x;
          const endY = parentOffset.y + element.endRelPos.__y;
          minX = Math.min(minX, absX, endX);
          minY = Math.min(minY, absY, endY);
          maxX = Math.max(maxX, absX, endX);
          maxY = Math.max(maxY, absY, endY);
        }
      } else if (element.type === "group") {
        const group = element;
        traverse(group.order, { x: absX, y: absY });
      }
    });
  };

  traverse(rootOrder, { x: 0, y: 0 });

  if (
    minX === Infinity ||
    minY === Infinity ||
    maxX === -Infinity ||
    maxY === -Infinity
  ) {
    return "0 0 100 100"; // default viewBox
  }

  const width = maxX - minX;
  const height = maxY - minY;
  console.log(`viewBox: ${minX} ${minY} ${width} ${height}`);
  return `${minX} ${minY} ${width} ${height}`;
};

export const generateSvg = (
  elements: Record<string, SvgElement>,
  rootOrder: string[]
): void => {
  const viewBox = calculateViewBox(elements, rootOrder);


  const attr = (name: string, value: any): string =>
    value !== undefined && value !== null ? ` ${name}="${value}"` : "";

  const traverse = (order: string[]): string => {
    let svgContent = "";

    order.forEach((id) => {
      const element = elements[id];
      if (!element) return;

      if (element.type === "group") {
        const group = element as GroupElement;
        svgContent +=
          `<g transform="translate(${element.relPos.__x}, ${element.relPos.__y})"` +
          `${attr("stroke", element.stroke)}${attr(
            "stroke-width",
            element.strokeWidth
          )}${attr("fill", element.fill)}>`;
        svgContent += traverse(group.order);
        svgContent += `</g>`;
      } else if (element.type === "circle") {
        svgContent +=
          `<circle cx="${element.relPos.__x}" cy="${element.relPos.__y}" r="${element.radius}"` +
          `${attr("fill", element.fill)}${attr("stroke", element.stroke)}${attr(
            "stroke-width",
            element.strokeWidth
          )} />`;
      } else if (element.type === "rect") {
        svgContent +=
          `<rect x="${element.relPos.__x}" y="${element.relPos.__y}" width="${element.width}" height="${element.height}"` +
          `${attr("fill", element.fill)}${attr("stroke", element.stroke)}${attr(
            "stroke-width",
            element.strokeWidth
          )} />`;
      } else if (element.type === "line") {
        svgContent +=
          `<line x1="${element.relPos.__x}" y1="${element.relPos.__y}" x2="${element.endRelPos.__x}" y2="${element.endRelPos.__y}"` +
          `${attr("stroke", element.stroke)}${attr(
            "stroke-width",
            element.strokeWidth
          )} />`;
      }
    });

    return svgContent;
  };

  const svgContent =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">` +
    `${traverse(rootOrder)}` +
    `</svg>`;

  const blob = new Blob([svgContent], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "exported-svg.svg";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
};
