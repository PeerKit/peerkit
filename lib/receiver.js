function PeerReceiver (socket, options) {
  if (!(this instanceof PeerReceiver)) return new PeerReceiver(socket, options);

  EventEmitter.call(this);

  var self = this;

  options = util.extend({
    // Default options go here
    startConnNum: 5
  }, options);
  this._options = options;

  this._providers = [];

  this._init();
}

PeerReceiver.prototype.getNumConns = function() {
  return this._providers.length;
}

PeerReceiver.prototype.createConns = function(num) {
  for (var i = 0; i < num; i++) {
    this._providers.push(new PeerProvider(socket));
  }
}

PeerReceiver.prototype._init = function() {
  for (var i = 0; i < this._options.startConnNum; i++) {
    this._providers.push(new PeerProvider(socket));
  }
}

exports.PeerReceiver = PeerReceiver;
