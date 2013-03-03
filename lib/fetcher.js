var PeerMessages = {
    
  // Protocol format: 
  // [ message type, payload ]
  // 
  // 0: 
  // Request file
  // payload: [url, id, start, end]
  //
  // 5:
  // Receive data
  // payload: [id, start, end, chunk]
  //
  // 7:
  // No file available / Error
  // payload: null
  
  request: function(url, start, end){
    return [0, [url, start, end]];
  },
};



function PeerFetcher (url, peers) {
  if (!(this instanceof PeerFetcher)) return new PeerFetcher(url, peers);
  
  EventEmitter.call(this);

  var self = this;
  
  options = util.extend({
    debug: false
  }, options);
  this._options = options;
  
  this._url = url;
  this._peers = peers;
  
  
  // ID to use for subsequent file requests. Unused right now
  this._id = 0;
  
}

util.inherits(PeerFetcher, EventEmitter);

PeerFetcher.prototype.connectPeer = function (index) { 
  var self = this;
  
  var peer = new PeerClient(this._peers[index]);
  peer.on('open', function() {
    self._peers[index].client = peer;
    self._availablePeer(index);
  });
  peer.on('data', function(data) {
    if (!Array.isArray(data) || data.length != 2) {
      util.log('Unexpected message from peer');
      return;
    }
    switch(data[0]){
      case 5:
        self._receiveData(data[1][0], data[1][1], data[1][2], data[1][3]);
        break;
      case 7:
        self._invalidPeer(index);
      default:
        util.log('Unexpected message from peer');
    }  
  });
  peer.on('close', function(){
    self._invalidPeer(index);
  });
  peer.on('error', function(){
    self._invalidPeer(index);
  });
};

PeerFetcher.prototype._receiveData = function(id, start, end, data) {
};


PeerFetcher.prototype._invalidPeer = function(index) {
};

PeerFetcher.prototype._availablePeer = function(index) {
};

exports.PeerFetcher = PeerFetcher;
