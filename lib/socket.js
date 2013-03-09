/**
 * An abstraction on top of WebSockets and JSONP to provide fastest
 * possible connection to the peer server.
 */
function Socket(host, port) {

  if (!(this instanceof Socket)) return new Socket(server, id, key);
  EventEmitter.call(this);

  this._httpUrl = 'http://' + host + ':' + port +'/';
  this._wsUrl = 'ws://' + host + ':' + port + '/ws';
  //this._start();
};

util.inherits(Socket, EventEmitter);


/** Check in with ID or get one from server. */
Socket.prototype._start = function() {
  this._startWebSocket();
};


/** Start up websocket communications. */
Socket.prototype._startWebSocket = function() {
  var self = this;

  if (!!this._socket) {
    return;
  }

  this._socket = new WebSocket(this._wsUrl);

  this._socket.onmessage = function(event) {
    var data;
    try {
      data = JSON.parse(event.data);
      if (data.type == "RESOURCE") {
        //if (data.peers.length > 0) {
        self.emit('resource', data.file, data.peers);
        //}
      } else if (data.type == "RESPONSE") {
        data.data = JSON.parse(data.data);
        self.emit('response-' + data.data.receiverId, data.data);
      }

    } catch(e) {
      util.log('Invalid server message', event.data);
      return;
    }
    self.emit('message', data);
  };

  // Take care of the queue of connections if necessary and make sure Peer knows
  // socket is open.
  this._socket.onopen = function() {
    self.emit('wsopen');
    util.log('Socket open');
  };
};
/**
 * Notifies the server that we need resources
 * @param resources an array of resource URLs
 */
Socket.prototype.requestResources = function(resources, method) {
  var self = this;
  var messages = resources.map(function(resource) {
    return {
      type : 'REQUEST',
      url : resource,
    }
  });
  if (!method) {
    method = this._wsOpen() ? "ws" : "jsonp";
  }
  if (method == "ws") {
    util.log("Requesting resources using websockets");
    for (var i = 0; i < messages.length; i++) {
      this._wsSend(messages[i]);
    }
  } else {
    util.log("Requesting resources using JSONP");
    if (messages.length > 0) {
      var tag = document.createElement('script');
      var jsonpId = util.randomToken();
      var cbName = "PeerKit"+jsonpId;
      var querystring = "?callback="+cbName+"&";
      var queryArr = ["urls="];
      for (var i = 0; i < resources.length; i++) {
          console.log(JSON.stringify(resources[i]));
          queryArr.push("urls="+encodeURIComponent(resources[i]));
      }
      querystring += queryArr.join("&");
      tag.src = this._httpUrl+"requestResource"+querystring;
      console.log(tag.src)
      document.getElementsByTagName('head')[0].appendChild(tag);
      this._updateJsonp(cbName, function(res) {
        var urls = Object.keys(res);
        for (var i = 0; i < urls.length; i++) {
          //if (res[urls[i]].length > 0) {
          console.log(urls[i]);
          console.log(res[urls[i]]);
            self.emit('resource', urls[i], res[urls[i]]);
          //}
        }
      })
    }
  }
}

Socket.prototype._updateJsonp = function(name, cb) {
    window[name] = cb;
}

/**
 * Notifies the server that we we have a connection
 * @param connection
 */
 Socket.prototype.reportConnection = function(connection) {
  this._wsSend({
    type : "CONN",
    conn : connection
  });
}


/**
  * Sends ICE and offer answers to Sharad (Sharer)
  *
  *
*/

Socket.prototype.respond = function(id, data) {
  this._wsSend({
    type: "RESPONSE",
    id: id,
    data: JSON.stringify(data)
  });
}


/**
 * Notifies the server that we we have resources
 * @param resources an array of resource Objects (url, size)
 */
Socket.prototype.reportResources = function(resources) {
  for (var i = 0; i < resources.length; i++) {
    this._wsSend({
      type : "REPORT",
      url : resources[i].url,
      size : resources[i].size
    });
  }
}

/** Exposed send for DC & Peer. */
Socket.prototype._wsSend = function(data) {
  if (!data.type) {
    this.emit('error', 'Invalid message');
    return;
  }

  message = JSON.stringify(data);
  if (this._wsOpen()) {
    this._socket.send(message);
  } else {
    util.log("Error sending WS Message; no WS open")
  }
};

Socket.prototype.close = function() {
  if (!!this._wsOpen()) {
    this._socket.close();
  }
};

Socket.prototype._wsOpen = function() {
  return !!this._socket && this._socket.readyState == 1;
};
