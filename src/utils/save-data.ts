export const mergeSaveData = <T extends object>(saved: unknown, defaults: T): T => {
  if (typeof saved !== 'object' || saved === null) {
    return { ...defaults };
  }

  return { ...defaults, ...(saved as Partial<T>) };
};
