function PeerFetcher (options) {
  if (!(this instanceof PeerFetcher)) return new PeerFetcher(options);
  
  EventEmitter.call(this);

  var self = this;
  
  options = util.extend({
    debug: false
  }, options);
  this._options = options;
    
}

util.inherits(PeerFetcher, EventEmitter);

PeerFetcher.prototype.func = function () { ... };


exports.PeerFetcher = PeerFetcher;
