//var RESOURCE_TIMEOUT = 30;

function DomManager (options) {
  if (!(this instanceof DomManager)) return new DomManager(options);
  
  EventEmitter.call(this);

  var self = this;
  
  options = util.extend({
    debug: false,
    prefix: 'data-peer-',
    types: ['img[data-peer-src]'] //supported resource types
  }, options);
  this._options = options;
    
  this.cache = {};
}

util.inherits(DomManager, EventEmitter);


DomManager.prototype.getFromCache = function(url, start, end) {
  if(this.cache[url].blob) {
    // Check a memory cache other than this one
    return this.cache[url].blob.slice(start, end );
  } else {
    return false;
  }
};

DomManager.prototype.saveToCache = function(url, data, cache, emit, expiry) {
  this.cache[url].save(data, cache, expiry);
  if (emit) {
    this.emit('resource', url);
  }
};

DomManager.prototype.init = function() {
  var self = this;
  
  var els = document.querySelectorAll(this._options.types.join(','));
  var dlList = [];
  
  // Create resource groups for matched elements
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    var url = el.getAttribute(this._options.prefix + DomManager.methods[el.tagName]['source']);
    
    if (!this.cache[url]) {
      this.cache[url] = new ResourceGroup(url, el.tagName);
       
      var res = ResourceManager.directoryGet(url); 
      // Decide whether file is available
      if (res) {
        util.log('Cache hit');
        if (res.expiry < (new Date()).getTime()) {
          util.log('Removing cached file due to expiry');
          ResourceManager.removeFile(url);
          // Since expired, might as well get from XHR, either will be in browser cache or get new updated version from CDN
          util.xhrFile(url, function(status, blob, expiry, url){
            util.log('Downloading from server due to expired cache');
            var success = status == 200;
            self.saveToCache(url, blob, success, success, expiry);
          });
        } else {
          ResourceManager.getFile(url, function(err, blob, url){
            if (err) {
              util.log('Failed to get file from cache');
              self.emit('requests', [url]);
              return;
            }
            util.log('Got file from cache: ', url);
            self.saveToCache(url, blob, false, true);
          });
        }
      } else {
        dlList.push(url);
      }
    }
    this.cache[url].push(el);
  }
  if (dlList.length > 0) {
    this.emit('requests', dlList);
  }
  // TODO: Report other available resources
};

// Caches files from resource manager that are actually in DOM
DomManager.prototype.initCache = function() {
  var self = this;
  var urls = ResourceManager.storedUrls();
  for (var i = 0; i < urls.length; i++) {
    var url = urls[i];
    if (!this.cache[url]) {
      var res = ResourceManager.directoryGet(url); 
      if (res.expiry < (new Date()).getTime()) {
        util.log('Removing expired file in cache not in DOM: ', url);
        ResourceManager.removeFile(url);
      } else {
        ResourceManager.getFile(url, function(err, blob, url){
          if (err) {
            return;
          }
          util.log('Got file from ResourceManager but not in DOM: ', url);
          self.cache[url] = new ResourceGroup(url);
          self.saveToCache(url, blob, false, true);
        });
      }
    }    
  }
};

// Methods of handling different tags
DomManager.methods = {};
DomManager.methods['IMG'] = {  
  source: 'src',
  render: function(data){ 
    return window.URL.createObjectURL(data);
  }
};

// support a and link later

exports.DomManager = DomManager;
