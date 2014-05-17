module.exports = function() {
  return {
    restrict: 'E',
    template: require('./template.html'),
    scope: {
      file: '=file'
    }
  };
};