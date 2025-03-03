import { FC } from "react";
import styles from "./Toolbar.module.scss";
import Pointer from "../../assets/icons/icon_pointer.svg?react";
import Circle from "../../assets/icons/icon_circle.svg?react";
import Rectangle from "../../assets/icons/icon_rectangle.svg?react";
import Bezier from "../../assets/icons/icon_bezier.svg?react";

import ToolbarButton from "./ToolbarButton";

interface ToolbarProps {
  setActiveMode: (mode: string) => void;
  activeMode: string;
}

const Toolbar: FC<ToolbarProps> = ({ setActiveMode, activeMode }) => {
  return (
    <div className={styles.toolBar}>
      <ToolbarButton
        onClick={() => setActiveMode("select")}
        Icon={Pointer}
        isActive={activeMode === "select"}
      />
      <ToolbarButton
        onClick={() => setActiveMode("createCircle")}
        Icon={Circle}
        isActive={activeMode === "createCircle"}
      />
      <ToolbarButton
        onClick={() => setActiveMode("createRectangle")}
        Icon={Rectangle}
        isActive={activeMode === "createRectangle"}
      />
      <ToolbarButton
        onClick={() => setActiveMode("createLine")}
        Icon={Bezier}
        isActive={activeMode === "createLine"}
      />
    </div>
  );
};

export default Toolbar;
