import React, {useMemo} from 'react';
// this package already there in node_modules so ignore the warning
// noinspection NpmUsedModulesInstalled
import {useHeaderHeight} from '@react-navigation/elements';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {Platform, SafeAreaView as SafeAreaViewRn} from 'react-native'
export function DokSafeAreaView({children, ...rest}) {
  // const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top;
  const edges = useMemo(() => {
    const temp = ['left', 'right', 'bottom'];

    if (headerHeight === 0) {
      temp.push('top');
    }
    return temp;
  }, [headerHeight]);

  if(Platform.OS === 'ios'){
    return(
      <SafeAreaViewRn {...{edges}} {...rest}>
        {children}
      </SafeAreaViewRn>
    )
  }
  return (
    <SafeAreaView 
    {...{edges}}
     {...rest}
    >
      {children}
    </SafeAreaView>
  );
}
