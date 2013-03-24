function CdnClient (options) {
  if (!(this instanceof CdnClient)) return new CdnClient(options);

  EventEmitter.call(this);

  var self = this;

  options = util.extend({
    debug: true,
    host: 'localhost',
    port: 8080,
    numConns: 1,
    fetcherTimeout: 2500,
    initCacheTimeout: 2500,
    defaultExpiry: new Date().getTime()
  }, options);
  this._options = options;
  util.debug = this._options.debug;
  
  // This connects to the PeerCDN server
  this._socket = new Socket(this._options.host, this._options.port);

  // Wait for list of peers from server
  this._socket.on('resource', function(file, peers){
    util.log("Resource fetched from server:", file);
    // Download image from Peers
    var fetcher = new PeerFetcher(file, peers, self._socket, {timeout: self._options.fetcherTimeout});
    fetcher.on('resource', function(file, data){
      // Provide data to the DOM
      util.log('Fetcher found', file.url);
      self._dom.saveToCache(file.url, data, true, self._options.defaultExpiry);
    });
    fetcher.on('unavailable', function(file){
      // We don't have this file, use CDN
      util.log('Fetcher could not find', file.url);
      util.xhrFile(file.url, function(blob, expiry){
        util.log('Resource URL downloaded with expiry', expiry);
        self._dom.saveToCache(file.url, blob, true, expiry);
      });
    });
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
  this._dom = new DomManager();
  this._dom.on('requests', function(resources){
    util.log('Requesting', resources);
    self._socket.requestResources(resources);
  });
  this._dom.on('resource', function(url) {
    util.log('Reporting', url);
    self._socket.reportResource(url);
  });
  this._dom.init();
  

  // Incremented ID that is passed on to PeerReceiver
  var baseReceiverId = 0;

  // Send ICE packets to the server
  for (var i = 0; i < this._options.numConns; i++) {
    new PeerReceiver(baseReceiverId++, this._socket, this._dom);
  }
  
  setTimeout(function(){
    self._dom.initCache();
  }, this._options.initCacheTimeout);
};

exports.CdnClient = CdnClient;
