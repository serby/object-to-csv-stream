module.exports = ObjectToCsvStream

var TransformStream = require('stream').Transform
  , extend = require('lodash.assign')

/**
 * Default map will take the first this.header.length items from the object as
 * the row values
 */
function defaultMapFn(data) {
  return Object.keys(data).slice(0, this.headers.length).map(function(key) {
    return data[key]
  })
}

function ObjectToCsvStream(headers, options) {
  if (!Array.isArray(headers)) throw new TypeError('Headers must be an array')
  this.headers = headers

  this.options = extend(
    { quote: '"'
    , mapFn: defaultMapFn.bind(this)
    , eol: '\n' }, options)

  TransformStream.call(this)
  this._writableState.objectMode = true
  this._readableState.objectMode = false
  this._headersSent = false

  // Send the headers out first
  this.push(headers.map(this.stringEscape.bind(this)).join(',') + this.options.eol)

}

ObjectToCsvStream.prototype = Object.create(TransformStream.prototype)

ObjectToCsvStream.prototype.stringEscape = function(s) {
  return this.options.quote + s + this.options.quote
}

ObjectToCsvStream.prototype._transform = function (data, encoding, callback) {
  var rowData = this.options.mapFn(data)
    , error
  if (!Array.isArray(rowData)) {
    error = new TypeError('Mapped data is not an Array as expected')
    this.emit('error', error)
    return callback(error)
  }
  this.push(rowData.map(this.stringEscape.bind(this)).join(',') + this.options.eol)
  callback()

}
