function CdnClient (options) {
  if (!(this instanceof CdnClient)) return new CdnClient(options);

  EventEmitter.call(this);

  var self = this;

  if (!util.isSupportedBrowser()) {
    document.addEventListener('DOMContentLoaded', function(){
      util.log("Unsupported browser");
      var els = document.querySelectorAll('[data-peer-src]');
      for (var i = 0; i < els.length; i = i + 1){
        var el = els[i];
        el.src = el.dataset.peerSrc;
      }
    }, false);
    util.setZeroTimeout(function(){
      self.emit('error', new Error('Browser not supported'));
    });
    return;
  }

  options = util.extend({
    debug: true,
    host: 'localhost',
    port: 8080,
    useCache: true,
    instrument: false,
    numConns: 1,
    fetcherTimeout: 2500,
    initCacheTimeout: 2500,
    defaultExpiry: new Date().getTime() + 500000
  }, options);
  this._options = options;
  util.debug = this._options.debug;
  
  // Nonce ids for receiver
  this._receiverId = 0;
  
  // This connects to the PeerKit server
  this._socket = new Socket(this._options.host, this._options.port);

  // Wait for list of peers from server
  this._socket.on('resource', function(file, peers){
    util.log("Resource fetched from server:", file);
    // Download image from Peers
    var fetcher = new PeerFetcher(file, peers, self._socket, {timeout: self._options.fetcherTimeout});
    fetcher.on('resource', function(file, data){
      // Provide data to the DOM
      util.log('Fetcher found', file.url);
      self._dom.saveToCache(file.url, data, true, true, self._options.defaultExpiry);
      if (self._options.instrument) {
        self.emit('resource', file, data, Object.keys(fetcher._workingPeers).length);
      }
    });
    fetcher.on('unavailable', function(file){
      // We don't have this file, use CDN
      util.log('Fetcher could not find', file.url);
      util.xhrFile(file.url, function(status, blob, expiry){
        util.log('Resource URL downloaded with expiry', expiry);
        var success = status == 200;
        self._dom.saveToCache(file.url, blob, success, success, expiry);
      });
      if (self._options.instrument) {
        self.emit('unavailable', file);
      }
    });
  });
  // Replenish CONN objects
  this._socket.on('replenish', function(count){
    self._createReceivers(count);
  });

  // Make sure to fire if DOM already loaded
  document.addEventListener('DOMContentLoaded', function(){
    self._init();
  }, false);
}

util.inherits(CdnClient, EventEmitter);

CdnClient.prototype._init = function() {
  var self = this;
  // Gives us images list, and sets images
  this._dom = new DomManager({useCache: this._options.useCache});
  this._dom.on('requests', function(resources){
    util.log('Requesting', resources);
    self._socket.requestResources(resources);
  });
  this._dom.on('resource', function(url) {
    util.log('Reporting', url);
    self._socket.reportResource(url);
  });
  this._dom.init();
  
  this._createReceivers(this._options.numConns);
  
  setTimeout(function(){
    self._dom.initCache();
  }, this._options.initCacheTimeout);
};

CdnClient.prototype._createReceivers = function(count) {
  var self = this;
  // Send ICE packets to the server
  for (var i = 0; i < count; i++) {
    var recv = new PeerReceiver(this._receiverId++, this._socket, this._dom);
    if (this._options.instrument) {
      recv.on('open', function(){
        self.emit('shared');
        recv.removeListener('open', arguments.callee);
      });
    }
  }
};

exports.CdnClient = CdnClient;
