import {
  type SaveDataType,
  applySaveDataPatch,
  defaultSaveData,
  getMessage,
  setSaveData,
} from '@/utils';

export const STATE = {
  dangerZoneIsOpen: false,
  saveData: defaultSaveData,
};

export const save = (patch: Partial<SaveDataType>) => {
  const previous = STATE.saveData;

  STATE.saveData = applySaveDataPatch(previous, patch);
  setSaveData(STATE.saveData).catch((error: unknown) => {
    // 失敗した書き込みの内容で STATE が storage と食い違ったままにならないよう、
    // 書き込み前の値へ巻き戻したうえでユーザーにも知らせる。
    STATE.saveData = previous;
    console.error(error);
    window.alert(getMessage('error_saveFailed'));
  });
};
