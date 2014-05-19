module.exports = function() {
  return {
    restrict: 'E',
    template: require('./template.html'),
    link: function($scope, element, attributes) {
      var teaser = element.children()[0];
      window.fitText(teaser);
    }
  }
};