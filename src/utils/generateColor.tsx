export const generateColor = (peerId: string): string => {
  const hash = peerId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  const saturation = 60 + (hash % 20);
  const lightness = 50 + (hash % 10);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};
