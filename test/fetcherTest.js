describe('fetcher', function(){
  PeerClient = function(peers, socket, options) {
    if (!(this instanceof PeerClient)) return new PeerClient(options);

    EventEmitter.call(this);

    var self = this;

    options = util.extend({
      debug: false
    }, options);
    this._options = options;


    // This connects to the PeerCDN server
    var host = "localhost";
    var port = 8080;
    this._socket = new Socket(host, port);

    // Wait for list of peers from server
    this._socket.on('resource', function(url, peers){
      // Download image from Peers

    });
    this.send = function(msg){

    };
    setTimeout(function(){
      self.emit('open');
    },0);

  }



  util.inherits(PeerClient, EventEmitter);



  /*
  function PeerFetcher2(file, peers, options) {
    PeerFetcher.call(this, file, peers, options); //call super constructor.
  }

  PeerFetcher2.prototype = Object.create(PeerFetcher.prototype);
  */




  describe('_init', function(){
    it ('should init without errors', function(done){
      var testPeerFetcher = new PeerFetcher({name: 'herp.psd', size: '1024'}, [{}, {}, {}],{},{chunkSize:1000});
      expect(testPeerFetcher._chunks.length).to.be(2);
      var expectedChunks = [{start:0 , end:999} , {start:1000, end:1023}];
      expect(testPeerFetcher._chunks).to.eql(expectedChunks);
      done();
    })
  });


  describe('_defineChunks', function(){
    it ('works for fileSize a divisor of maxChunkSize', function(done){
      var testPeerFetcher = new PeerFetcher({name: 'herp.psd', size: '1600'}, [{}, {}, {}]);
      expect(testPeerFetcher._chunks.length).to.be(2);
      var expectedChunks = [{start:0 , end:799} , {start:800, end:1599}];
      expect(testPeerFetcher._chunks).to.eql(expectedChunks);
      done();
    });
    it ('works for fileSize one less than maxChunkSize', function(done){
      var testPeerFetcher = new PeerFetcher({name: 'herp.psd', size: '799'}, [{}, {}, {}]);
      expect(testPeerFetcher._chunks.length).to.be(1);
      var expectedChunks = [{start:0 , end:798}];
      expect(testPeerFetcher._chunks).to.eql(expectedChunks);
      done();
    });
    it('works for fileSize one greater than maxChunkSize', function(done){
      var testPeerFetcher = new PeerFetcher({name: 'herp.psd', size: '801'}, [{}, {}, {}]);
      expect(testPeerFetcher._chunks.length).to.be(2);
      var expectedChunks = [{start:0 , end:799}, {start:800 , end:800}];
      expect(testPeerFetcher._chunks).to.eql(expectedChunks);
      done()
    });
  });

  describe('_receiveData', function(){
    it('works', function(done){
      var testPeerFetcher = new PeerFetcher({name: 'herp.psd', size: '1024'}, [{}, {}, {}], {debug: true});
      setTimeout(function() {
        var arrayBuffer = new ArrayBuffer(224);
        var testIntArray = new Uint8Array(arrayBuffer)
        for (var i = 0; i < testIntArray.length; i = i + 1){
          testIntArray[i] = 0xFF
        }
        testPeerFetcher._receiveData(0,undefined,800,1023,arrayBuffer);
        expect(testPeerFetcher._peers[0]).to.not.have.key('chunk');
        var intArray = new Uint8Array(testPeerFetcher._buffer);
        //if you're wondering why this takes so long, it's because we have to check everything in the buffers. we can't do eql because the offset field is different
        for (var i = 0; i < 800; i++){
          expect(intArray[i]).to.equal(0);
        }
        for(var i = 800; i < 1024; i++){
          expect(intArray[i]).to.equal(testIntArray[i-800]);
        }
        expect(testPeerFetcher._workingPeers[0]).to.not.be.ok();
        done();
      }, 0);
    });
  });

  describe('_invalidPeer', function(){
    it('should delete the peer and chunk is back on queue in the obvious case', function(done){
      var testPeerFetcher = new PeerFetcher({name: 'herp.psd', size: '1024'}, [{}, {}], {debug: true});
      setTimeout(function() {
        testPeerFetcher._chunks = [{start:1000, end:1023}];
        testPeerFetcher._peers[0].chunk = {start:0 , end:999} 
        testPeerFetcher._invalidPeer(0);
        expect(testPeerFetcher._workingPeers).to.not.have.key(0);
        expect(testPeerFetcher._chunks).to.eql([{start:1000, end:1023},{start:0 , end:999}]);
        done();
      }, 0);
    });

    it('should wake all peers if no chunks', function(done){
      var testPeerFetcher = new PeerFetcher({name: 'herp.psd', size: '1024'}, [{}, {}, {}], {debug: true});
      setTimeout(function() {
        testPeerFetcher._chunks = [];
        testPeerFetcher._peers[0].chunk = {start:0 , end:999}; // a special chunk to ensure it is passed
        testPeerFetcher._peers[1].chunk = null;
        testPeerFetcher._workingPeers[1] = false;
        testPeerFetcher._invalidPeer(0);
        expect(testPeerFetcher._peers[1].chunk).to.eql({start:0 , end:999});
        done();
      }, 0);
      
    });

    //this test will timeout unless the fetcher is properly emitting
    it('should emit unavailable if the very last peer fails and no chunks', function(done){
      var testPeerFetcher = new PeerFetcher({name: 'herp.psd', size: '1024'}, [{}], {debug: true});
      testPeerFetcher.on('unavailable', function(){
        done();
      });
      setTimeout(function() {
        testPeerFetcher._chunks = [];
        testPeerFetcher._peers[0].chunk = {start:0 , end:799} 
        testPeerFetcher._invalidPeer(0);
      }, 0);

    });

  });
  describe('_next', function(){
    it('', function(){

    });
  });
  describe('_wakeAllPeers', function(){
    it('', function(){

    });
  });
});
