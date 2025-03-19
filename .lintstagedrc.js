export default {
  '*.ts': [
    'eslint --fix',
    'NODE_OPTIONS="--loader ts-node/esm" jest --selectProjects unit --bail --findRelatedTests'
  ]
};
