## Why node-packager?

Use `node-packager` to generate the built package for your library or application.

It's ideal for applications that builds packages on the fly using [Node.js][].

[Node.js]: http://nodejs.org/

## Usage

   npm install node-packager

```javascript
var fs = require( "js" );
var glob = require( "glob" );
var extend = require( "util" )._extend;
var Package = require( "./package" )
var Packager = require( "node-packager" );

var files = glob.sync( "+(LICENSE.txt|src/**)", { nodir: true } ).reduce(function( files, filepath ) {
  files[ filepath ] = fs.readFileSync( filepath );
  return files;
}, {} );

var builder = Packager( files, Package, {
  includeImages: true
});
var stream = fs.createWriteStream( "myapp.zip" );
builder.zipTo( stream, function( error ) {
  if ( error ) {
    return console.error( error );
  }
  console.log( "Built myapp.zip" );
});
```

package.js:

```javascript
function Package() {}

extend( Package.prototype, {

  // Shallow copy
  "LICENSE.txt": "LICENSE.txt",

  // Sync processing
  "app.css": function() {

    // Return a String or Buffer with the file data.
    return buildCss();
  },

  // Async processing
  "app.js": function( callback ) {

    // Call `callback( error, data )`, where data is a String with the file data.
    buildJs( callback );
  },

  "images/": function() {
    var files, imagesFiles;

    // this.files and this.runtime are available.
    if ( this.runtime.includeImages ) {
      files = this.files;
      imagesFiles = {};
      Object.keys( this.files ).filter(function( filepath ) {
        return minimatch( filepath, "src/images/*" );
      }).forEach(function( filepath ) {
        imagesFiles[ path.basename( filepath ) ] = files[ filepath ];
      });
      return imagesFiles
    }

    // Skip "images/" by returning null.
    return null;
  }
});

module.exports = Package;
```

## API

- **`Packager( files, Package [, runtimeVars] )`**

**files** *Object* containing (path, data) key-value pairs, e.g.,

```
{
   <path-of-file-1>: <data-of-file-1>,
   <path-of-file-2>: <data-of-file-2>,
   ...
}
```

Files will be available on Package via `this.files` attribute.

**Package** *Function/Class* The Package class.

**runtimeVars** *Object* Optional object including runtime variables.

Runtime variables will be available on Package via `this.runtime` attribute.

- **`Packager.prototype.toJson( callback )`**

**callback** *Function* called with two arguments: null or an Error object and the built files
object.

- **`Packager.prototype.toZip( target, callback )`**

**target** *Stream/String* The target stream, or the target filename (when string).

**callback** *Function* called when write is complete, with one argument: null or
an Error object.


## Test

    npm test

## License

MIT © [Rafael Xavier de Souza](http://rafael.xavier.blog.br)
