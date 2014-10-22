describe "SWF", ->

  describe ".$", ->

    it "should wrap function", ->

      swf.define 'default', (fn, value) ->
        (val) ->
          fn(val || value)

      fn = (arg) ->
        "! #{arg}"

      wrapped = swf.default('default value').$( fn )

      wrapped("value").should.be.eq "! value"
      wrapped().should.be.eq "! default value"

    it "should wrap object", ->

      log = []

      @helpers =

        capitalize: (str) ->
          str[0].toUpperCase() + str.slice(1)

        repeat: (str, times) ->
          new Array(times + 1).join(str)

      swf.define 'logger', (fn, logger) ->
        ->
          logger.push arguments
          fn arguments...

      swf.logger( log ).$ @helpers

      @helpers.capitalize("hello").should.be.eq "Hello"
      log.length.should.be.eq 1
      log[0][0].should.be.eq "hello"

      @helpers.repeat("blah", 3).should.be.eq "blahblahblah"
      log.length.should.be.eq 2
      log[1][0].should.be.eq "blah"

    it "should wrap class", ->

      class Car

        constructor: (name, pos) ->
          @name = name
          @_setPosition pos

        _setPosition: (pos) ->
          if typeof(pos) isnt "number"
            throw new Error "Invalid position"
          @_pos = pos

        drive: (pos) ->
          @_setPosition pos
          @

        getPos: ->
          @_pos

      errors = []
      onError = (e) ->
        errors.push e

      swf.define 'guard', (fn) ->
        ->
          try
            fn.apply this, swf._args(arguments)
          catch e
            onError(e)
            false

      swf.guard().$ Car, only: /^[^\_]/, proto: true

      bentley = new Car("bentley", 0)

      ( -> bentley.drive("not position") ).should.not.throw()

      errors[0].should.be.an.instanceof Error
      errors[0].message.should.be.eq "Invalid position"
