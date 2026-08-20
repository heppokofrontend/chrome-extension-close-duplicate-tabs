import { initForcedChangeURLWhenClickedAnchorLink } from '@/contexts/content-scripts/features';

const run = () => {
  initForcedChangeURLWhenClickedAnchorLink();
};

window.addEventListener('focus', () => {
  run();
});
run();
