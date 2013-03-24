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

function PeerFetcher (file, peers, socket, options) {
  if (!(this instanceof PeerFetcher)) return new PeerFetcher(file, peers, socket, options);
  


  var self = this;
  
  EventEmitter.call(this);
  
  util.log('Fetcher instantiated');
 
  if (peers.length == 0) {
    util.setZeroTimeout(function(){
      util.log("Server provided no peers");
      self.emit('unavailable', file);
    });
    return;
  }
  util.log('Peers available for', file.url, ':', peers.length);

  options = util.extend({
    // Default options go here
  }, options);
  this._options = options;
  var self = this;
  this._timeout = setTimeout(function(){ 
    self._destroy();
    util.log('Ran out of time in fetcher');
  }, this._options.timeout);
  this._timeoutOccurred = false;

  this._socket = socket;

  this._file = file;

  this._peers = peers;
  this._workingPeers = {};

  this._chunks = [];

  // ID to use for subsequent file requests. Unused right now
  this._fileId = 0;

  // Store the partial file
  this._buffer = new ArrayBuffer(this._file.size);

  
  this._chunks = this._file.chunks;
  
  // Connect to peers
  for (var i = 0; i < this._peers.length; i++) {
    this._connectPeer(i);
  }
}

util.inherits(PeerFetcher, EventEmitter);

PeerFetcher.prototype._connectPeer = function (index) {
  var self = this;

  var peer = new PeerClient(this._peers[index], this._socket);
  this._peers[index].client = peer;

 

  peer.on('open', function() {
    clearTimeout(self._timeout);
    self._workingPeers[index] = false;
    self._next(index);
    
  });
  peer.on('data', function(data) {
    if (!Array.isArray(data) || data.length != 2) {
      util.log('Unexpected message from peer');
      return;
    }
    switch(data[0]){
      case 5:
        self._receiveData(index, data[1][0], data[1][1], data[1][2], data[1][3]);
        break;
      case 7:
        self._invalidPeer(index);
        break;
      default:
        util.log('Unexpected message from peer');
    }
  });
  peer.on('close', function(){
    if (!self._timeoutOccurred){
      if (peer.open) {
        self._invalidPeer(index);
      }
      util.log('Peer closed and invalidated'); 
    }
    
  });
  
  peer.on('error', function(){
    self._invalidPeer(index);
  });
  
};

PeerFetcher.prototype._receiveData = function(index, id, start, end, data) {
  // Assume data is an ArrayBuffer
  var UintData = new Uint8Array(data);
  // Clear current chunk
  

  // Invalid chunk hash
  if (util.hash(UintData) !== this._peers[index].chunk.hash){
    util.log('Invalid hash received');
    this._invalidPeer(index);
    this._socket.invalidTransfer(this._peers[index].id , this._file.url);
    return;
  }

  // Invalid chunk range
  if (!(start < end) || start < 0 || end > this._buffer.byteLength || data.byteLength !== (end - start)) {
    this._invalidPeer(index);
    util.log('Invalid chunk range', start, end);
    return;
  }

  delete this._peers[index].chunk;


  var bufferIntArray = new Uint8Array(this._buffer, start, end-start)

  // Put data chunk into file buffer
  for (var i = 0; i < UintData.length ; i++) {
    bufferIntArray[i] = UintData[i];
  }
  //var totalIntArray = new Uint8Array(this._buffer);
  // Peer connection is no longer busy
  this._workingPeers[index] = false;

  // Go get next chunk
  this._next(index);
};


PeerFetcher.prototype._invalidPeer = function(index) {
  
  // Peer has died so must be removed from working peers dict
  delete this._workingPeers[index];

  
  var chunk = this._peers[index].chunk;
  delete this._peers[index].chunk;
  if (chunk) {
    this._chunks.push(this._peers[index].chunk);
  };
  
  
  // Check if any available peers
  if (this._chunks.length > 0 && Object.keys(this._workingPeers).length == 0) {
    this.emit('unavailable', this._file);
  } else {
    // Puts chunk back on queue
    this._wakeAllPeers();
  }
  // Clear chunk from peer
  
};

PeerFetcher.prototype._next = function(index) {
  // Chunk queue has items, take one off and work on it
  if (this._chunks.length > 0) {
    this._workingPeers[index] = true;
    var chunk = this._chunks.pop();
    this._peers[index].chunk = chunk;
    this._peers[index].client.send([0, [this._file.url, this._fileId++, chunk.start, chunk.end]]);
  } else {
    var indices = Object.keys(this._workingPeers);
    for (var i = 0; i < indices.length; i++) {
      if (this._workingPeers[indices[i]] === true){
        // a peer is working so just return
        return;
      }
    }
    //No peers are working and the queue is empty, so we must have the file. CHANGE THE BUFFER INTO A BLOB.
    this.emit('resource', this._file, new Blob([new Uint8Array(this._buffer)]));
  }
};

PeerFetcher.prototype._wakeAllPeers = function(index) {
  // Walk through all peers and wake the ones that are currently sleeping
  // If no peers can be woken since all are busy, then everything will still work fine
  var indices = Object.keys(this._workingPeers);
  for (var i = 0; i < indices.length; i++) {

    // Return if no chunks to work on left
    if (this._chunks.length == 0) {
      return;
    }
    // Make sure that peer is not currently working
    if (this._workingPeers[indices[i]] === false) {
      // Wake up sleeping peer
      this._next(indices[i]);
      // Add a return or break here if you only want to wake the first sleeping peer
      // return;
    }
  }
};


PeerFetcher.prototype._destroy = function(){
  this.emit('unavailable', this._file);
  this._timeoutOccurred = true;
  for (var i = 0; i < this._peers.length ; i++){
    this._peers[i].client.close();
  }
}

exports.PeerFetcher = PeerFetcher;
