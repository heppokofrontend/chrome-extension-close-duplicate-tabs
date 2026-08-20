import { STATE, save } from '@/contexts/popup/state';
import { getMessage } from '@/utils';

interface Props {
  taskName: string;
}

export const buildRangeField = ({ taskName }: Props) => {
  const wrapper = document.createElement('p');
  const field = document.createElement('label');
  let value = STATE.saveData.minCategorizeNumber;

  wrapper.className = 'textfield-for-range';
  field.insertAdjacentHTML(
    'afterbegin',
    `
    ${getMessage(`dialog_command_${taskName}_range1`, { allowEmpty: true })}
    <input type="number" value="${String(value)}" min="0" />
    ${getMessage(`dialog_command_${taskName}_range2`)}
  `,
  );
  field.querySelector('input')?.addEventListener('change', (e) => {
    if (e.target instanceof HTMLInputElement) {
      const valueAsNumber = e.target.valueAsNumber;
      const next = Number.isNaN(valueAsNumber) ? value : Math.abs(valueAsNumber);

      e.target.valueAsNumber = next;
      value = next;

      save({
        ...STATE.saveData,
        minCategorizeNumber: value,
      });
    }
  });
  wrapper.append(field);

  return { element: wrapper, getValue: () => value };
};
