describe('util', function(){
  var testRandom = function(fn) {
    var i = 0
      , generated = {};
    while(i < 25) {
      var p = fn();
      if (generated[p]) throw new Error('not so random')
      generated[p] = 1;
      i++;
    }
  }

  it('inherits', function() {
    function ctor() {}
    function superCtor() {}
    superCtor.prototype.test = function() { return 5; }
    util.inherits(ctor, superCtor);
    expect(new ctor()).to.be.a(superCtor);
    expect(new ctor().test()).to.be.equal(5);
  });

  /*
   *  extend overwrites keys if already exists
   *  leaves existing keys alone otherwise
   */
  it('extend', function() {
    var a = {a: 1, b: 2, c: 3, d: 4}
      , b = {d: 2};
    util.extend(b, a);
    expect(b).to.eql(a);
    expect(b.d).to.be.equal(4);
    b = {z: 2};
    util.extend(b, a);
    expect(b.z).to.be.equal(2);
  });

  it('pack', function() {
    expect(util.pack).to.be.equal(BinaryPack.pack);
  });

  it('unpack', function() {
    expect(util.unpack).to.be.equal(BinaryPack.unpack);
  });

  it('randomPort', function() {
    testRandom(util.randomPort);
  });

  // FF no like
  it('log', function(done) {
    var consolelog = console.log;
    // default is false
    expect(util.debug).to.be.equal(false);
    util.debug = true;
    console.log = function() {
      var arg = Array.prototype.slice.call(arguments);
      expect(arg.join(' ')).to.be.equal('PeerJS:  hi');
      done();
    }
    util.log('hi');
    // reset
    console.log = consolelog;
    util.debug = false;
  });

  it('setZeroTimeout', function(done) {
    done();
  });

  it('blobToArrayBuffer', function(done) {
    var blob = new Blob(['hi']);
    util.blobToArrayBuffer(blob, function(result) {
      expect(result.byteLength).to.be.equal(2);
      expect(result.slice).to.be.a('function');
      expect(result instanceof ArrayBuffer).to.be.equal(true);
      done();
    });
  });

  it('blobToBinaryString', function(done) {
    var blob = new Blob(['hi']);
    util.blobToBinaryString(blob, function(result) {
      expect(result).to.equal('hi');
      done();
    });
  });

  it('binaryStringToArrayBuffer', function() {
    var ba = util.binaryStringToArrayBuffer('\0\0');
    expect(ba.byteLength).to.be.equal(2);
    expect(ba.slice).to.be.a('function');
    expect(ba instanceof ArrayBuffer).to.be.equal(true);
  });

  it('randomToken', function() {
    testRandom(util.randomToken);
  });
/*
	describe('fillBuffer', function(){
    it('should error when lengths not equal', function(){
      var testFillBuffer = new ArrayBuffer(8);
      var testDataBuffer = new ArrayBuffer(4);
      var testDataBufferUint = new Uint8Array(testDataBuffer);
      for (var i = 0; i < testDataBufferUint.length; i++) {
        testDataBufferUint[i] = 0xFF;
      }
      expect(function(){util.fillBuffer(testFillBuffer, 3, 8, testDataBuffer);}, Error).to.throwError();
    });
		it('should move all 1s into last half of buffer of 8 bytes', function(){
			var testFillBuffer = new ArrayBuffer(8);
			var testDataBuffer = new ArrayBuffer(3);
      var testDataBufferUint = new Uint8Array(testDataBuffer);
      for (var i = 0; i < testDataBufferUint.length; i++) {
        testDataBufferUint[i] = 0xFF;
      }
      var actualFillBuffer = new ArrayBuffer(8);
      var actualFillBufferUint = new Uint8Array(actualFillBuffer);
      for (var i = 4; i < 7; i++) {
        actualFillBufferUint[i] = 0xFF;
      }
      expect(util.fillBuffer(testFillBuffer, 4, 7, testDataBuffer)).to.eql(actualFillBuffer);
		});
	});
*/
});