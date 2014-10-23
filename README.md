swf
===

simple wrapper function for js

### tests
```karma start specs.conf.js```

### usage example

```coffeescript
swf.define 'wait', (fn, fns...) ->
  expectations = []
  data = []

  check = (i, d) ->
    data[i] = d
    for p in expectations
      return false unless p
    fn(data)
    
  ->
    for f, i in fns
      do(f, i) ->
        expectations[i] = false
        f( (d) -> expectations[i] = true; check(i, d) )

swf.createAlias('$')

$.wait.extend
  then: (finish) ->
    this.$(finish)()

fn1 = (done) -> setTimeout( (-> done('ok')) , 500)
fn2 = (done) -> setTimeout( (-> done('yaahoooo!')) , 2000)

$.wait( fn1, fn2 ).then( (a) -> console.log(a) )

# ok
# yahoooo!
# [ok, yahoooo]

```
