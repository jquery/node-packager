import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "chai";
import Packager from "../index.js";

const dirname = path.dirname( fileURLToPath( import.meta.url ) );

var files = {
	"foo": fs.readFileSync( dirname + "/fixtures/foo" ),
	"bar": fs.readFileSync( dirname + "/fixtures/bar" )
};

describe( "Package", function() {

	describe( "String method for shallow copy", function() {
		var output;
		function Package() {}
		Package.prototype.output = "foo";

		before( function( done ) {
			var pkg = new Packager( files, Package );
			pkg.toJson( function( error, files ) {
				if ( error ) {
					done( error );
				}
				output = files.output.toString( "utf-8" );
				done();
			} );
		} );

		it( "should work", function() {
			expect( output ).to.equal( "foo\n" );
		} );
	} );

	describe( "Sync method for sync processed output", function() {
		describe( "Returning a Buffer", function() {
			var builtFiles;
			function Package() {}
			Package.prototype.output = function() {
				return this.files.foo;
			};

			before( function( done ) {
				var pkg = new Packager( files, Package );
				pkg.toJson( function( error, _builtFiles ) {
					if ( error ) {
						done( error );
					}
					builtFiles = _builtFiles;
					done();
				} );
			} );

			it( "should work", function() {
				expect( builtFiles ).to.contain.keys( "output" );
				expect( builtFiles.output.toString( "utf-8" ) ).to.equal( "foo\n" );
			} );
		} );

		describe( "Returning a String", function() {
			var builtFiles;
			function Package() {}
			Package.prototype.output = function() {
				return this.files.foo.toString( "utf-8" ) + this.files.bar.toString( "utf-8" );
			};

			before( function( done ) {
				var pkg = new Packager( files, Package );
				pkg.toJson( function( error, _builtFiles ) {
					if ( error ) {
						done( error );
					}
					builtFiles = _builtFiles;
					done();
				} );
			} );

			it( "should work", function() {
				expect( builtFiles ).to.contain.keys( "output" );
				expect( builtFiles.output ).to.equal( "foo\nbar\n" );
			} );
		} );

		describe( "Returning an Object containing (subpath, data) key-value pairs for expanding an entrypoint into multiple files", function() {
			var builtFiles;
			function Package() {}
			Package.prototype.output = function() {
				return {
					"baz": "baz",
					"qux/quux": "quux"
				};
			};

			before( function( done ) {
				var pkg = new Packager( files, Package );
				pkg.toJson( function( error, _builtFiles ) {
					if ( error ) {
						done( error );
					}
					builtFiles = _builtFiles;
					done();
				} );
			} );

			it( "should work", function() {
				expect( builtFiles ).to.contain.keys( "output/baz", "output/qux/quux" );
				expect( builtFiles[ "output/baz" ] ).to.equal( "baz" );
				expect( builtFiles[ "output/qux/quux" ] ).to.equal( "quux" );
			} );
		} );

		describe( "Returning null", function() {
			var builtFiles;
			function Package() {}
			Package.prototype.output = function() {
				return null;
			};

			before( function( done ) {
				var pkg = new Packager( files, Package );
				pkg.toJson( function( error, _builtFiles ) {
					if ( error ) {
						done( error );
					}
					builtFiles = _builtFiles;
					done();
				} );
			} );

			it( "should work", function() {
				expect( builtFiles ).to.not.contain.keys( "output" );
			} );
		} );

		describe( "Throwing an error", function() {
			var error;
			function Package() {}
			Package.prototype.output = function() {
				throw new Error( "error" );
			};

			before( function( done ) {
				var pkg = new Packager( files, Package );
				pkg.toJson( function( _error ) {
					error = _error;
					done();
				} );
			} );

			it( "should work", function() {
				expect( error ).to.be.an.instanceof( Error );
			} );
		} );
	} );

	describe( "Async method for async processed output", function() {
		describe( "Returning a Buffer", function() {
			var builtFiles;
			function Package() {}
			Package.prototype.output = function( callback ) {
				var files = this.files;
				setTimeout( function() {
					callback( null, files.foo );
				}, 100 );
			};

			before( function( done ) {
				var pkg = new Packager( files, Package );
				pkg.toJson( function( error, _builtFiles ) {
					if ( error ) {
						done( error );
					}
					builtFiles = _builtFiles;
					done();
				} );
			} );

			it( "should work", function() {
				expect( builtFiles ).to.contain.keys( "output" );
				expect( builtFiles.output.toString( "utf-8" ) ).to.equal( "foo\n" );
			} );
		} );

		describe( "Returning a String to skip an entrypoint", function() {
			var builtFiles;
			function Package() {}
			Package.prototype.output = function( callback ) {
				var files = this.files;
				setTimeout( function() {
					callback( null, files.foo.toString( "utf-8" ) + files.bar.toString( "utf-8" ) );
				}, 100 );
			};

			before( function( done ) {
				var pkg = new Packager( files, Package );
				pkg.toJson( function( error, _builtFiles ) {
					if ( error ) {
						done( error );
					}
					builtFiles = _builtFiles;
					done();
				} );
			} );

			it( "should work", function() {
				expect( builtFiles ).to.contain.keys( "output" );
				expect( builtFiles.output ).to.equal( "foo\nbar\n" );
			} );
		} );

		describe( "Returning an Object containing (subpath, data) key-value pairs for expanding an entrypoint into multiple files", function() {
			var builtFiles;
			function Package() {}
			Package.prototype.output = function( callback ) {
				setTimeout( function() {
					callback( null, {
						"baz": "baz",
						"qux/quux": "quux"
					} );
				}, 100 );
			};

			before( function( done ) {
				var pkg = new Packager( files, Package );
				pkg.toJson( function( error, _builtFiles ) {
					if ( error ) {
						done( error );
					}
					builtFiles = _builtFiles;
					done();
				} );
			} );

			it( "should work to skip an entrypoint", function() {
				expect( builtFiles ).to.contain.keys( "output/baz", "output/qux/quux" );
				expect( builtFiles[ "output/baz" ] ).to.equal( "baz" );
				expect( builtFiles[ "output/qux/quux" ] ).to.equal( "quux" );
			} );
		} );

		describe( "Returning null", function() {
			var builtFiles;
			function Package() {}
			Package.prototype.output = function() {
				return null;
			};
			Package.prototype.output = function( callback ) {
				setTimeout( function() {
					callback( null, null );
				}, 100 );
			};

			before( function( done ) {
				var pkg = new Packager( files, Package );
				pkg.toJson( function( error, _builtFiles ) {
					if ( error ) {
						done( error );
					}
					builtFiles = _builtFiles;
					done();
				} );
			} );

			it( "should work", function() {
				expect( builtFiles ).to.not.contain.keys( "output" );
			} );
		} );

		describe( "Throwing an error", function() {
			var error;
			function Package() {}
			Package.prototype.output = function( callback ) {
				setTimeout( function() {
					callback( new Error( "error" ) );
				}, 100 );
			};

			before( function( done ) {
				var pkg = new Packager( files, Package );
				pkg.toJson( function( _error ) {
					error = _error;
					done();
				} );
			} );

			it( "should work", function() {
				expect( error ).to.be.an.instanceof( Error );
			} );
		} );
	} );

} );
