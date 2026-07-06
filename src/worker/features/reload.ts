import type { SaveDataType } from '@/utils';
import { getTabs } from '@/worker/utils';

interface Params {
  saveData: SaveDataType;
}

/** タブをすべてリロードする */
export const runReload = async ({ saveData }: Params) => {
  const tabs = await getTabs(saveData);

  for (const { id } of tabs) {
    if (typeof id === 'number') {
      // NOTE: リロード後に音声を停止させる処理を実装したいが、現状 tabs 経由では不可能な模様
      void chrome.tabs.reload(id);
    }
  }
};
