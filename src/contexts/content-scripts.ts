import { getSaveData } from '@/utils';

const onClick = (e: MouseEvent) => {
  if (e.currentTarget instanceof HTMLAnchorElement) {
    history.pushState(null, '', e.currentTarget.href);
  }
};
const run = () => {
  void getSaveData().then((saveData) => {
    const anchors = document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]');

    anchors.forEach((a) => {
      a.removeEventListener('click', onClick);

      if (saveData.forcedChangeURLWhenClickedAnchorLink) {
        a.addEventListener('click', onClick);
      }
    });
  });
};

window.addEventListener('focus', () => {
  run();
});
run();
