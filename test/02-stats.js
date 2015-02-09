var files;
var Packager = require( "../index.js" );
var expect = require( "chai" ).expect;
var fs = require( "fs" );
var Package = require( "./fixtures/package" );

files = {
	"foo": fs.readFileSync( __dirname + "/fixtures/foo" ),
	"bar": fs.readFileSync( __dirname + "/fixtures/bar" )
};

describe( "Packager#stats", function() {
	var pkg = new Packager( files, Package );

	before(function( done ) {
		var wstream = new require( "stream" ).Writable();

		wstream._write = function( chunk, encoding, done ) {
			done();
		};

		pkg.toZip( wstream, done );
	});

	it( "should contain time (stopwatch) statistics for every Package methods", function() {
		expect( pkg.stats.shallowcopyfoo.time ).to.be.a( "number" );
		expect( pkg.stats.shallowcopybar.time ).to.be.a( "number" );
		expect( pkg.stats.sync.time ).to.be.a( "number" );
		expect( pkg.stats.async.time ).to.be.a( "number" );
		expect( pkg.stats.multiple.time ).to.be.a( "number" );
	});

	it( "should contain time (stopwatch) statistics for Packager#toZip method", function() {
		expect( pkg.stats.toZip.time ).to.be.a( "number" );
	});

	it( "should contain size statistics for Packager#toZip method", function() {
		expect( pkg.stats.toZip.size ).to.be.a( "number" );
	});
});
