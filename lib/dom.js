//var RESOURCE_TIMEOUT = 30;

function DomManager (options) {
  if (!(this instanceof DomManager)) return new DomManager(options);
  
  EventEmitter.call(this);

  var self = this;
  
  options = util.extend({
    debug: false,
    types: ['img'] //supported resource types
  }, options);
  this._options = options;
    
  // Initialize ResourceGroup cache
  // url: ResourceGroupObjects
  this.cache = {};

  // Initialize - cleares all img urls, stores in cache
  this._init();
}

util.inherits(DomManager, EventEmitter);

//pull url ID from tag, clears URL from element, resource type agnostic, 
DomManager.prototype.flush = function(el) {
  var type = el.tagName, 
      source = DomManager.methods[type]['source'],
      url = el[source];
  
  el[source] = ""; //clear source
  return url; //don't sanitize, only sanitize on comparisons JIC for fallback URL using utils.compare(), 
        //cannot reliably desanitize either.
};

//fallback for unavailable
DomManager.prototype.fallback = function(url) {
  //write the regular url in place of the dataurl
  this.cache[url].write(url);
};

//files we need to dl
DomManager.prototype.getDownloadList = function() {
  var retArr = [];
  var cacheKeys = Object.keys(this.cache);
  for (var i = 0; i < cacheKeys.length; i++) {
    var url = cacheKeys[i];
    if (!this.cache[url].data) {
      retArr.push(url);
    }
  }
  return retArr;
};

//files we have to transfer
DomManager.prototype.getAvailableList = function() {
  var retArr = [];
  var cacheKeys = Object.keys(this.cache);
  for (var i = 0; i < cacheKeys.length; i++) {
    var url = cacheKeys[i];
    if (this.cache[url].data) {
      retArr.push({url: url, size: this.cache[url].data.size});
    }
  }
  return retArr;
};

DomManager.prototype._init = function() {
  var els = document.querySelectorAll(this._options.types.join(','));
  for(var i = 0; i < els.length; i++) {
    var el = els[i];
    var url = this.flush(el); //clear & retreive url
    if(!this.cache[url]) {
      this.cache[url] = new ResourceGroup(url, el.tagName);
    } else {
      this.cache[url].push(el);
    }
  }
};

// Methods of handling different tags
DomManager.prototype.methods = {};
DomManager.prototype.methods['img'] = DomManager.prototype.methods['script'] = {  
  source: 'src',
  render: function(data){ 
    return window.URL.createObjectURL(data);
  }
};
// support a and link later

exports.DomManager = DomManager;
