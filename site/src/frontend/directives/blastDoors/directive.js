module.exports = function() {
  return {
    restrict: 'E',
    template: require('./template.html'),
    replace: true,
    scope: {
      messages: '=',
      doorsOpen: '='
    },
    link: function($scope, element, attributes) {
      $scope.$watch('doorsOpen', function(doorsOpen) {
        if (doorsOpen) element.addClass('open-doors');
        else element.removeClass('open-doors');
      });
    },
    controller: ['$scope', function($scope) {
      $scope.messages = $scope.messages || [];
    }]
  }
};