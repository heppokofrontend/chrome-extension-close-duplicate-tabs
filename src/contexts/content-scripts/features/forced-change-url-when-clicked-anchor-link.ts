import { getLocalStorage } from '@/utils';

const resolveTarget = (node: EventTarget | null) => {
  if (!(node instanceof Element)) {
    return null;
  }

  return node.closest('a');
};

const onClick = (e: MouseEvent) => {
  const anchor = resolveTarget(e.target);

  if (anchor?.getAttribute('href')?.startsWith('#')) {
    history.pushState(null, '', anchor.href);
  }
};

export const initForcedChangeURLWhenClickedAnchorLink = () => {
  void getLocalStorage('saveData').then((saveData) => {
    window.removeEventListener('click', onClick);

    if (saveData.forcedChangeURLWhenClickedAnchorLink) {
      window.addEventListener('click', onClick);
    }
  });
};
