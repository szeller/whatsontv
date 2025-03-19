export const consoleOutput = {
  log: (message?: string): void => {
    console.log(message);
  },
  error: (message?: string, ...args: unknown[]): void => {
    console.error(message, ...args);
  }
};
