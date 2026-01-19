import {useCallback, useState} from 'react';
import DokDropdown from './DokDropdown';

const data = [
  {label: 'Receive via Lightning Address'},
  {label: 'Receive via BTC mainnet'},
  {label: 'Receive via Invoice'},
];
export default function LightningDropDown({
  isLightning,
  handleLightningDropDownChange,
}) {
  const [selectedValue, setSelectedValue] = useState(data[0].label);

  const handleOnChangeValue = useCallback(
    item => {
      setSelectedValue(item.label);
      handleLightningDropDownChange(item.label);
    },
    [handleLightningDropDownChange],
  );

  if (!isLightning) return null;

  return (
    <DokDropdown
      title=""
      data={data}
      value={selectedValue?.value}
      onChangeValue={handleOnChangeValue}
      placeholder="Select Invoice Type"
    />
  );
}
