export const generateId = (length: number) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const result = Array.from({ length }, () => {
    return chars.charAt(Math.floor(Math.random() * chars.length));
  });
  return result.join("");
};
