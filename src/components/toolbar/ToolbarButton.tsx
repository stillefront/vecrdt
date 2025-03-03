import { FC } from "react";
import styles from "./ToolbarButton.module.scss";

interface ToolbarButtonProps {
  onClick: () => void;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  isActive?: boolean;
}

const ToolbarButton: FC<ToolbarButtonProps> = ({
  onClick,
  Icon,
  isActive = false,
}) => {
  return (
    <button
      className={`${styles.toolbarButton} ${isActive ? styles.active : ""}`}
      onClick={onClick}
    >
      <Icon className={styles.toolbarButtonIcon} />
    </button>
  );
};

export default ToolbarButton;
