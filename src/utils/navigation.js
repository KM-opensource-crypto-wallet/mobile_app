export const MainNavigation = {
  navigationRef: null,
  setNavigationObject: tempNav => {
    if (tempNav) {
      MainNavigation.navigationRef = tempNav;
    }
  },
  navigate: navigateData => {
    MainNavigation.navigationRef?.navigate(navigateData);
  },
  reset: navigateData => {
    MainNavigation.navigationRef?.reset(navigateData);
  },
  getCurrentRouteName: () => {
    return MainNavigation.navigationRef?.getCurrentRoute?.()?.name;
  },
};
