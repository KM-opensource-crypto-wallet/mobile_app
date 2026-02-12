import {LogLevel, OneSignal} from 'react-native-onesignal';

/**
 * Centralized OneSignal SDK Manager
 * All OneSignal SDK interactions should go through this class
 */
class OneSignalManager {
  static instance = null;

  constructor() {
    if (OneSignalManager.instance) {
      return OneSignalManager.instance;
    }
    OneSignalManager.instance = this;
    this.initialized = false;
  }

  static getInstance() {
    if (!OneSignalManager.instance) {
      OneSignalManager.instance = new OneSignalManager();
    }
    return OneSignalManager.instance;
  }

  /**
   * Initialize OneSignal SDK
   * @param {string} appId - OneSignal App ID
   * @param {boolean} verbose - Enable verbose logging (default: false for production)
   */
  initialize(appId, verbose = __DEV__) {
    if (this.initialized) {
      console.warn('OneSignal already initialized');
      return;
    }

    try {
      // Set log level (verbose in development, warn in production)
      OneSignal.Debug.setLogLevel(verbose ? LogLevel.Verbose : LogLevel.Warn);

      // Initialize OneSignal
      OneSignal.initialize(appId);

      // Request push notification permission (required for iOS prompt and Android 13+)
      OneSignal.Notifications.requestPermission(true);

      this.initialized = true;
      console.log('OneSignal initialized successfully');
    } catch (error) {
      console.error('Error initializing OneSignal:', error);
    }
  }

  /**
   * Login user with external ID
   * @param {string} externalId - External user ID
   */
  login(externalId) {
    if (!this.initialized) {
      console.warn('OneSignal not initialized');
      return;
    }

    try {
      OneSignal.login(externalId);
      console.log('OneSignal user logged in:', externalId);
    } catch (error) {
      console.error('Error logging in to OneSignal:', error);
    }
  }

  /**
   * Logout current user
   */
  logout() {
    if (!this.initialized) {
      console.warn('OneSignal not initialized');
      return;
    }

    try {
      OneSignal.logout();
      console.log('OneSignal user logged out');
    } catch (error) {
      console.error('Error logging out from OneSignal:', error);
    }
  }

  /**
   * Add email to current user
   * @param {string} email - User email address
   */
  setEmail(email) {
    if (!this.initialized) {
      console.warn('OneSignal not initialized');
      return;
    }

    try {
      OneSignal.User.addEmail(email);
      console.log('OneSignal email added:', email);
    } catch (error) {
      console.error('Error adding email to OneSignal:', error);
    }
  }

  /**
   * Remove email from current user
   * @param {string} email - User email address
   */
  removeEmail(email) {
    if (!this.initialized) {
      console.warn('OneSignal not initialized');
      return;
    }

    try {
      OneSignal.User.removeEmail(email);
      console.log('OneSignal email removed:', email);
    } catch (error) {
      console.error('Error removing email from OneSignal:', error);
    }
  }

  /**
   * Add SMS number to current user
   * @param {string} smsNumber - User SMS number
   */
  setSmsNumber(smsNumber) {
    if (!this.initialized) {
      console.warn('OneSignal not initialized');
      return;
    }

    try {
      OneSignal.User.addSms(smsNumber);
      console.log('OneSignal SMS number added:', smsNumber);
    } catch (error) {
      console.error('Error adding SMS number to OneSignal:', error);
    }
  }

  /**
   * Remove SMS number from current user
   * @param {string} smsNumber - User SMS number
   */
  removeSmsNumber(smsNumber) {
    if (!this.initialized) {
      console.warn('OneSignal not initialized');
      return;
    }

    try {
      OneSignal.User.removeSms(smsNumber);
      console.log('OneSignal SMS number removed:', smsNumber);
    } catch (error) {
      console.error('Error removing SMS number from OneSignal:', error);
    }
  }

  /**
   * Add a tag to the current user
   * @param {string} key - Tag key
   * @param {string} value - Tag value
   */
  addTag(key, value) {
    if (!this.initialized) {
      console.warn('OneSignal not initialized');
      return;
    }

    try {
      OneSignal.User.addTag(key, value);
      console.log(`OneSignal tag added: ${key} = ${value}`);
    } catch (error) {
      console.error('Error adding tag to OneSignal:', error);
    }
  }

  /**
   * Add multiple tags to the current user
   * @param {Object} tags - Object containing key-value pairs
   */
  addTags(tags) {
    if (!this.initialized) {
      console.warn('OneSignal not initialized');
      return;
    }

    try {
      OneSignal.User.addTags(tags);
      console.log('OneSignal tags added:', tags);
    } catch (error) {
      console.error('Error adding tags to OneSignal:', error);
    }
  }

  /**
   * Remove a tag from the current user
   * @param {string} key - Tag key
   */
  removeTag(key) {
    if (!this.initialized) {
      console.warn('OneSignal not initialized');
      return;
    }

    try {
      OneSignal.User.removeTag(key);
      console.log(`OneSignal tag removed: ${key}`);
    } catch (error) {
      console.error('Error removing tag from OneSignal:', error);
    }
  }

  /**
   * Remove multiple tags from the current user
   * @param {Array<string>} keys - Array of tag keys
   */
  removeTags(keys) {
    if (!this.initialized) {
      console.warn('OneSignal not initialized');
      return;
    }

    try {
      OneSignal.User.removeTags(keys);
      console.log('OneSignal tags removed:', keys);
    } catch (error) {
      console.error('Error removing tags from OneSignal:', error);
    }
  }

  /**
   * Get the current user's OneSignal ID
   * @returns {string|null} OneSignal user ID
   */
  getOnesignalId() {
    if (!this.initialized) {
      console.warn('OneSignal not initialized');
      return null;
    }

    try {
      return OneSignal.User.onesignalId;
    } catch (error) {
      console.error('Error getting OneSignal ID:', error);
      return null;
    }
  }

  /**
   * Get the current user's external ID
   * @returns {string|null} External user ID
   */
  getExternalId() {
    if (!this.initialized) {
      console.warn('OneSignal not initialized');
      return null;
    }

    try {
      return OneSignal.User.externalId;
    } catch (error) {
      console.error('Error getting external ID:', error);
      return null;
    }
  }

  /**
   * Set log level
   * @param {LogLevel} level - Log level
   */
  setLogLevel(level) {
    try {
      OneSignal.Debug.setLogLevel(level);
    } catch (error) {
      console.error('Error setting log level:', error);
    }
  }
}

export default OneSignalManager.getInstance();
