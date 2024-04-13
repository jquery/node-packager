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

describe( "Packager#stats", function() {
	const pkg = new Packager( files, Package );

	before(function( done ) {
		const wstream = new Writable();

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
