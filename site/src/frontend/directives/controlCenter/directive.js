module.exports = function controlCenterDirective() {
  return {
    restrict: 'E',
    template: require('./template.html'),
    scope: {},
    link: function($scope, element, attributes) {
      var shareButton = element.find('a');
      window.fitText(shareButton);

    },
    controller: ['$scope', 'host', function($scope, host) {
      if (host.file) {
        $scope.showInfo = true;
      }
      $scope.currentUrl = window.location.toString();

      var fileName = host.file ? host.file.name : '';  // We probably shouldn't even do this

      $scope.emailSubject = encodeURI('I want to send you ' + fileName);
      $scope.emailBody = encodeURI('Get it from me at ' + $scope.currentUrl);
    }]
  };
};