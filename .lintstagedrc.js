export default {
  // TypeScript files
  '*.{ts,tsx}': [
    'prettier --write',
    'eslint --fix --max-warnings 0',
    'jest --bail --findRelatedTests'
  ],
  // Config and documentation files
  '*.{js,jsx,json,md,yml}': ['prettier --write']
};
