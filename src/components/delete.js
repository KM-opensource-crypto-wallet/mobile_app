// Delete.js

import React from 'react';
import {persistor} from 'redux/store';
import {wipeAllLocalData} from 'redux/storage/wipe';
import {TouchableOpacity, Text} from 'react-native';

const Delete = () => {
  const handleClearStorage = () => {
    console.log('Clearing storage');
    wipeAllLocalData({persistor}).catch(e => console.error(e));
    console.log('storage cleared');
  };

  return (
    <TouchableOpacity onPress={handleClearStorage}>
      <Text>Clear Storage</Text>
    </TouchableOpacity>
  );
};

export default Delete;
