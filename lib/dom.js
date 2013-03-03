var RESOURCE_TIMEOUT = 30;

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
  self._r = 
  {
  	['img','script']:
  	{
  		source:'src',
  		render:function(ele,data)
  		{
  			return "";
  		}
  	},
  	['a','link']:{},
  	//route resource type to handling source 
  	route:function(type)
  	{
  		for(var subgroup in self._r)
  			return subgroup;
  	}
  }

  //initialize ResourceGroup cache
  self.cache = {};

  //initialize - cleares all img urls, stores in cache
  (function()
  {
  	self._els = document.querySelectorAll(options.types.join(','));
  	for(var src in self._els)
  	{
  		var url = self.flush(src); //clear & retreive url
  		if(!self.cache[url])
  			self.cache[url] = new ResourceGroup(url,src.tagName);
  		else
  			self.cache[url].push(src);
  	}
  }());
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
	return [url for (url in cache) if (!cache[url].data)];
}

//files we have to transfer
DomManager.prototype.getAvailableList = function()
{
	return [url for (url in cache) if (cache[url].data)];
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

	this.data = ResourceManager.get(url);

	EventEmitter.call(this);
}

ResourceGroup.prototype.push = function(el)
{
	if(el.tagName != this._type)
		return false;
	if(this.data)
		this._w(el,data);
	thie._els.push(el);

};
ResourceGroup.prototype.save = function(url,data)
{
	//cache the resource
	ResourceManager.save(url,data);

	//write it to the dom
	this.render(data);
};

//render
ResourceGroup.prototype.render = function(data)
{
	this.write(this._r.route(this._type)['render'](data));
};

//actually render
ResourceGroup.prototype.write = function(data)
{
	if(this.data) return;
	//loop through this._els and write data
	for(var el in this._els)
		this._w(el,data) //render
	this.data = data;
}


//really actually render
ResourceGroup.prototype._w = function(el,data) //rename to write and writeAll
{
	el[this._r.route(type)['source']] = data;
}

util.inherits(ResourceElement, EventEmitter);
