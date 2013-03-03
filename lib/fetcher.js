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


function PeerFetcher (file, peers) {
  if (!(this instanceof PeerFetcher)) return new PeerFetcher(file, peers);
  
  EventEmitter.call(this);

  var self = this;
  
  options = util.extend({
    debug: false
  }, options);
  this._options = options;
  
  this._file = file;
  this._peers = peers;
  
  
  
  this._chunks = [];
  this._defineChunks();
  
  // ID to use for subsequent file requests. Unused right now
  this._fileId = 0;
  
  // Store the partial file
   
  
  // Try the first peer
  
  
}

util.inherits(PeerFetcher, EventEmitter);

PeerFetcher.prototype._defineChunks = function () {
  this._chunks.push({start: 0, end: this._file.size});
};

PeerFetcher.prototype._connectPeer = function (index) { 
  var self = this;
  
  var peer = new PeerClient(this._peers[index]);
  peer.on('open', function() {
    self._peers[index].client = peer;
    self._next(index);
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
  // Puts chunk back on queue
  this._chunks.push(this._peers[index].chunk);
};

PeerFetcher.prototype._next = function(index) {
  var chunk = this._chunks.pop();
  this._peers[index].chunk = chunk;
  
  this._peers[index].client.send([0, [this._file.url, this._fileId++, chunk.start, chunk.end]]);
  
}

exports.PeerFetcher = PeerFetcher;
