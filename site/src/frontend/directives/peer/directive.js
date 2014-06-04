module.exports = function() {
  return {
    restrict: 'E',
    template: require('./template.html'),
    scope: {
      peer: '='
    },
    link: function($scope, element, attributes) {
      console.log(attributes);
      $scope.$watch('peer', function(peer) {
        if (attributes['isHistorical'] == 'true') $scope.channels = peer.historicalChannels;
        else $scope.channels = peer.channels;
      });
    },
    controller: ['$scope', function($scope) {
      
    }]
  }
};