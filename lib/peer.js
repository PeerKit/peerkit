function PeerClient (peer, socket, options) {
  if (!(this instanceof PeerClient)) return new PeerClient(peer, socket, options);
  
  EventEmitter.call(this);

  var self = this;
  
  options = util.extend({
    debug: false,
    config: { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }] },
    reliable: false,
    serialization: 'binary'
  }, options);
  this._options = options;
  this._socket = socket;
  this._peer = peer;
  
  this.open = false;
  this.serialization = options.serialization;
  
  this._iceQueue = [];
  
  util.log('Creating RTCPeerConnection');
  this._pc = new RTCPeerConnection(this._options.config, { optional:[ { RtpDataChannels: true } ]});
  
  util.log('Listening for ICE candidates');
  this._pc.onicecandidate = function(evt) {
    if (evt.candidate) {
      util.log('Received ICE candidates');
      self._socket.respond(self._peer.id, {ice: [evt.candidate]});
    }
  };
  
  util.log('Listening for data channel');
  this._pc.ondatachannel = function(evt) {
    util.log('Received data channel');
    self._dc = evt.channel;
    self._configureDataChannel();
  };
  
  peer.data = JSON.parse(peer.data);
  
  if (util.browserisms != 'Firefox') {
    peer.data.offer = new RTCSessionDescription(peer.data.offer);
  }
  
  this._pc.setRemoteDescription(peer.data.offer, function() {
    util.log('Set remoteDescription');
    self._pc.createAnswer(function(answer) {
      util.log('Created answer');
      self._pc.setLocalDescription(answer, function() {
        util.log('Set localDescription to answer');
        self._socket.respond(self._peer.id, {answer: answer});
      }, function(err) {
        self.emit('error', err);
        util.log('Failed to setLocalDescription, ', err)
      });
    }, function(err) {
      self.emit('error', err);
      util.log('Failed to create answer, ', err)
    });
  }, function(err) {
    self.emit('error', err);
    util.log('Failed to setRemoteDescription, ', err);
  });
}

util.inherits(PeerClient, EventEmitter);


PeerClient.prototype._configureDataChannel = function() {
  var self = this;
  
  if (util.browserisms !== 'Webkit') {
    this._dc.binaryType = 'arraybuffer';
  }
  
  this._dc.onopen = function() {
    util.log('Data channel connection success');
    self.open = true;
    self.emit('open');
  };
  this._dc.onmessage = function(e) {
    self._handleDataMessage(e);
  };
  this._dc.onclose = function(e) {
    self.emit('close');
  };
  this._dc.onerror = function(e) {
    self.emit('error');
  };
};

// Handles a DataChannel message.
PeerClient.prototype._handleDataMessage = function(e) {
  var self = this;
  var data = e.data;
  var datatype = data.constructor;
  if (this.serialization === 'binary' || this.serialization === 'binary-utf8') {
    if (datatype === Blob) {
      util.blobToArrayBuffer(data, function(ab) {
        data = BinaryPack.unpack(ab);
        self.emit('data', data);
      });
      return;
    } else if (datatype === ArrayBuffer) {
      data = BinaryPack.unpack(data);
    } else if (datatype === String) {
      var ab = util.binaryStringToArrayBuffer(data);
      data = BinaryPack.unpack(ab);
    }
  } else if (this.serialization === 'json') {
    data = JSON.parse(data);
  }
  this.emit('data', data);
};

PeerClient.prototype._cleanup = function() {
  if (!!this._dc && this._dc.readyState != 'closed') {
    this._dc.close();
    this._dc = null;
  }
  if (!!this._pc && this._pc.readyState != 'closed') {
    this._pc.close();
    this._pc = null;
  }
};


/** Allows user to send data. */
PeerClient.prototype.send = function(data) {
  var self = this;
  if (this.serialization === 'none') {
    this._dc.send(data);
  } else if (this.serialization === 'json') {
    this._dc.send(JSON.stringify(data));
  } else {
    var utf8 = (this.serialization === 'binary-utf8');
    var blob = BinaryPack.pack(data, utf8);
    // DataChannel currently only supports strings.
    if (util.browserisms === 'Webkit') {
      util.blobToBinaryString(blob, function(str){
        self._dc.send(str);
      });
    } else {
      this._dc.send(blob);
    }
  }
};

/** Allows user to close connection. */
PeerClient.prototype.close = function() {
  this._cleanup();
  this.open = false;
  this.emit('close');
};


exports.PeerClient = PeerClient;
