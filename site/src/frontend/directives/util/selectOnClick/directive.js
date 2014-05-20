module.exports = function() {
  return {
    restrict: 'A',
    link: function($scope, element, attributes) {
      element.bind('click', function(e) {
        if (window.getSelection && document.createRange) {
            selection = window.getSelection();
            range = document.createRange();
            range.selectNodeContents(element[0]);
            selection.removeAllRanges();
            selection.addRange(range);
        } else if (document.selection && document.body.createTextRange) {
            range = document.body.createTextRange();
            range.moveToElementText(element[0]);
            range.select();
        }
      });
    }
  };
};