"use strict";

var archiver = require( "archiver" );
var assert = require( "node:assert" );
var fs = require( "node:fs" );
var path = require( "node:path" );

function set( files, filepath, data ) {

	// String or Buffer.
	if ( typeof data === "string" || Buffer.isBuffer( data ) ) {
		files[ filepath ] = data;

	// Object containing (subpath, data) key-value pairs.
	} else if ( typeof data === "object" && data !== null ) {
		Object.keys( data ).forEach( function( subpath ) {
			set( files, path.join( filepath, subpath ), data[ subpath ] );
		} );

	// null
	} else if ( data === null ) {
		return;
	} else {
		throw new Error( "Invalid type `" + typeof data +
			"` for `" + filepath + "` (String, Buffer or Object expected)." );
	}
}

function stopwatch( promise, stats, name ) {
	var start = new Date();
	stats[ name ] = stats[ name ] || {};
	promise.then( function() {
		stats[ name ].time = new Date() - start;
	} );
}

function Packager( files, Package, runtimeVars, options ) {
	var builtFiles, cached, cacheKey, pkg, stats, resolveReady, rejectReady;

	const ready = new Promise( ( resolve, reject ) => {
		resolveReady = resolve;
		rejectReady = reject;
	} );

	assert( typeof files === "object", "Must include files object" );
	assert( typeof Package === "function", "Must include Package class" );
	if ( runtimeVars !== undefined ) {
		assert( typeof runtimeVars === "object", "Invalid runtimeVars type (object expected)" );
	}
	if ( options !== undefined ) {
		assert( typeof options === "object", "Invalid options type (object expected)" );
	}

	options = options || {};

	// TODO: assert options.cache

	runtimeVars = runtimeVars || {};
	this.builtFiles = builtFiles = {};
	this.pkg = pkg = new Package( files, runtimeVars );
	this.ready = ready;
	this.stats = stats = {};

	stopwatch( ready, stats, "build" );

	if ( options.cache ) {
		cacheKey = Package.toString() +
			Object.keys( Package.prototype ).join() +
			JSON.stringify( runtimeVars );

		cached = options.cache.get( cacheKey );

		if ( cached ) {
			this.builtFiles = cached.builtFiles;
			return resolveReady();

		} else {
			this.ready.then( function() {
				options.cache.set( cacheKey, {
					builtFiles: builtFiles
				} );
			} );
		}
	}

	assert( typeof pkg === "object", "Could not create Package instance" );

	pkg.files = files;
	pkg.runtime = runtimeVars;

	// Generate the build files (based on each Package method).
	Promise.all( Object.keys( Package.prototype ).map( function( methodName ) {
		var resolveInner, rejectInner;

		const innerPromise = new Promise( ( resolve, reject ) => {
			resolveInner = resolve;
			rejectInner = reject;
		} );

		var filepath = methodName;
		var method = pkg[ methodName ];

		var type = typeof method;

		stopwatch( innerPromise, stats, filepath );

		// String (builtFile is a shallow copy of file whose path has been passed).
		if ( type === "string" ) {
			builtFiles[ filepath ] = files[ method ];
			resolveInner();

		// Async function.
		} else if ( type === "function" && method.length ) {
			pkg[ methodName ]( function( error, data ) {
				if ( error ) {
					return rejectInner( error );
				}
				try {
					set( builtFiles, filepath, data );
					resolveInner();
				} catch ( error ) {
					rejectInner( error );
				}
			} );

		// Sync function.
		} else if ( type === "function" ) {
			try {
				set( builtFiles, filepath, pkg[ methodName ]() );
				resolveInner();
			} catch ( error ) {
				rejectInner( error );
			}

		// Unknown.
		} else {
			rejectInner( new Error( "Invalid type `" + typeof method +
				"` for method `" + methodName + "`" ) );

		}

		return innerPromise;

	} ) ).then( function() {
		resolveReady();

	} ).catch( function( error ) {
		rejectReady( error );
	} );
}

/**
 * .toJson( callback )
 *
 * @callback( error ) [ Function ]: callback function.
 */
Packager.prototype.toJson = function( callback ) {
	var files = this.builtFiles;
	this.ready.then( function() {
		callback( null, files );
	} ).catch( callback );
};

/**
 * .toZip( target [, options], callback )
 *
 * @target [ Stream / String ]: The target stream, or the target filename (when string).
 *
 * @options [ Object ]:
 * - options.basedir: [ String ] Set the ZIP base directory.
 *
 * @callback( error ) [ Function ]: callback function.
 */
Packager.prototype.toZip = function( target, options, callback ) {
	const toZipPromise = new Promise( ( resolveToZip, rejectToZip ) => {
		var files = this.builtFiles;
		var stats = this.stats;

		if ( arguments.length === 2 ) {
			callback = options;
			options = {};
		}

		this.ready.then( function() {
			var finishEvent = "finish",
				zip = archiver( "zip" );

			if ( options.basedir ) {
				files = Object.keys( files ).reduce( function( _files, filepath ) {
					_files[ path.join( options.basedir, filepath ) ] = files[ filepath ];
					return _files;
				}, {} );
			}

			stopwatch( toZipPromise, stats, "toZip" );

			if ( typeof target === "string" ) {
				target = fs.createWriteStream( target );
			}

			if ( typeof target.fd !== "undefined" ) {
				finishEvent = "close";
			}

			target.on( finishEvent, function() {
				stats.toZip.size = zip.pointer();
				resolveToZip();
			} );

			zip.on( "error", function( error ) {
				rejectToZip( error );
			} );

			zip.pipe( target );

			Object.keys( files ).forEach( function( filepath ) {
				var data = files[ filepath ] || "";
				zip.append( data, { name: filepath } );
			} );

			zip.finalize();
		} ).catch( callback );
	} );

	toZipPromise
		.then( ( result ) => {
			callback( null, result );
		} )
		.catch( ( error ) => {
			callback( error );
		} );
};

module.exports = Packager;
