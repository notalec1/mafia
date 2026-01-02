// src/utils.js
export const generateRoomId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
};

export const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};