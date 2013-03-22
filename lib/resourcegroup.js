
//hash url, size, type, 
//manages resource group dom writing clustered by redundant URLs & ele type
function ResourceGroup(url, type) {
  var self = this;
  
  EventEmitter.call(this);
  //
  this._url = url;
  this._type = type;
  this._els = [];//query for all elements

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
    util.log('ResourceGroup writing file to ResourceManager');
    ResourceManager.saveFile(this._url, blob, expiry, function(err, res){
      if(err) {
        util.log('ResourceGroup save failed: ' + err);
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