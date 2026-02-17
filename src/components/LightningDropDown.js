import {useCallback, useState} from 'react';
import DokDropdown from './DokDropdown';

const data = [
  {label: 'Receive via Lightning Address', value: 'lightning_address'},
  {label: 'Receive via BTC mainnet', value: 'btc_mainnet'},
  {label: 'Receive via Invoice', value: 'invoice'},
];

export default function LightningDropDown({
  isLightning,
  handleLightningDropDownChange,
}) {
  const [selectedValue, setSelectedValue] = useState(data[0].value);

  const handleOnChangeValue = useCallback(
    item => {
      setSelectedValue(item.value);
      handleLightningDropDownChange(item.value);
    },
    [handleLightningDropDownChange],
  );

  if (!isLightning) return null;

  return (
    <DokDropdown
      title=""
      data={data}
      value={selectedValue}
      onChangeValue={handleOnChangeValue}
      placeholder="Select Invoice Type"
    />
  );
}
