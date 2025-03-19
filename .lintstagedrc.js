export default {
  '*.ts': [
    'eslint --fix',
    'NODE_OPTIONS="--experimental-vm-modules --no-warnings" jest --selectProjects unit --bail --findRelatedTests'
  ]
};
