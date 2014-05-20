module.exports = function controlCenterDirective() {
  return {
    restrict: 'E',
    template: require('./template.html'),
    scope: {
      connections: '='
    },
    link: function($scope, element, attributes) {
    },
    controller: ['$scope', 'host', function($scope, host) {
      if (host.file) {
        $scope.showInfo = true;
      }

      var fileName = host.file ? host.file.name : '';  // We probably shouldn't even do this

      $scope.emailSubject = encodeURI('I want to send you ' + fileName);
      $scope.emailBody = encodeURI('Get it from me at ' + $scope.currentUrl);
    }]
  };
};