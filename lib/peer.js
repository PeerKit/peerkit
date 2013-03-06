function PeerClient (peer, socket, options) {
  if (!(this instanceof PeerClient)) return new PeerClient(peer, socket, options);
  
  EventEmitter.call(this);

  var self = this;
  
  options = util.extend({
    debug: false,
    config: { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }] },
    reliable: false
  }, options);
  this._options = options;
  this._socket = socket;
  
  this._iceQueue = [];
  
  util.log('Creating RTCPeerConnection');
  this._pc = new RTCPeerConnection(this._options.config, { optional:[ { RtpDataChannels: true } ]});
  
  util.log('Listening for ICE candidates');
  this._pc.onicecandidate = function(evt) {
    if (evt.candidate) {
      util.log('Received ICE candidates');
      
    }
  };
  
  
}

util.inherits(PeerClient, EventEmitter);

PeerClient.prototype.func = function () {
	
};


exports.PeerClient = PeerClient;
