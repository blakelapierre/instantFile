var angular = require('angular');

module.exports = angular.module('instantFile', ['ngRoute'])
  
  .directive('instantFile',   require('./directives/instantFile/directive'))
  .directive('teaser',        require('./directives/teaser/directive'))
  .directive('commandCenter', require('./directives/commandCenter/directive'))
  .directive('controlCenter', require('./directives/controlCenter/directive'))
  .directive('mediaCenter',   require('./directives/mediaCenter/directive'))
  .directive('statsCenter',   require('./directives/statsCenter/directive'))

  .directive('fileDropArea',  require('./directives/util/fileDropArea/directive'))
  .directive('fitText',       require('./directives/util/fitText/directive'))
  .directive('selectOnClick', require('./directives/util/selectOnClick/directive'))

  .factory('host',  require('./factories/host/factory'))
  .factory('rtc',   require('./factories/rtc/factory'))

  .config(function($routeProvider, $compileProvider) {
    $routeProvider
      .when('/:id', {
        template: '<command-center></command-center>'
      })
      .otherwise({
        template: '<teaser></teaser>'
      });

      $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|file|blob):|data:image\//);
  });