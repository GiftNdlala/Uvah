let sessionExpiredHandler = null;

export const setSessionExpiredHandler = (handler) => {
  sessionExpiredHandler = handler;
};

export const notifySessionExpired = () => {
  sessionExpiredHandler?.();
};
