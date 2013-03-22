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

  // Initialize - cleares all img urls, stores in cache
  this._init();
}

util.inherits(DomManager, EventEmitter);


DomManager.prototype.get = function(url, start, end) {
  if(this.cache[url].blob) {
    return this.cache[url].blob.slice(start, end );
  } else {
    return false;
  }
};

DomManager.prototype.save = function(url, data, cache, expiry) {
  this.cache[url].save(data, cache, expiry);
};

//files we need to dl
DomManager.prototype.getDownloadList = function() {
  var retArr = [];
  var urls = Object.keys(this.cache);
  for (var i = 0; i < urls.length; i++) {
    var url = urls[i];
    if (!ResourceManager.isFileStored(url)) {
      retArr.push(url);
    }
  }
  util.log('Get download list returning', retArr);
  return retArr;
};

// Files not in memory yet
DomManager.prototype.getAvailableList = function() {
  var arr = [];
  var urls = ResourceManager.storedUrls();
  for (var i = 0; i < urls.length; i++) {
    var el = ResourceManager.directoryGet(urls[i]);
    if (el.expiry < (new Date()).getTime()) {
      util.log('getAvailableList detected cache expiry');
      ResourceManager.removeFile(urls[i]);
    } else {
      arr.push(urls[i]);
    }
  }
  util.log('Get available list returning', arr);
  return arr;
};

DomManager.prototype._init = function() {
  var els = document.querySelectorAll(this._options.types.join(','));
  
  for(var i = 0; i < els.length; i++) {
    var el = els[i];
    var url = el.getAttribute(this._options.prefix + DomManager.methods[el.tagName]['source']);

    if(!this.cache[url]) {
      this.cache[url] = new ResourceGroup(url, el.tagName);
    }
    this.cache[url].push(el);
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
