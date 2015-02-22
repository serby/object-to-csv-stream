var ObjectToCsvStream = require('..')
  , stream = require('stream')
  , assert = require('assert')
  , streamAssert = require('stream-assert')

describe('ObjectToCsvStream', function() {

  it('should require array of headers', function() {
    assert.throws(function() {
      var exportStream = new ObjectToCsvStream()
      exportStream.write()
    }, 'Headers must be an array')

  })

  it('should be a transform stream', function() {
    var exportStream = new ObjectToCsvStream([ 'Name', 'Email' ])
    assert(exportStream instanceof stream.Transform, 'ExportStream is a transform Stream')
  })

  it('should stream headers first followed by data', function(done) {
    var exportStream = new ObjectToCsvStream([ 'Name', 'Email' ])

    exportStream
      .pipe(streamAssert.first(function(data) { assert.equal(data.toString(), '"Name","Email"\n') }))
      .pipe(streamAssert.second(function(data) { assert.equal(data.toString(), '"Paul","serby@clock.co.uk"\n') }))
      .pipe(streamAssert.nth(3, function(data) { assert.equal(data.toString(), '"Tom","tom.smith@clock.co.uk"\n') }))
      .pipe(streamAssert.end(done))

    exportStream.write({ name: 'Paul', email: 'serby@clock.co.uk' })
    exportStream.write({ name: 'Tom', email: 'tom.smith@clock.co.uk' })
    exportStream.end()
  })

  describe('#options.mapFn()', function() {

    it('should take header.length number of items from object by default', function(done) {
      var exportStream = new ObjectToCsvStream([ 'Name', 'Email' ])

      exportStream
        .pipe(streamAssert.first(function(data) { assert.equal(data.toString(), '"Name","Email"\n') }))
        .pipe(streamAssert.second(function(data) { assert.equal(data.toString(), '"Paul","serby@clock.co.uk"\n') }))
        .pipe(streamAssert.end(done))

      exportStream.write({ name: 'Paul', email: 'serby@clock.co.uk', extra: 'not seen' })
      exportStream.end()
    })

    it('should successfully complete a custom transform', function(done) {

      function customMapFn(data) {
        return [ data.email, data.name ]
      }

      var exportStream = new ObjectToCsvStream([ 'Email', 'Name' ], { mapFn: customMapFn })

      exportStream
        .pipe(streamAssert.first(function(data) { assert.equal(data.toString(), '"Email","Name"\n') }))
        .pipe(streamAssert.second(function(data) { assert.equal(data.toString(), '"serby@clock.co.uk","Paul"\n') }))
        .pipe(streamAssert.nth(3, function(data) { assert.equal(data.toString(), '"tom.smith@clock.co.uk","Tom"\n') }))
        .pipe(streamAssert.end(done))

      exportStream.write({ name: 'Paul', email: 'serby@clock.co.uk', extra: 'not seen' })
      exportStream.write({ name: 'Tom', email: 'tom.smith@clock.co.uk' , somethingElse: 'nope' })
      exportStream.end()
    })

    it('should error if custom mapFn() fails to return an error', function(done) {

      function badCustomMapFn() {
        return ''
      }

      var exportStream = new ObjectToCsvStream([ 'Email', 'Name' ], { mapFn: badCustomMapFn })

      exportStream.on('error', function(error) {
        assert.equal(error.message, 'Mapped data is not an Array as expected')
      })

      exportStream
        .pipe(streamAssert.first(function(data) { assert.equal(data.toString(), '"Email","Name"\n') }))
        .pipe(streamAssert.second(function(data) { assert.equal(data.toString(), '"serby@clock.co.uk","Paul"\n') }))
        .pipe(streamAssert.nth(3, function(data) { assert.equal(data.toString(), '"tom.smith@clock.co.uk","Tom"\n') }))
        .pipe(streamAssert.end(done))

      exportStream.write({ name: 'Paul', email: 'serby@clock.co.uk', extra: 'not seen' })
      exportStream.write({ name: 'Tom', email: 'tom.smith@clock.co.uk' , somethingElse: 'nope' })
      exportStream.end()
    })

  })
})
