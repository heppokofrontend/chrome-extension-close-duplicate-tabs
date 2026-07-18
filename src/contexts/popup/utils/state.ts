import { type SaveDataType, applySaveDataPatch, defaultSaveData, setSaveData } from '@/utils';

export const STATE = {
  dangerZoneIsOpen: false,
  saveData: defaultSaveData,
};

export const save = (patch: Partial<SaveDataType>) => {
  STATE.saveData = applySaveDataPatch(STATE.saveData, patch);
  setSaveData(STATE.saveData).catch((error: unknown) => {
    // 失敗すると STATE と storage が食い違ったままになるため、痕跡だけは残す。
    console.error(error);
  });
};
