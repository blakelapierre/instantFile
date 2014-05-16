module.exports = function instantFileDirective () {
  return {
    restrict: 'E',
    template: require('./template.html'),
    link: function($scope, element, attributes) {

    }
  };
};