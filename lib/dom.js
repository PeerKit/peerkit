//var RESOURCE_TIMEOUT = 30;

function DomManager (options) {
  if (!(this instanceof DomManager)) return new DomManager(options);
  
  EventEmitter.call(this);

  var self = this;
  
  options = util.extend({
    debug: false,
    types: ['img'] //supported resource types
  }, options);
  self._options = options;
    
  //resource handling source
  self._r = {
    'img, script':{
      source:'src',
      render:function(data){ //data is the blob
        return window.URL.createObjectURL(data);
      }
    },
    'a, link':{},
    //route resource type to handling source 
    route:function(type){
      for(var subgroup in self._r) {
        return subgroup;
      }
    }
  };

  //initialize ResourceGroup cache
  self.cache = {};

  //initialize - cleares all img urls, stores in cache
  self._init();
}

util.inherits(DomManager, EventEmitter);

//pull url ID from tag, clears URL from element, resource type agnostic, 
DomManager.prototype.flush = function(el)
{
  var type = el.tagName, 
        source = this._r.route(type)['source'],
        url;
  url = el[source];
  el[source] = ""; //clear source
  return url; //don't sanitize, only sanitize on comparisons JIC for fallback URL using utils.compare(), 
        //cannot reliably desanitize either.
}

//fallback for unavailable
DomManager.prototype.fallback = function(url)
{
  //write the regular url in place of the dataurl
  this.cache[url].write(url);
}

//files we need to dl
DomManager.prototype.getDownloadList = function()
{
  var retArr = [];
  var cacheKeys = Object.keys(cache);
  for (var i = 0; i < cacheKeys.length; i++) {
    var url = cacheKeys[i];
    if (!cache[url].data) {
      retArr.push(url);
    }
  }
  return retArr;
}

//files we have to transfer
DomManager.prototype.getAvailableList = function()
{
  var retArr = [];
  var cacheKeys = Object.keys(cache);
  for (var i = 0; i < cacheKeys.length; i++) {
    var url = cacheKeys[i];
    if (cache[url].data) {
      retArr.push(url);
    }
  }
  return retArr;
}

DomManager.prototype._init = function()
{
  this._els = document.querySelectorAll(this._options.types.join(','));
  for(var src in this._els)
  {
    var url = this.flush(src); //clear & retreive url
    if(!this.cache[url])
      this.cache[url] = new ResourceGroup(url,src.tagName);
    else
      this.cache[url].push(src);
  }
}

exports.DomManager = DomManager;

//hash url, size, type, 
//manages resource group dom writing clustered by redundant URLs & ele type
function ResourceGroup(url, type)
{
  var self = this;
  //
  this._url = url;
  this._type = type;
  this._els = [];//query for all elements

  this.data = ResourceManager.get(url); //will return blob data if resource is cached in localStorage/browser ... not URL, resourcemanager has to transfer from browserCache to localStorage.

  EventEmitter.call(this);
}

ResourceGroup.prototype.push = function(el)
{
  if(el.tagName != this._type)
    return false;
  if(this.data) //if the resource is cached
    this._w(el,this._r.route(this._type)['render'](this.data)); //rener the blob data 
  thie._els.push(el);

};
ResourceGroup.prototype.save = function(url,data)
{
  //cache the resource
  ResourceManager.save(url,data);

  //write it to the dom
  cache[url].render(data);
};

//render
ResourceGroup.prototype.render = function(blob)
{
  this.write(this._r.route(this._type)['render'](blob));
};

//actually render
ResourceGroup.prototype.write = function(data)
{
  if(this.data) return;
  //loop through this._els and write data
  for(var el in this._els)
    this._w(el,data); //render
  this.data = data;
}


//really actually render
ResourceGroup.prototype._w = function(el,data) //rename to write and writeAll
{
  el[this._r.route(type)['source']] = data;
}

util.inherits(ResourceGroup, EventEmitter);
