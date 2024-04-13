import fs from "node:fs";
import path from "node:path";
import { Writable } from "node:stream";
import { fileURLToPath } from "node:url";
import { expect } from "chai";
import Packager from "../index.js";
import { Package } from "./fixtures/package.js";

const dirname = path.dirname( fileURLToPath( import.meta.url ) );

const files = {
	"foo": fs.readFileSync( dirname + "/fixtures/foo" ),
	"bar": fs.readFileSync( dirname + "/fixtures/bar" )
};

describe( "Packager#toZip()", function() {
	const pkg = new Packager( files, Package );

	it( "should generate its ZIP package (compressed content not tested)", function( done ) {
		let somethingWritten = false;
		const wstream = new Writable();

		wstream._write = function( chunk, encoding, done ) {
			expect( chunk ).to.be.instanceof( Buffer );
			somethingWritten = true;
			done();
		};

		wstream.on( "pipe", function( src ) {
			expect( src._format ).to.equal( "zip" );
		});

		pkg.toZip( wstream, function( error ) {
			expect( error ).to.be.null;
			expect( somethingWritten ).to.be.true;
			done();
		});
	});
});
