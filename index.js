var archiver = require( "archiver" );
var assert = require( "assert" );
var fs = require( "fs" );
var path = require( "path" );
var Q = require( "q" );

Q.longStackSupport = true;

function set( files, filepath, data ) {

	// String or Buffer.
	if ( typeof data === "string" || Buffer.isBuffer( data ) ) {
		files[ filepath ] = data;

	// Object containing (subpath, data) key-value pairs.
	} else if ( typeof data === "object" ) {
		Object.keys( data ).forEach(function( subpath ) {
			set( files, path.join( filepath, subpath ), data[ subpath ] );
		});
	} else {
		throw new Error( "Invalid type `" + typeof data + "` for `" + filepath + "` (String, Buffer or Object expected)." );
	}
}

function Builder( files, Package, runtimeVars ) {
	var builtFiles, pkg;
	var ready = Q.defer();

	assert( typeof files === "object", "Must include files object" );
	assert( typeof Package === "function", "Must include Package class" );
	if ( runtimeVars !== undefined ) {
		assert( typeof Package === "object", "Invalid runtimeVars type (object expected)" );
	}

	runtimeVars = runtimeVars || {};

	this.pkg = pkg = new Package( files, runtimeVars );

	assert( typeof pkg === "object", "Could not create Package instance" );

	pkg.files = files;
	pkg.runtime = runtimeVars;

	// Generate the build files (based on each Package method).
	this.builtFiles = builtFiles = {};

	Q.all( Object.keys( Package.prototype ).map(function( methodName ) {
		var deferred = Q.defer();
		var filepath = methodName;
		var method = pkg[ methodName ];

		var type = typeof method;

		// String (builtFile is a shallow copy of file whose path has been passed).
		if ( type === "string" ) {
			builtFiles[ filepath ] = files[ method ];
			deferred.resolve();

		// Async function.
		} else if ( type === "function" && method.length ) {
			pkg[ methodName ](function( error, data ) {
				if ( error ) {
					return deferred.reject( error );
				}
				try {
					set( builtFiles, filepath, data );
					deferred.resolve();
				} catch( error ) {
					deferred.reject( error );
				}
			});
		
		// Sync function.
		} else if ( type === "function" ) {
			try {
				set( builtFiles, filepath, pkg[ methodName ]() );
				deferred.resolve();
			} catch( error ) {
				deferred.reject( error );
			}

		// Unknown.
		} else {
			deferred.reject( new Error( "Invalid type `" + typeof method + "` for method `" + methodName + "`" ) );
		
		}

		return deferred.promise;

	})).then(function() {
		ready.resolve();

	}).catch(function( error ) {
		ready.reject( error );
	});

	this.ready = ready.promise;
}

/**
 * .toJson( callback )
 *
 * @callback( error ) [ Function ]: callback function.
 */
Builder.prototype.toJson = function( callback ) {
	var files = this.builtFiles;
	this.ready.then(function() {
		callback( null, files );
	}).catch( callback );
};

/**
 * .toZip( target, callback )
 *
 * @target [ Stream / String ]: The target stream, or the target filename (when string).
 *
 * @callback( error ) [ Function ]: callback function.
 */
Builder.prototype.toZip = function( target, callback ) {
	var files = this.builtFiles;
	this.ready.then(function() {
		var finishEvent = "finish",
			zip = archiver( "zip" );

		if ( typeof target === "string" ) {
			target = fs.createWriteStream( target );
		}

		if ( typeof target.fd !== "undefined" ) {
			finishEvent = "close";
		}

		target.on( finishEvent, function() {
			callback( null, zip.archiver.pointer );
		});

		zip.on( "error", callback );
		zip.pipe( target );

		Object.keys( files ).forEach(function( filepath ) {
			var data = files[ filepath ] || "";
			zip.addFile( data, { name: filepath } );
		});

		zip.finalize();
	}).catch( callback );
};

module.exports = Builder;
