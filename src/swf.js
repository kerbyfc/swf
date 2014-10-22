var SWF = (function(root){

  var errors = {
    wrong_instance  : "new SWF($0): wrong argument type -> only Function and SWF object are acceptable",

    wrong_args      : "swf.define($0, $1): wrong argument type -> only non-empty String with Function or SWF object are acceptable",
    name_collision  : "swf.define($0, $1): name collision -> $0 is reserved",
    alias_collision : "swf.makeAlias($0, $1): name collision -> $0.$2 exists",
    forbidden       : "swf.define($0, $1): forbidden wrapper -> wrapper must return function, but not $2",

    wrong_usage     : "$0.$($1): wrong argument type -> only SWF object is acceptable",
    bad_override    : "$0.({$1: $2}): bad _override -> wrapper can be overriten only by another wrapper or null",

    wrong_target    : "$0.$($0): bad target -> only Object and Function are acceptable",

    wrong_alias     : "fsm.createAlias($0, $1): wrong alias -> alias must me a string or false. wrap alias may be true, also", // TODO
  };

  var swf = {};

  swf._class = function(obj) {
    return Object.prototype.toString.call(obj)
      .match(/^\[object\s(.*)\]$/)[1];
  };

  swf._type = function(obj) {
    if (obj == null) {
      return String(obj);
    }
    return typeof obj === "object" || typeof obj === "function" ? swf._class(obj).toLowerCase() || "object" : typeof obj;
  };

  swf._isArray = function(obj) {
    return swf._type(obj) === "array";
  };

  swf._isObject = function(obj) {
    return swf._type(obj) === "object";
  };

  swf._extend = function(obj) {
    if (obj !== null || typeof(obj) === "object" || typeof(obj) === "function") {
      var source, prop;
      for (var i = 1, length = arguments.length; i < length; i++) {
        source = arguments[i];
        for (prop in source) {
          if (hasOwnProperty.call(source, prop)) {
              obj[prop] = source[prop];
          }
        }
      }
    }
    return obj;
  };

  swf._args = function(args) {
    return Array.prototype.slice.call(args);
  };

  swf._etype = function(obj){
    var type;
    if (typeof obj === "function") {
      return (obj.name && (obj.name + " ")) + "function";
    }
    type = swf._type(obj);
    if (type !== "null" && typeof obj === "object") {
      return (obj.constructor.name && (obj.constructor.name + " ")) + "object";
    }
    return type;
  };

  swf.define = function(name, fn, sacred) {

    var props;

    if (!sacred) {
      sacred = false;
    }

    if (typeof name !== "string" || ("" + name).length === 0) {
      SWF._error(errors.wrong_args, [name, swf._etype(fn)]);
    }

    if (SWF._reserved.indexOf(name) >= 0) {
      SWF._error(errors.name_collision, [name, swf._etype(fn)]);
    }

    if (fn instanceof SWF) {
      // creation
      swf[name] = function(batch) {
        return new SWF(fn).sign(name)._override(batch);
      }

      // chaining
      SWF.prototype[name] = function(batch) {
        return ((this instanceof SWF) ? this : new SWF(this)).sign(null)._expand(fn.batch)._override(batch);
      };

    } else if (typeof fn === "function") {

      // creation
      swf[name] = function() {
        return new SWF().sign(name)._expand(name, fn, swf._args(arguments));
      }

      // chaining
      SWF.prototype[name] = function() {
        return ((this instanceof SWF) ? this : new SWF(this)).sign(null)._expand(name, fn, swf._args(arguments));
      };

    } else {
      SWF._error(errors.wrong_args, [name, swf._etype(fn)]);
    }

    swf[name].extend = function(mixin) {
      swf._extend(SWF._mixins[name], mixin);
    }

    // create default empty mixin
    SWF._mixins[name] = {};

    if (sacred) {
      // to prevent wrappers overriding
      SWF._reserved.push(name);
    }

    props = {
      sign: name,
      implementation: fn,
      sacred: sacred
    };

    // extend function with its name and wrapping function
    swf._extend( SWF.prototype[name], props);
    swf._extend( swf[name], props);

    return swf[name];

  };

  swf.createAlias = function(alias) {
    var i, obj;

    // string may be passed
    if (typeof alias !== "string" && alias !== false) {
      SWF._error(wrong_alias_type, [swf._etype(alias)]);
    }

    if (obj = root[alias]) {
      // check for collisions and save reserved keys
      for (i in obj) {
        if (!!swf[i]) {
          SWF._error(errors.alias_collision, [ alias, i ]);
        }
        SWF._reserved.push(i);
      }
    } else {
      root[alias] = {};
    }

    obj = root[alias];

    // copy properties
    for (i in swf) {
      if (!SWF._mixins[i]) {
        SWF._members[i] = swf[i];
      }
      obj[i] = swf[i];
    }

    swf = obj;
    SWF._scope_alias = alias;

    root.swf = swf;

    return swf;

  };

  swf.removeAlias = function() {
    if (SWF._scope_alias) {
      var i, j, acc = {};

      for (i in {_members: 0, _mixins: 0}) {
        for (j in SWF[i]) {
          acc[j] = root[SWF._scope_alias][j];
          delete root[SWF._scope_alias][j];
        }
      }

      SWF._reserved = [];
      SWF._scope_alias = null;
      swf = acc;
      root.swf = acc;
    }
    return swf;
  };

  swf.patchFunction = function(method) {
    Function.prototype[method] = SWF;
    SWF._fn_method = method;
  };

  swf.cleanupFunction = function() {
    if (SWF._fn_method) {
      delete Function.prototype[SWF._fn_method]
    }
    SWF._fn_method = null;
    return swf;
  };

  function SWF(arg) {

    // just return if no args
    if (arg === void(0)) {
      this.batch = [];
      return this;
    }

    if (this instanceof SWF) {

      // instantiation
      if (typeof arg === "function") {
        this.origin = arg;
      } else if (arg instanceof SWF) {
        this.batch = arg.batch.slice();
      } else {
        SWF._error(errors.wrong_instance, [swf._etype(arg)]);
      }

      return this;

    } else {
      if (arg instanceof SWF) {
        return arg.$.apply(arg, [this].concat( swf._args(arguments).slice(1) ) );
      } else {
        SWF._error(errors.wrong_usage, [swf._etype(this), swf._etype(arg)]);
      }
    }

  };

  SWF._reserved    = [];
  SWF._mixins      = {};
  SWF._members     = {};

  SWF._fn_method   = null;
  SWF._scope_alias = null;

  SWF._error = function(err, args) {
    var i;
    if (typeof args === "object") {
      for (i in args) {
        err = err.replace(new RegExp("\\$" + i, "g"), args[i]);
      }
    }
    throw new Error(err);
  };

  // __PROTO__ ----------------------------------------------------

  SWF.prototype._expand = function(name, fn, args) {

    if (typeof name === "object") { // передали очередь
      this.batch = this.batch.concat(name);
    } else { // передали враппер
      if (SWF._mixins[name]) {
        swf._extend(this, SWF._mixins[name]);
      }
      this.batch.push({name: name, implementation: fn, args: args});
    }
    return this;
  };

  SWF.prototype._override = function(batch) {
    var i, shift, name;

    if (swf._isObject(batch)) {
      for (i in this.batch) {
        name = this.batch[i].name;
        if (batch.hasOwnProperty(name)) {
          shift = batch[this.batch[i].name];
          if (shift instanceof SWF) {
            Array.prototype.splice.apply(this.batch, [i, 1].concat(shift.batch));
          } else if (shift === null) {
            this.batch.splice(i, 1);
          } else {
            SWF._error(errors.bad_override, [this.sign(), name, swf._etype(shift)]);
          }
        }
      }
    }
    return this;
  };

  SWF.prototype._accumulate = function(prop) {
    var acc = [];
    for (var i = 0; i < this.batch.length; i++) {
      acc.push( this.batch[i][prop] );
    }
    return acc;
  };

  SWF.prototype.sign = function(sign) {
    if (sign === null || typeof sign === "string") {
      this._sign = sign;
      return this;
    }
    return (sign ? ((SWF._scope_alias || "swf") + ".") : "") + (this._sign || this._accumulate("name").join("().") ) + "()";
  };

  SWF.prototype.$ = function(target) {
    var args = swf._args(arguments);

    if (swf._etype(target) === "function") {
      return this._wrapFunction.apply(this, args);

    } else if (typeof target === "function") {
      return this._wrapClass.apply(this, args);

    } else if (swf._type(target) === "object") {
      return this._wrapObject.apply(this, args);

    } else {
      SWF._error(errors.wrong_target, [this.sign(), swf._etype(target)]);
    }

  };

  SWF.prototype._wrapFunction = function(fn) {
    this.origin = fn;
    var wrapper, args = swf._args(arguments).slice(1);
    for (i = 0; i < this.batch.length; i++) {
      wrapper = this.batch[i];
      this.origin = wrapper.implementation.apply(this, [this.origin].concat(args.length > 0 ? args : wrapper.args));
      if (typeof this.origin !== "function") {
        SWF._error(errors.forbidden, [name, swf.etype(wrapper.implementation), swf.etype(this.origin)]);
      }
    }
    return this.origin;
  };

  SWF.prototype._wrapObject = function(obj, props) {
    var i;
    for (i in obj) {
      if (!props || props.test(i)) {
        obj[i] = this._wrapFunction(obj[i]);
      }
    }
  };


  // TODO {proto: true, self: false, ctor: false, depth: 1}
  SWF.prototype._wrapClass = function(Class, options) {
    var i,
        filter = false;

    // methods filtering
    if (options.only) {
      if (swf._type(options.only) === "regexp") {
        filter = function(name) { return options.only.test(name); }
      } else if (swf._type(options.only) === "array") {
        filter = function(name) { return options.only.indexOf(name) >= 0; }
      }
    }

    if (options.self) {
      for (i in Class) {
        // TODO use filter
        Class[i] = this.$(Class[i]);
      }
    }

    // wrap class prototype methods
    if (options.proto) {
      for (i in Class.prototype) {
        // check if property is passing through filter
        if (!filter || filter(i)) {
          Class.prototype[i] = this.$(Class.prototype[i]);
        }
      }
    }

    return Class;
  };


  // --------------------------------------------------------------------------------------------------------------------

  root.swf = swf;
  return SWF;

})(this);
