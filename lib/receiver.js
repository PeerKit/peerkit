function PeerReceiver (id, socket, dom, options) {
  if (!(this instanceof PeerReceiver)) return new PeerReceiver(id, socket, dom, options);

  EventEmitter.call(this);

  var self = this;

  options = util.extend({
    // Default options go here
    config: { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }] },
    reliable: false,
    serialization: 'binary'
  }, options);
  this._options = options;

  this._socket = socket;

  this._dom = dom;

  this.open = false;
  this.serialization = options.serialization;

  this._id = id;

  this._iceQueue = [];
  this._iceDone = false;
  


  util.log(this._id, 'Creating RTCPeerConnection');
  this._pc = new RTCPeerConnection(this._options.config, { optional:[ { RtpDataChannels: true } ]});


  util.log(this._id, 'Listening for ICE candidates');
  this._pc.onicecandidate = function(evt) {
    if (evt.candidate) {
      util.log(self._id, 'Received ICE candidates');
      self._iceQueue.push(evt.candidate);
      if (self._iceQueue.length == 8) {
        self._pc.onicecandidate = null;
        self._iceDone = true;
        if (self._offer) {
          // Send CONN to server
          self._sendConn();
        }
      }
    } else {
      util.log('Finished listening for ice candidate');
      self._iceDone = true;
      if (self._offer) {
        self._sendConn();
      }
    }
  };

  util.log(this._id, 'Listening for `negotiationneeded`');
  this._pc.onnegotiationneeded = function() {
    util.log(self._id, '`negotiationneeded` triggered');
    self._pc.createOffer(function(offer) {
      util.log(self._id, 'Created offer');
      self._pc.setLocalDescription(offer, function() {
        util.log(self._id, 'Set localDescription to offer');
        self._offer = offer;
        if (self._iceDone) {
          self._sendConn();
        }
      }, function(err) {
        self.emit('error', err);
        util.log(self._id, 'Failed to setLocalDescription, ', err);
      });
    });
  };

  util.log(this._id, 'Created data channel');
  this._dc = this._pc.createDataChannel('asdf', { reliable: this._options.reliable });
  this._configureDataChannel();

  this._socket.on('response-' + this._id, function(data){
    if(data.ice) {
      for (var i = 0; i < data.ice.length; i++) {
        util.log(self._id, 'Added ICE candidates');
        self._pc.addIceCandidate(new RTCIceCandidate(data.ice[i]));
      }
    } else if (data.answer) {
      var answer = new RTCSessionDescription(data.answer);
      self._pc.setRemoteDescription(answer, function() {
        util.log(self._id, 'Set remoteDescription');
      }, function(err) {
        self.emit('error', err);
        util.log(self._id, 'Failed to setRemoteDescription, ', err);
      });
    }
  });


}

util.inherits(PeerReceiver, EventEmitter);

PeerReceiver.prototype._sendConn = function() {
  this._pc.onicecandidate = null;
  this._socket.reportConnection({ice: this._iceQueue, offer: this._offer, receiverId: this._id});
}

PeerReceiver.prototype._configureDataChannel = function() {
  var self = this;

  if (util.browserisms !== 'Webkit') {
    this._dc.binaryType = 'arraybuffer';
  }
  this._dc.onopen = function() {
    util.log(self._id, 'Data channel connection success');
    self.open = true;
    self.emit('open');
  };
  this._dc.onmessage = function(e) {
    self._handleDataMessage(e, function(data){
      if (!Array.isArray(data) || data.length != 2) {
        util.log(self._id, 'Unexpected message from peer');
        return;
      }
      switch(data[0]){
        case 0:
          var chunk = self._dom.getFromCache(data[1][0], data[1][2], data[1][3]);
          if (chunk) {
            self.send([5,[data[1][1], data[1][2], data[1][3], chunk]]);
          } else {
            self.send([7, null]);
          }
          break;
        default:
          util.log(self._id, 'Unexpected message from peer');
      }
      // message comes heres

    });
  };
  this._dc.onclose = function(e) {
    self.emit('close');
  };
  this._dc.onerror = function(e) {
    self.emit('close');
  };
};

// Handles a DataChannel message.
PeerReceiver.prototype._handleDataMessage = function(e, cb) {
  var self = this;
  var data = e.data;
  var datatype = data.constructor;
  if (this.serialization === 'binary' || this.serialization === 'binary-utf8') {
    if (datatype === Blob) {
      util.blobToArrayBuffer(data, function(ab) {
        data = BinaryPack.unpack(ab);
        cb(data);
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

  cb(data);
};

PeerReceiver.prototype._cleanup = function() {
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
PeerReceiver.prototype.send = function(data) {
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
PeerReceiver.prototype.close = function() {
  this._cleanup();
  this.open = false;
  this.emit('close');
};


exports.PeerReceiver = PeerReceiver;
