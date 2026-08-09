import React, {useCallback, useContext, useState} from 'react';
import {View, Text, TextInput, TouchableOpacity} from 'react-native';
import EditIcon from 'assets/images/icons/edit.svg';
import {validateNumberInInput} from 'dok-wallet-blockchain-networks/helper';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './SlippageEditorStyles';

// Inline slippage row. Edits happen in local draft state so the field can
// be cleared while typing (an empty redux value used to snap back to the
// backend default instantly). The new value is committed once, on blur —
// no more double refetch from onBlur + onSubmitEditing.
const SlippageEditor = ({slippage, backendSlippage, onCommit}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const displayValue = slippage || backendSlippage;

  const startEditing = useCallback(() => {
    setDraft(`${displayValue ?? ''}`);
    setIsEditing(true);
  }, [displayValue]);

  const onChangeDraft = useCallback(text => {
    setDraft(validateNumberInInput(text, 2));
  }, []);

  const finishEditing = useCallback(() => {
    setIsEditing(false);
    // Empty draft means "back to the provider default".
    if (draft !== `${slippage ?? ''}`) {
      onCommit?.(draft);
    }
  }, [draft, slippage, onCommit]);

  return (
    <View style={styles.row}>
      <Text style={styles.label}>Slippage tolerance</Text>
      {isEditing ? (
        <View style={styles.valueRow}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            autoFocus={true}
            value={draft}
            onChangeText={onChangeDraft}
            onBlur={finishEditing}
            placeholder={`${backendSlippage ?? ''}`}
            placeholderTextColor={theme.gray}
          />
          <Text style={styles.value}>%</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.valueRow}
          onPress={startEditing}
          hitSlop={{top: 8, left: 8, bottom: 8, right: 8}}
          accessibilityRole="button"
          accessibilityLabel="Edit slippage tolerance">
          <Text style={styles.value}>{`${displayValue}%`}</Text>
          <EditIcon
            width={14}
            height={14}
            fill={theme.gray}
            style={styles.editIcon}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SlippageEditor;
