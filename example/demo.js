var shared = 0;


// Create PeerKit client
var client = new CdnClient({host: 'demo-cloud.peerkit.com', port: 9001, useCache: false, instrument: true});

client.on('error', function(){
  hideLoading();
  document.getElementById('ugly').style.display = 'block';
});
// Events to show the stats
client.on('resource', function(_file, _data, clients){
  hideLoading();
  document.getElementById('good').style.display = 'block';
  document.getElementById('from').innerHTML = clients;
});

client.on('unavailable', function(){
  hideLoading();
  document.getElementById('bad').style.display = 'block';
});

client.on('shared', function(){
  console.log('shared called');
  document.getElementById('sharedto').innerHTML = ++shared;
});


// Get log output
window.log = function(copy){
  var e = document.getElementById('status');
  e.innerHTML += copy + '\n';
  e.scrollTop = e.scrollHeight;
};

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
};