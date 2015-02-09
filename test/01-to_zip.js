var files;
var Packager = require( "../index.js" );
var expect = require( "chai" ).expect;
var fs = require( "fs" );
var Package = require( "./fixtures/package" );

files = {
	"foo": fs.readFileSync( __dirname + "/fixtures/foo" ),
	"bar": fs.readFileSync( __dirname + "/fixtures/bar" )
};

describe( "Packager#toZip()", function() {
	var pkg = new Packager( files, Package );

	it( "should generate its ZIP package (compressed content not tested)", function( done ) {
		var somethingWritten = false;
		var wstream = new require( "stream" ).Writable();

		wstream._write = function( chunk, encoding, done ) {
			expect( chunk ).to.be.instanceof( Buffer );
			somethingWritten = true;
			done();
		};

		wstream.on( "pipe", function( src ) {
			expect( src._format ).to.equal( "zip" );
		});

		pkg.toZip( wstream, function( error ) {
			expect( error ).to.be.null();
			expect( somethingWritten ).to.be.true;
			done();
		});
	});
});
