export const MainNavigation = {
  navigationRef: null,

  setNavigationObject(tempNav) {
    if (tempNav) {
      this.navigationRef = tempNav;
    }
  },

  navigate(navigateData) {
    this.navigationRef?.navigate(navigateData);
  },

  reset(navigateData) {
    this.navigationRef?.reset(navigateData);
  },

  getCurrentRouteName() {
    return this.navigationRef?.getCurrentRoute?.()?.name;
  },
};
