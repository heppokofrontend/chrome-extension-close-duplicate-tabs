/** 確認モーダルのボタンがユーザーに選ばれたときに返す、UI上のアクション種別。 */
export type ActionCommand =
  | 'confirm'
  | 'cancel'
  | 'apply'
  | 'sortByUrl'
  | 'sortByTitle'
  | 'sortByHostAndTitle'
  | 'sortByLastAccessed'
  | 'show_duplicate'
  | 'gatherFromCurrentWindow'
  | 'gatherFromAllWindows';
