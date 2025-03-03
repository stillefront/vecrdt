import { FC } from "react";
import CircleEditor from "./CircleEditor";
import RectEditor from "./RectEditor";
import GroupEditor from "./GroupEditor";
import LineEditor from "./LineEditor";

type AttributeEditorProps = {
  element: any;
  onChange: (key: string, value: any) => void;
};

const AttributeEditor: FC<AttributeEditorProps> = ({ element, onChange }) => {
  if (element.type === "circle") {
    return <CircleEditor attributes={element} onChange={onChange} />;
  }
  if (element.type === "rect") {
    return <RectEditor attributes={element} onChange={onChange} />;
  }
  if (element.type === "group") {
    return <GroupEditor attributes={element} onChange={onChange} />;
  }
  if (element.type === "line") {
    return <LineEditor attributes={element} onChange={onChange} />;
  }

  return <div>No editor for this kind of element</div>;
};

export default AttributeEditor;
