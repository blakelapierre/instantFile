module.exports = ['$sce', function($sce) {
  return {
    restrict: 'E',
    template: require('./template.html'),
    scope: {
      file: '=file'
    },
    controller: function($scope) {
      $scope.$watch('file', function(file) {
        console.log(file);
        if (file) {
          if (/image.*/.test(file.type)) {
            $scope.type = 'image';
            $scope.src = $sce.trustAsResourceUrl(URL.createObjectURL(file));
          }
          else if (/video.*/.test(file.type)) {
            $scope.type = 'video';
            $scope.src = $sce.trustAsResourceUrl(URL.createObjectURL(file));
          }
        }
      });
    }
  };
}];