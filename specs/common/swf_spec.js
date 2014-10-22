describe("swf", function() {

  beforeEach(function() {
    this.types = {
      Boolean: true,
      Number: 1,
      String: "",
      Function: function(){},
      Array: [],
      Date: new Date(),
      RegExp: /.*/,
      Object: {},
      Error: new Error(),
      Arguments: arguments
    };
  });

 describe("_class", function() {

    it("should return class name for native objects", function() {
      $.each(this.types, function(expectation, obj) {
        swf._class(obj).should.be.eq(expectation);
      });
    });

  });

  describe("_type", function() {

    it("should return lowercased type of native objects", function() {
      $.each(this.types, function(expectation, obj) {
        swf._type(obj).should.be.eq(expectation.toLowerCase());
      });
    });

  });

  describe("_etype", function() {

    it("should return class name & type for all objects (not null) and functions", function() {
      var etypes = {
        null: null,
        function: function(){},
        "Array function": Array,
        "Array object": [],
      }
      $.each(etypes, function(expectation, obj) {
        swf._etype(obj).should.be.eq(expectation);
      });
    })

  });

  describe("_isArray", function() {

    it("should check type strictly", function() {
      swf._isArray(arguments).should.be.false;
    });

  });

  describe("_args", function() {

    it("should parse arguments object to array", function() {
      swf._type(swf._args(arguments)).should.be.eq("array");
    });

  });

  describe("_extend", function() {

    it("should extend first given object with following", function() {
      var a = {a: 1, _: undefined},
          b = {b: 2},
          e = swf._extend(a, b, {_: null});
      e.should.be.eql({a: 1, b: 2, _: null}) && a.should.be.eql(e) && b.should.be.eql({b: 2})
    });

  });

  describe("define", function() {

    beforeEach(function(){
      this.wrapper = function(originFunction) {
        this.counter = 0;
        return function() {
          return originFunction.apply(this, swf._args(arguments));
        };
      };
      this.counter = swf.define('counter', this.wrapper);
    });

    it("should return function that return SWF instance", function() {
      this.counter.should.be.a.function;
      this.counter().should.be.an.instanceof(SWF);
    });

    it("should store this function in swf object", function(){
      this.counter.should.be.eq(swf.counter);
    });

    it("should assign to created function sign, implemenation and sacred props", function() {
      $.each({sign: 'counter', implementation: this.wrapper, sacred: false}, function(prop, expectation) {
        swf.counter[prop].should.be.eq(expectation);
      });
    });


    it("should throw with invalid arguments", function() {
      $.each([ [], [null], ['', {}], ['', []], ['', function(){}] ], function(args) {
        (function() { swf.define.apply(null, args) }).should.throw();
      });
    });

    it("should throw error when there are already sacred wrapper in swf", function() {
      swf.define('sacred', function(){}, true);
      (function(){ swf.define('sacred') }).should.throw();
    });

  });

  describe("createAlias", function() {

    it("should extend global object (by given name) with swf methods", function(){
      swf.createAlias('_');
      _.define.should.be.eq(swf.define);
      swf.removeAlias();
    });

    it("should throw an error when conflicts", function() {
      swf.define('defer', function(){});
      (function(){ swf.createAlias('$') }).should.throw();
    });

  });

  describe("removeAlias", function() {

    it("should remove extension", function() {

    });

  });

});

    // TODO SWF.prototype.sign test wrappers names
    /* swf.define('test', function(){} ); */
    /* console.log(swf.counter.sign); */
    /* console.log(swf.counter().sign()); */
    /* console.log( swf.counter('lol').test(2).sign(true), "counter.test" ); */
    /* console.log( swf.test.sign ); */
    /* console.log( swf.test().sign(true) ); */
    /* console.log( swf.counter().test.sign ); */
    /* console.log(swf.counter()._sign); */

    /* swf.define('group', swf.counter().test() ); */
    /* console.log(swf.group.sign); */
    /* console.log(swf.group().sign()) */
    /* console.log(swf.group().sign(true)) */
