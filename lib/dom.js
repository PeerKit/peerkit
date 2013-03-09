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
    
  // Initialize ResourceGroup cache
  // url: ResourceGroupObjects
  this.cache = {};

  // Initialize - cleares all img urls, stores in cache
  this._init();
}

util.inherits(DomManager, EventEmitter);


DomManager.prototype.save = function(url, data) {
  this.cache[url].save(url, data);
};

//fallback for unavailable
DomManager.prototype.fallback = function(url) {
  //write the regular url in place of the dataurl
  this.cache[url].writeAll(url);
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
  util.log('Get download list returning', retArr);
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
    var url = el.getAttribute(this._options.prefix + DomManager.methods[el.tagName]['source']);
     var el2 = document.createElement("img"); // create the new image object
    
    el2.setAttribute(DomManager.methods[el.tagName]['source'], url);
    console.log(el2.complete);
    el2.removeAttribute(DomManager.methods[el.tagName]['source']);
    if(!this.cache[url]) {
      this.cache[url] = new ResourceGroup(url, el.tagName);
    }
    this.cache[url].push(el);
  }
};

// Methods of handling different tags
DomManager.methods = {};
DomManager.methods['IMG'] = DomManager.methods['SCRIPT'] = {  
  source: 'src',
  render: function(data){ 
    return window.URL.createObjectURL(data);
  }
};

// support a and link later

exports.DomManager = DomManager;
