const onClick = (e: MouseEvent) => {
  if (e.currentTarget instanceof HTMLAnchorElement) {
    history.pushState(null, '', e.currentTarget.href);
  }
};
const run = () => {
  chrome.storage.local.get('saveData', ({ saveData }: { saveData?: SaveDataType }) => {
    const anchors = document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]');

    anchors.forEach((a) => {
      a.removeEventListener('click', onClick);

      if (saveData?.foucedChangeURLWhenClickedAnchorLink) {
        a.addEventListener('click', onClick);
      }
    });
  });
};

window.addEventListener('focus', run);
run();
