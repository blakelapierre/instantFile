var angular = require('angular');

module.exports = angular.module('instantFile', ['ngRoute'])
  
  .directive('commandCenter', require('./directives/commandCenter/directive'))
  .directive('instantFile',   require('./directives/instantFile/directive'))
  .directive('mediaCenter',   require('./directives/mediaCenter/directive'))
  .directive('statsCenter',   require('./directives/statsCenter/directive'))

  .directive('fileDropArea',  require('./directives/util/fileDropArea/directive'))

  .factory('host',  require('./factories/host/factory'))

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