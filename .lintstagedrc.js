export default {
  '*.ts': [
    'eslint --fix',
    'jest --bail --findRelatedTests'
  ]
};
