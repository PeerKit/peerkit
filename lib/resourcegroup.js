
//hash url, size, type, 
//manages resource group dom writing clustered by redundant URLs & ele type
function ResourceGroup(url, type) {
  var self = this;
  
  EventEmitter.call(this);
  //
  this._url = url;
  this._type = type;
  this._els = [];//query for all elements


  var el = ResourceManager.get(url); 
  if (el) {
    el = JSON.parse(el);
    if (el.expiry < (new Date()).getTime()) {
      ResourceManager.remove(url);
    } else {
      util.xhrFile(url, function(blob, d){
        util.log('ResourceGroup constructor URL downloaded with expiry', d);
        self.cache(blob, true, d);
      });
    }
  }
  
}

util.inherits(ResourceGroup, EventEmitter);

ResourceGroup.prototype.push = function(el) {
  if(el.tagName != this._type) {
    return false;
  }
  if(this.data) { //if the resource is cached
    this.write(el, DomManager.methods[this._type]['render'](this.data)); //rener the blob data 
  }
  this._els.push(el);
};


ResourceGroup.prototype.save = function(blob, cache, expiry) {
  if (cache) {
    ResourceManager.save(this.url, {expiry: expiry, size: blob.size});
  }
  this.blob = blob;
  console.log('gonna save', blob);
  this.writeAll(DomManager.methods[this._type]['render'](blob));
};



//actually render
ResourceGroup.prototype.writeAll = function(data) {
  //loop through this._els and write data
  for(var i = 0; i < this._els.length; i++) {
    this.write(this._els[i], data); //render
  }
  this.data = data;
};


//really actually render
ResourceGroup.prototype.write = function(el,data) {
  el[DomManager.methods[this._type]['source']] = data;
};

exports.ResourceGroup = ResourceGroup;