import { STATE, save } from '@/contexts/popup/state';
import { getMessage } from '@/utils';

interface Props {
  taskName: string;
  min: number;
  max: number;
}

export const buildRangeField = ({ taskName, min, max }: Props) => {
  const wrapper = document.createElement('p');
  const field = document.createElement('label');
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  let value = STATE.saveData.minCategorizeNumber ?? min;

  wrapper.className = 'textfield-for-range';
  field.insertAdjacentHTML(
    'afterbegin',
    `
    ${getMessage(`dialog_command_${taskName}_range1`, { allowEmpty: true })}
    <input type="number" min="${String(min)}" max="${String(max)}" value="${String(value)}" />
    ${getMessage(`dialog_command_${taskName}_range2`)}
  `,
  );
  field.querySelector('input')?.addEventListener('change', (e) => {
    if (e.target instanceof HTMLInputElement) {
      const valueAsNumber = e.target.valueAsNumber;
      const clamped = Number.isNaN(valueAsNumber)
        ? value
        : Math.min(max, Math.max(min, valueAsNumber));

      e.target.valueAsNumber = clamped;
      value = clamped;

      save({
        ...STATE.saveData,
        minCategorizeNumber: value,
      });
    }
  });
  wrapper.append(field);

  return { element: wrapper, getValue: () => value };
};
