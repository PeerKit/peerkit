
//hash url, size, type, 
//manages resource group dom writing clustered by redundant URLs & ele type
function ResourceGroup(url, type) {
  var self = this;
  
  EventEmitter.call(this);
  //
  this._url = url;
  this._type = type;
  this._els = [];//query for all elements


  var el = ResourceManager.directoryGet(url); 
  if (el) {
    // Cache hit
    ResourceManager.getFile(url, function(err, blob){
      if (err) {
        // VERY VERY BAD. GETDOWNLOADLIST HAS WILL NOT REPORT THIS AS NEEDED. FALLBACK TO XHR?
        return;
      }
      util.log('ResourceGroup cache hit');
      self.save(blob, true, el.expiry);
    });
    if (el.expiry < (new Date()).getTime()) {
      util.log('ResourceGroup removing file due to expiry');
      ResourceManager.removeFile(url);
    }
  }
  
}

util.inherits(ResourceGroup, EventEmitter);

ResourceGroup.prototype.push = function(el) {
  if(el.tagName != this._type) {
    return false;
  }
  if (this.blob) { //if the resource is cached
    this.write(el, DomManager.methods[this._type]['render'](this.blob)); //rener the blob data 
  }
  this._els.push(el);
};


ResourceGroup.prototype.save = function(blob, cache, expiry) {
  if (cache) {
    ResourceManager.saveFile(this._url, blob, expiry, function(err, res){
      if(err) {
        util.log('ResourceGroup save failed: ' + res);
      }
    });
  }
  this.blob = blob;
  this.writeAll(DomManager.methods[this._type]['render'](blob));
};



//actually render
ResourceGroup.prototype.writeAll = function(uri) {
  //loop through this._els and write data
  for (var i = 0; i < this._els.length; i++) {
    this.write(this._els[i], uri); //render
  }
};


//really actually render
ResourceGroup.prototype.write = function(el,uri) {
  el[DomManager.methods[this._type]['source']] = uri;
};

exports.ResourceGroup = ResourceGroup;