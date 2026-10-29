import {Linking} from 'react-native';
import {CONTACT_DETAILS, WL_APP_NAME} from 'utils/wlData';
import {markExpectedBackground} from 'utils/expectedBackground';
import {getSupportId} from 'services/logger';

// The Support ID is prefilled so support can find the user's Sentry logs
// (`user.id:<id>`) without asking for anything personal.
const supportIdDraft = () => {
  const supportId = getSupportId();
  return supportId ? `Support ID: ${supportId}\n\n` : '';
};

export const buildSupportEmailUrl = () => {
  const subject = encodeURIComponent(`${WL_APP_NAME} support`);
  const draft = supportIdDraft();
  const body = draft ? `&body=${encodeURIComponent(draft)}` : '';
  return `mailto:${CONTACT_DETAILS.email}?subject=${subject}${body}`;
};

// t.me/<username>?text= pre-fills the message box when the user can write in
// the chat (Telegram deep links); @dokwallet / @kimlwallet are contacts.
export const buildSupportTelegramUrl = () => {
  const draft = supportIdDraft();
  return draft
    ? `${CONTACT_DETAILS.telegram}?text=${encodeURIComponent(draft)}`
    : CONTACT_DETAILS.telegram;
};

export const openSupportEmail = async () => {
  try {
    markExpectedBackground();
    await Linking.openURL(buildSupportEmailUrl());
  } catch (e) {
    console.error('error in open emails', e);
  }
};

export const openSupportTelegram = async () => {
  try {
    if (CONTACT_DETAILS.telegram) {
      markExpectedBackground();
      await Linking.openURL(buildSupportTelegramUrl());
    }
  } catch (e) {
    console.error('error in open Telegram', e);
  }
};
