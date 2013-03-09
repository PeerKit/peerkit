
//hash url, size, type, 
//manages resource group dom writing clustered by redundant URLs & ele type
function ResourceGroup(url, type) {
  var self = this;
  
  EventEmitter.call(this);
  //
  this._url = url;
  this._type = type;
  this._els = [];//query for all elements

  this.data = ResourceManager.get(url); //will return blob data if resource is cached in localStorage/browser ... not URL, resourcemanager has to transfer from browserCache to localStorage.

  
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

ResourceGroup.prototype.save = function(url, data) {
  //cache the resource
  ResourceManager.save(url, data);

  //write it to the dom
  this.writeAll(DomManager.methods[this._type]['render'](blob));
};


//actually render
ResourceGroup.prototype.writeAll = function(data) {
  if (this.data) return;
  //loop through this._els and write data
  for(var i = 0; i < this._els.length; i++) {
    this.write(this._els[i], data); //render
  }
  this.data = data;
};


//really actually render
ResourceGroup.prototype.write = function(el,data) {
  el[DomManager.method[type]['source']] = data;
};

exports.ResourceGroup = ResourceGroup;