type Options = { allowEmpty: boolean };

const resolveArgs = (a?: string | string[] | Options, b?: Options) => {
  if (typeof a === 'object' && !Array.isArray(a)) {
    return {
      substitutions: undefined,
      options: a,
    };
  }

  return {
    substitutions: a,
    options: b,
  };
};

export const getMessage = (
  key: string,
  option1?: string | string[] | Options,
  option2?: Options,
) => {
  const { substitutions, options } = resolveArgs(option1, option2);
  const message = chrome.i18n.getMessage(key, substitutions);

  if (message === '' && options?.allowEmpty !== true) {
    throw new Error(`i18n message not found: ${key}`);
  }

  return message;
};
