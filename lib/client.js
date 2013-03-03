<<<<<<< HEAD

=======
>>>>>>> b1b5b2dcd216900b5156defe52beabb8e0c6dfa0
function CdnClient (options) {
  if (!(this instanceof CdnClient)) return new CdnClient(options);
  
  EventEmitter.call(this);

  var self = this;
  
  options = util.extend({
    debug: false
  }, options);
  this._options = options;
  
  
  // This connects to the PeerCDN server
  this._socket = new Socket();
  
  // Wait for list of peers from server
  this._socket.on('resource', function(url, peers){
    // Download image from Peers
    var fetcher = new PeerFetcher(url, peers);
    fetcher.on('resource', function(url, data){
      // Provide data to the DOM
      self._dom.save(url, data);
      self._socket.reportResource(url);
    });
    fetcher.on('unavailable', function(url){
      // We don't have this file, use CDN
      self._dom.fallback(url);
    });
  });
  
  
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
  
}

util.inherits(CdnClient, EventEmitter);

exports.CdnClient = CdnClient;
