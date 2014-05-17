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
            $scope.imageUrl = $sce.trustAsResourceUrl(URL.createObjectURL(file));
          }
        }
      });
    }
  };
}];