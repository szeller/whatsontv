export default {
  '*.ts': [
    'eslint --fix',
    'NODE_OPTIONS=--experimental-vm-modules jest --selectProjects unit --bail --findRelatedTests'
  ]
};
