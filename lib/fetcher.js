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
  if (!(this instanceof PeerFetcher)) return new PeerFetcher(file, peers, options);
  
  EventEmitter.call(this);

  var self = this;
  
  options = util.extend({
    // Default options go here
    chunkSize: 800
  }, options);
  this._options = options;
  
  this._socket = socket;
  
  this._file = file;
  util.log('Fetching', file);
  
  this._file = file;

  //a list of peers accessible to the unit tests and shit
  if (this._options.debug){
    this._allPeers = [];
  }
 
  this._peers = peers;
  this._workingPeers = {};
  
  
  this._chunks = [];
  
  // ID to use for subsequent file requests. Unused right now
  this._fileId = 0;
  
  // Store the partial file
  this._buffer = new ArrayBuffer(this._file.size);

  // Init all the stuffs
  this._init();
}

util.inherits(PeerFetcher, EventEmitter);

PeerFetcher.prototype._defineChunks = function (chunkSize) {
  var current = 0;
  while (current + chunkSize - 1 < this._file.size){
    this._chunks.push({start:current, end: current + chunkSize -1});
    current += chunkSize;
  }
  if (current < this._file.size){
    this._chunks.push({start: current, end: this._file.size - 1});
  }
};

PeerFetcher.prototype._connectPeer = function (index) { 
  var self = this;
  
  var peer = new PeerClient(this._peers[index], socket);
  peer.on('open', function() {
    self._peers[index].client = peer;
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

PeerFetcher.prototype._receiveData = function(index, id, start, end, data) {
  // Assume data is an ArrayBuffer
  var UintData = new Uint8Array(data);
  // Clear current chunk
  delete this._peers[index].chunk;
  

  // Invalid chunk range
  if (!(start < end) || start < 0 || end >= this._buffer.byteLength || data.byteLength - 1 !== (end - start)) {
    util.log('Invalid chunk range');
    this._invalidPeer(index);
    return;
  }

  var bufferIntArray = new Uint8Array(this._buffer, start, end-start + 1)

  // Put data chunk into file buffer
  for (var i = 0; i < bufferIntArray.length ; i++) {
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

  // All other workers are either currently working or sleeping and all chunks are in process of being retrieved
  if (this._chunks.length == 0) {
    
    if (Object.keys(this._workingPeers).length == 0) {
      // No more peers, file is now dead
      // Fall back to http cdn here
      this.emit('unavailable');
    } else {
      // Puts chunk back on queue
      this._chunks.push(this._peers[index].chunk);
      // Walk through dictionary of working peers and wake up all sleeping peers if not all are currently working
      this._wakeAllPeers();
    }
  } else {
    // Puts chunk back on queue
    this._chunks.push(this._peers[index].chunk);
  }
  
  // Clear chunk from peer
  delete this._peers[index].chunk;
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
      if (this._workingPeers[indices[i]]){
        // a peer is working so just return
        return;
      }
    }
    //No peers are working and the queue is empty, so we must have the file.
    this.emit('resource', this._file, this._buffer.buffer);
    return;
    // Do nothing for now. _next will be called on this peer if it needs to be woken up. Peer goes to sleep
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

PeerFetcher.prototype._init = function() {
  this._defineChunks(this._options.chunkSize);
  for (var i = 0; i < this._peers.length; i++) {
    this._connectPeer(i);
  }
}

exports.PeerFetcher = PeerFetcher;
