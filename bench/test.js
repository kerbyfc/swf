suite('Deffered', function() {

  benchmark('jQuery.when', function() {
    return true;
  });

  benchmark('swf.when', function() {
    return false;
  });

});
