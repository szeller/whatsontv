export default {
  '*.ts': [
    'eslint --config eslint.config.js',
    'npm run test:changed:no-coverage'
  ]
};
