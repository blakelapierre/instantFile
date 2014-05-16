var angular = require('angular');

module.exports = angular.module('instantFile', [])

  .directive('instantFile',   require('./instantFile/directive'))