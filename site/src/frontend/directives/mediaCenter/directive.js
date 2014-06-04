module.exports = ['$sce', function($sce) {
  return {
    restrict: 'E',
    template: require('./template.html'),
    scope: {
      file: '=',
      isTransferring: '=',
      currentTransfer: '=',
      isClient: '='
    },
    link: function($scope, element, attributes) {
      var video = element.find('video');

      $scope.$watch('src', function(src) {
        console.dir(element, $scope.file);
      });

      $scope.videoLoaded = function(event) {
        console.log('loaded', event);
      };

      $scope.saveFile = function() {
        var a = document.createElement('a');
        document.body.appendChild(a); // Firefox apparently needs this
        a.href = window.URL.createObjectURL($scope.file);
        a.download = $scope.file.name;
        a.click();
        a.remove();
      };
    },
    controller: function($scope) {
      $scope.$watch('file', function(file) {
        $scope.type = null;
        $scope.src = '';
        console.log(file);
        if (file) {
          var type = file.type.split('/')[0];

          $scope.type = type;
          $scope.src = $sce.trustAsResourceUrl(URL.createObjectURL(file));
        }
      });
    }
  };
}];