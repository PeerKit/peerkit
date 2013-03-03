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
  this._workingPeers = {};
  
  
  this._chunks = [];
  this._defineChunks();
  
  // ID to use for subsequent file requests. Unused right now
  this._fileId = 0;
  
  // Store the partial file
  this._fileBuffer = new ArrayBuffer(this._file.size);

  // Start all peers
  for (var i = 0; i < this._peers.length; i++) {
    this._connectPeer(i);
  }

}

util.inherits(PeerFetcher, EventEmitter);

PeerFetcher.prototype._defineChunks = function () {
  this._chunks.push({start: 0, end: this._file.size});
};

PeerFetcher.prototype._connectPeer = function (index) { 
  var self = this;
  
  var peer = new CdnClient(this._peers[index]);
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
  //TODO: Read data and convert it into an arrayBuffer

  // Put data chunk into file buffer
  util.fillBuffer(this._fileBuffer, start, end, data);

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
    // No more peers, file is now dead
    if (Object.keys(this._workingPeers).length == 0) {
      //Fall back to http cdn here
      self.emit('unavailable');
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
};

PeerFetcher.prototype._next = function(index) {
  // Chunk queue has items, take one off and work on it
  if (this._chunks.length > 0) {
    this._workingPeers[index] = true;
    var chunk = this._chunks.pop();
    this._peers[index].chunk = chunk;

    this._peers[index].client.send([0, [this._file.url, this._fileId++, chunk.start, chunk.end]]);
  }
  // Chunk queue is empty
  else {
  	//check if any peers are still working
    for (var i = 0; i < this._workingPeers.length ; i++){
      if (this._workingPeers[i]){
        // a peer is working so just return
        return;
      }
    }
    //No peers are working and the queue is empty, so we must have the file.
    self.emit('resource',self._file,this._fileBuffer);
    return;
    // Do nothing for now. _next will be called on this peer if it needs to be woken up. Peer goes to sleep
  }
};

PeerFetcher.prototype._wakeAllPeers = function(index) {
  // Walk through all peers and wake the ones that are currently sleeping
  // If no peers can be woken since all are busy, then everything will still work fine
  var workingPeersIndicies = Object.keys(this._workingPeers);
  for (var i = 0; i < workingPeersIndicies.length; i++) {
    // Make sure that peer is not currently working
    if (this._workingPeers[workingPeersIndicies[i]] === false) {
      // Wake up sleeping peer
      this._next(workingPeersIndicies[i]);

      // Add a return or break here if you only want to wake the first sleeping peer
      // return;
    }
  }
};

exports.PeerFetcher = PeerFetcher;
