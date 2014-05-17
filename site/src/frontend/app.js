var angular = require('angular');

module.exports = angular.module('instantFile', ['ngRoute'])
  
  .directive('commandCenter', require('./commandCenter/directive'))
  .directive('instantFile',   require('./instantFile/directive'))

  .directive('fileDropArea',  require('./util/fileDropArea/directive'))

  .factory('host',  require('./host/factory'))

  .config(function($routeProvider, $compileProvider) {
    $routeProvider
      .when('/:id', {
        template: '<command-center></command-center>'
      })
      .otherwise({
        template: '<instant-file></instant-file>'
      });

      $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|file|blob):|data:image\//);
  });