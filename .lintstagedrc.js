export default {
  '*.ts': [
    'eslint --config eslint.config.js --fix',
    'npm run test:changed'
  ]
};
