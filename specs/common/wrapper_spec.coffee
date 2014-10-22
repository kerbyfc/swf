describe "Helpers", ->


describe "swf.define", ->

  beforeEach ->
    @w1 = swf.define('w1', (fn) -> return -> fn arguments...)
    @w2 = swf.define('wp2', swf.w1 )

  it "should throw with wrong arguments", ->
    for call in [(-> swf.define()), (-> swf.define(null)), (-> swf.define('', {})), (-> swf.define('', [])), (-> swf.define('', (->)))]
      call.should.throw()

  describe "swf.define(String, Function)", ->

    beforeEach ->
      @wrapper = swf.define('test', (fn) -> fn arguments...)

    it "should return wrapper function", ->
      @wrapper.should.be.a.function

    it "should store SWF instance in swf", ->
      swf.test.should.be.a.function

  describe "swf.define(String, SWF object)", ->

    it "should return wrapper function", ->
      @w2.should.be.a.function

    it "should store SWF instance in swf", ->
      swf.wp2.should.be.a.function

  describe "swf.define(String, function)()", ->

    it "should return an instance of SWF", ->
      for w in [swf.w1(), swf.wp2()]
        w.should.be.an.instanceof SWF

describe "SWF", ->

  beforeEach ->

    # target function
    @fn = (arg, arg1, arg2, arg3) -> return "" + arg + (arg1 || "") + (arg2 || "") + (arg3 || "")

    # wrappers
    @a  = (fn, arg1)             -> args = swf._args(arguments).slice(1); return -> fn.apply(fn, swf._args(arguments).concat(args))
    @b  = (fn, arg1, arg2)       -> args = swf._args(arguments).slice(1); return -> fn.apply(fn, swf._args(arguments).concat(args))
    @c  = (fn, arg1, arg2, arg3) -> args = swf._args(arguments).slice(1); return -> fn.apply(fn, swf._args(arguments).concat(args))

    swf.define 'a', @a
    swf.define 'b', @b
    swf.define 'c', @c

    swf.define 'ab', swf.a(3).b(2)
    swf.define 'abc', swf.a(4).b(3).c(2)

  it "should extend global $ object with swf function", ->
    swf.define.should.be.a.function

  it "should throw with wrong arguments", ->
    for call in [(-> new SWF({})), (-> new SWF([])), (-> new SWF(/.*/)), (-> new SWF('')), (-> new SWF(2))]
      call.should.throw()

  describe ".$", ->

    it "should wrap function", ->
      swf.a(2).$(@fn)(1).should.be.eq '12'

    it "should wrap class", ->
      a = class A
        test: ->
          true
      swf.define 'wrapper', -> return -> @bar = 2; return this
      swf.wrapper().$ A, {proto: true, self: false, ctor: false, depth: 1}
      b = new A
      b.test().should.be.an.instanceof A
      b.bar.should.be.eq 2

      swf.createAlias('_')
      swf.patchFunction('$')

      b = class B
        test: ->
          true

      _.define 'wrapper', (fn, arg) -> swf.a(3); return -> @bar = arg; return this
      swf.removeAlias()
      swf.createAlias('$')

      B.$ $.wrapper(3), {proto: true, self: false, ctor: false, depth: 1}
      b = new B
      b.test().should.be.an.instanceof B
      b.bar.should.be.eq 3


  describe ".expand", ->

    it "should save wrapper function to SWF object wrappers batch", ->
      a = swf.a(5)
      a.$(@fn)(1).should.be.eq "15"

    it "should expand wrapper with another one", ->
      swf.ab().$(@fn)(1).should.be.eq "123"

    it "should expand wrapper with two another wrappers", ->
      swf.abc().$(@fn)(1).should.be.eq "1234"




# TODO
# describe "$.when().then()", ->

#   swf.define 'wait', (fn, fns...) ->
#     promises = []
#     data = []

#     check = (i, d) ->
#       data[i] = d
#       for p in promises
#         return false unless p
#       fn(data)

#     ->
#       for f, i in fns
#         do(f, i) ->
#           promises[i] = false
#           f( (d) -> promises[i] = true; check(i, d) )

#   $.wait.extend
#     then: (finish) ->
#       this.$(finish)()

#   fn1 = (done) -> setTimeout( (-> done('ok')) , 500)
#   fn2 = (done) -> setTimeout( (-> done('yaahoooo!')) , 2000)

#   $.wait( fn1, fn2 ).then( (a) -> console.log(a) )

# describe("@expand", function(){

#   beforeEach(function(){

#     this.a = function(fn){

#       var override = function() {

#         this.tested = true;

#         fn.apply(fn, Array.prototype.slice.call(arguments));

#       };

#       override.tested = false;

#       return override;

#     }

#     swf.define('protected', this.a);

#   });

#   it("`$.protected()` should return an instance of wrapper", function(){

#     $.protected().should.be.instanceof(SWF)

#   });

#   it("`$.protected()` should should push wrapper to SWF instance .batch array", function(){

#     var wrapper = $.protected();

#     wrapper.batch[0].should.be.equal({wrap: this.a, name: 'protected', args: []});

#   });

#   it("`$.protected('arg')` should register arguments in .batch", function(){

#     var wrapper = $.protected('arg');

#     expect(wrapper.batch[0]).toEqual({wrap: this.a, name: 'protected', args: ['arg']});

#   });

# });

# describe("@$", function(){

#   beforeEach(function(){

    # this.a = function(fn){

    #   var override = function() {

    #     "protected";

    #     return fn.apply(fn, Array.prototype.slice.call(arguments));

    #   };

    #   return override;

    # };

    # this.b = function(fn, testValue){

    #   var override = function(){

    #     "second";

    #     return fn.apply(fn, Array.prototype.slice.call(arguments).concat(testValue));

    #   }

    #   return override;

    # };

    # this.c = function(fn) {

    #   return function() {

    #     return fn.apply(fn, Array.prototype.slice.call(arguments));

    #   }

    # };

    # this.fn = function(test){

    #   if (test) {

    #     return test;

    #   }

    #   return 1;

    # };

    # swf.define('protected', this.a);

    # swf.define('second', this.b);

    # swf.define('mywrapper', $.protected().second('val2') );

    # swf.define('test', this.c );

#   });

#   it('\n\n$protected().$(function(){\n  return 1;\n})();\n\n should wrap function with queued wrappers', function(){

#     expect($.protected().$(this.fn)()).toEqual(1);

#   });

#   it('\n\n$protected().second().$(function(){\n  return 1;\n});\n\n should wrap function with multiple queued wrappers', function(){

#     var test = $.protected().second('val').$(this.fn)();

#     expect(test).toEqual('val');

#   });

#   it('\n\nfunction(){\n  return 1;\n}.protected().second();\n\n should wrap function with multiple queued wrappers', function(){

#     var test = this.fn.$( $.protected().second('val1') );

#     expect(test()).toEqual('val1');

#   });

#   it('\n\nfunction(){\n  return 1;\n}.protected().second();\n\n should wrap function with multiple queued wrappers', function(){

#     var test = this.fn.$( $.mywrapper() );

#     expect(test()).toEqual('val2');

#   });

#   it('should be override wrapper queue', function(){

#     var test2 = this.fn.$( $.mywrapper({second: $.second('val3')}) );

#     expect(test2()).toEqual('val3');

#   });

#   it('should remove wrapper from swf queue', function(){

    # var test2 = this.fn.$( $.mywrapper({second: null}) );

    # expect(test2()).toEqual(1);

#   });

#   it('predefined wrapper should be usable in chains', function(){

    # var test = $.test().$(this.fn);

    # expect(test()).toEqual(1);

    # var test2 = $.mywrapper().test().$(this.fn);

    # expect(test2()).toEqual('val2');

    # function(){}.$( $.fsm('some', function(fn){return fajsdlfj alsdjflasdf}) )

    # var test3 = $.test().mywrapper().$(this.fn);

    # expect(test3()).toEqual('val2');

#   });

#   it('create wrapper instance', function(){

    # var instance = $.second('lol');

    # var fn1 = function(arg){

    #   return arg + "!";

    # }

    # expect(fn1.$(instance)()).toEqual("lol!");

    # var fn2 = function(arg){

    #   return arg;

    # }

    # expect(fn2.$(instance)()).toEqual("lol");

#   });

# });
