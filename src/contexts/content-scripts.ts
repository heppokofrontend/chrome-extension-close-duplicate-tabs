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

const run = () => {
  void getLocalStorage('saveData').then((saveData) => {
    window.removeEventListener('click', onClick);

    if (saveData.forcedChangeURLWhenClickedAnchorLink) {
      window.addEventListener('click', onClick);
    }
  });
};

window.addEventListener('focus', () => {
  run();
});
run();
