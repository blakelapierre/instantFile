module.exports = function() {
  return {
    restrict: 'E',
    template: require('./template.html'),
    link: function($scope, element, attributes) {
      window.fitText(element.children()[0]);
      // function resize() {
      //   console.log(element);
      //   element.css('font-size', '200px');
      // }

      // resize();

      // window.addEventListener('resize', resize);
      // window.addEventListener('orientationchange', resize);
    }
  }
};