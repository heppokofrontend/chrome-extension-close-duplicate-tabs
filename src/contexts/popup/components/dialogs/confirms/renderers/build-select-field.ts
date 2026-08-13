interface Props {
  label: string;
  options: { value: string; label: string }[];
}

export const buildSelectField = ({ label, options }: Props) => {
  const wrapper = document.createElement('p');
  const field = document.createElement('label');
  const labelText = document.createElement('span');
  const select = document.createElement('select');

  wrapper.className = 'select-in-dialog';
  labelText.className = 'select-in-dialog__label';
  labelText.textContent = label;

  for (const { value, label } of options) {
    const optionElement = document.createElement('option');

    optionElement.value = value;
    optionElement.textContent = label;
    select.appendChild(optionElement);
  }

  field.append(labelText, select);
  wrapper.append(field);

  return { element: wrapper, getValue: () => select.value };
};
