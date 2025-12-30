import React, {useMemo} from 'react';
// this package already there in node_modules so ignore the warning
// noinspection NpmUsedModulesInstalled
import {useHeaderHeight} from '@react-navigation/elements';
import {SafeAreaView} from 'react-native-safe-area-context';

export function DokSafeAreaView({children, ...rest}) {
  const headerHeight = useHeaderHeight();

  const edges = useMemo(() => {
    const temp = ['left', 'right', 'bottom'];

    if (headerHeight === 0) {
      temp.push('top');
    }
    return temp;
  }, [headerHeight]);

  return (
    <SafeAreaView {...{edges}} {...rest}>
      {children}
    </SafeAreaView>
  );
}
