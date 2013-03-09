function CdnClient (options) {
  if (!(this instanceof CdnClient)) return new CdnClient(options);

  EventEmitter.call(this);

  var self = this;

  options = util.extend({
    debug: true,
    host: 'localhost',
    port: 8080,
    numConns: 5
  }, options);
  this._options = options;
  util.debug = this._options.debug;
  
  // This connects to the PeerCDN server
  this._socket = new Socket(this._options.host, this._options.port);

  // Wait for list of peers from server
  this._socket.on('resource', function(file, peers){
  
    util.log("Resource fetched from server:", file);
    // Download image from Peers
    var fetcher = new PeerFetcher(file, peers, self._socket);
    fetcher.on('resource', function(file, data){
      // Provide data to the DOM
      util.log('Fetcher found', file.url);
      self._dom.save(file.url, data, false);
      self._socket.reportResource(file.url, data.size);
    });
    fetcher.on('unavailable', function(file){
      // We don't have this file, use CDN
      util.log('Fetcher could not find', file.url);
      util.xhrFile(file.url, function(blob, d){
        util.log('Resource URL downloaded with expiry', d);
        self._dom.save(file.url, blob, true, d);
        self._socket.reportResource(file.url, blob.size);
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
  // Gives us images list, and sets images
  this._dom = new DomManager();

  // Manages cache and resources
  //this._resources = new ResourceManager();

  // Get a list of URLs that we need to download
  var resources = this._dom.getDownloadList();


  // Tell the server we need these resources
  this._socket.requestResources(resources);

  // Tell the server about the resources we can share
  var cached = this._dom.getAvailableList();
  this._socket.reportResources(cached);

  // Incremented ID that is passed on to PeerReceiver
  var baseReceiverId = 0;

  // Send ICE packets to the server
  for (var i = 0; i < this._options.numConns; i++) {
    new PeerReceiver(baseReceiverId++, this._socket, this._dom);
  }
};

exports.CdnClient = CdnClient;
