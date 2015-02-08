function Package() {}

Package.prototype.shallowcopyfoo = "foo";
Package.prototype.shallowcopybar = "bar";

Package.prototype.sync = function() {
	return this.files.foo.toString( "utf-8" ) + this.files.bar.toString( "utf-8" );
};

Package.prototype.async = function( callback ) {
	var files = this.files;
	setTimeout(function() {
		callback( null, files.foo.toString( "utf-8" ) + files.bar.toString( "utf-8" ) );
	}, 100);
};

Package.prototype.multiple = function() {
	return {
		"foo": this.files.foo,
		"bar": this.files.bar
	};
};

Package.prototype.null = function() {
	return null;
};

module.exports = Package;
