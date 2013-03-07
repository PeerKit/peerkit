function PeerProvider(socket, options) {
  if (!(this instance of PeerProvider)) return new PeerProvider(socket, options);

  EventEmitter.call(this);

  var self = this;

  options = util.extend({
    // Default options go here
  }, options);
  this._options = options;

  this._init();
}

PeerProvider.prototype._init = function() {

}

exports.PeerProvider = PeerProvider;
