export default {
  '*.ts': [
    'eslint --config eslint.config.js --fix',
    'NODE_OPTIONS="--experimental-vm-modules --no-warnings" jest --selectProjects unit --bail --findRelatedTests --coverage=false'
  ]
};
