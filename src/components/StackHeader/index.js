import React from 'react';
import {getHeaderTitle, Header} from '@react-navigation/elements';

// Renders the same JS header (@react-navigation/elements) that the drawer uses,
// so native-stack screens get a header identical to the drawer screens instead
// of the platform-native one.
export default function StackHeader({navigation, route, options, back}) {
  return (
    <Header
      {...options}
      back={back}
      navigation={navigation}
      title={getHeaderTitle(options, route.name)}
    />
  );
}
