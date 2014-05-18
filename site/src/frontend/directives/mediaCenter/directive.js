module.exports = ['$sce', function($sce) {
  return {
    restrict: 'E',
    template: require('./template.html'),
    scope: {
      file: '=file'
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