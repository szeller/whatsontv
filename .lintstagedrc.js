export default {
  '*.ts': [
    'prettier --write',
    'eslint --fix',
    'jest --bail --findRelatedTests'
  ]
};
