import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  notificationAlerts: [],
};

export const notificationAlertsSlice = createSlice({
  name: 'notificationAlerts',
  initialState,
  reducers: {
    addNotificationAlert(state, {payload}) {
      state.notificationAlerts.push(payload);
    },
    updateNotificationAlert(state, {payload}) {
      state.notificationAlerts = state.notificationAlerts.map(obj =>
        obj.id === payload?.id ? {...obj, ...payload} : obj,
      );
    },
    deleteNotificationAlert(state, {payload}) {
      state.notificationAlerts = state.notificationAlerts.filter(
        obj => obj.id !== payload?.id,
      );
    },
  },
});

export const {
  addNotificationAlert,
  updateNotificationAlert,
  deleteNotificationAlert,
} = notificationAlertsSlice.actions;
