declare namespace Message {
  export type ignoreType = 'noQuery' | 'noHash'
  export type ignore = {
    [key in ignoreType]?: boolean
  }

  export type task = 'remove' | 'reload'

  export type data = {
    ignore: ignore,
    task: task,
  }
};
