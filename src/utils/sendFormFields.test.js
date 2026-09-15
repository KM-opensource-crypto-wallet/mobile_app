import React from 'react';
import TestRenderer, {act} from 'react-test-renderer';
import {useFormik} from 'formik';
import {validationSchemaSendFunds} from 'utils/validationSchema';
import {setSendFormFields} from 'utils/sendFormFields';

const BALANCE = '1.5';
const BALANCE_CURRENCY = '100.00';

// A form in the state the send screens are in right after a QR scan: the
// address is filled in, the amount pair is still empty.
const renderScannedForm = () => {
  const ref = {current: null};
  const Form = () => {
    ref.current = useFormik({
      initialValues: {
        toAddress: 'scanned-address',
        amount: '',
        currencyAmount: '',
        memo: '',
      },
      validationSchema: validationSchemaSendFunds({balanceAmount: BALANCE}),
      onSubmit: () => {},
    });
    return null;
  };
  act(() => {
    TestRenderer.create(<Form />);
  });
  return ref;
};

describe('setSendFormFields', () => {
  it('leaves no amount error when Max fills both amount fields', async () => {
    const formik = renderScannedForm();

    await act(async () => {
      await setSendFormFields(formik.current.setValues, {
        amount: BALANCE,
        currencyAmount: BALANCE_CURRENCY,
      });
    });

    expect(formik.current.values.amount).toBe(BALANCE);
    expect(formik.current.values.currencyAmount).toBe(BALANCE_CURRENCY);
    expect(formik.current.errors.amount).toBeUndefined();
  });

  it('writes every field it is given in one pass', async () => {
    const formik = renderScannedForm();

    await act(async () => {
      await setSendFormFields(formik.current.setValues, {
        toAddress: 'another-address',
        amount: BALANCE,
        currencyAmount: BALANCE_CURRENCY,
      });
    });

    expect(formik.current.values).toMatchObject({
      toAddress: 'another-address',
      amount: BALANCE,
      currencyAmount: BALANCE_CURRENCY,
      memo: '',
    });
  });

  // Pins the formik behaviour that setSendFormFields exists to avoid:
  // setFieldValue validates against the values captured in the current
  // render, so back-to-back calls each validate with the other field stale
  // and the last call's errors win. Here the surviving pass is the
  // currencyAmount one, which still sees amount === '' and reports it as
  // missing - the stale "invalid amount" error users saw after Max.
  it('two setFieldValue calls leave a stale error on the field set first', async () => {
    const formik = renderScannedForm();

    await act(async () => {
      formik.current.setFieldValue('amount', BALANCE);
      await formik.current.setFieldValue('currencyAmount', BALANCE_CURRENCY);
    });

    expect(formik.current.values.amount).toBe(BALANCE);
    expect(formik.current.errors.amount).toBeDefined();
  });
});
