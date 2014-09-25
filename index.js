/**
 * configurations
 *
 * {
 *		"staticdata": {
 *			"path": "directory path to the source static files",
 *			"delimiter": optional,
 *			"qoute": optional,
 *			"index": optional {
 *				"staticFileName": ["indexName"...] > this must be a cloumn name in the file
 *			}
 *		}
 * }
 *
 * */

var fs = require('fs');
var async = require('async');
var EventEmitter = require('events').EventEmitter;
var fileWatcher = new EventEmitter();

var gracenode = require('../gracenode');
var csv = require('./csv');
var parser = require('./parser');
var log = gracenode.log.create('staticdata');

// maximum number of files to be opened and read at once on setup
var maxOpenFiles = 100;
var config;
var delimiter = ',';
var quote = '"';
var staticData = {}; // static data source object
var sdMap = {}; // static data object map

module.exports.readConfig = function (configIn) {
	if (!configIn || !configIn.path) {
		return new Error('invalid configuration: \n' + JSON.stringify(configIn, null, 4));
	}
	config = configIn;
	// optional
	if (config.delimiter !== undefined) {
		delimiter = config.delimiter;
	}
	if (config.quote !== undefined) {
		quote = config.quote;
	}
	if (config.maxOpenFiles > 0) {
		maxOpenFiles = config.maxOpenFiles;
	}
	// set up CSV parser
	csv.setup(delimiter);
};

module.exports.setup = function (cb) {
	log.verbose('setting up static data module...');
	gracenode.lib.walkDir(gracenode.getRootPath() + config.path, function (error, list) {
		if (error) {
			return cb(error);
		}
		async.eachLimit(list, maxOpenFiles, function (item, nextCallback) {
			readFile(item.file, nextCallback);
		}, cb);
	});
};

/*
* dataName rule:
* configuration path: staticdata/
* example: staticdata/example/test.csv = example/test
*/
module.exports.create = function (dataName) {
	
	// check for existing static data object first
	if (sdMap[dataName]) {
		return sdMap[dataName];
	}	

	// create a new static data object
	if (staticData[dataName]) {
		var sd = new StaticData(dataName, staticData[dataName]);
		sdMap[dataName] = sd;
		return sd;
	}
	return null;
};

module.exports.csvToObj = function (csvData) {
	return toObject('', csvData);
};

function readFile(path, cb) {
	var lastDot = path.lastIndexOf('.');
	var type = path.substring(lastDot + 1);
	var name = path.substring(path.lastIndexOf(config.path) + config.path.length, lastDot);
	fs.readFile(path, 'utf8', function (error, dataBuffer) {
		if (error) {
			return cb(error);
		}
		var data = dataBuffer.toString('utf-8');

		var bytes = dataBuffer.length;
		var kb = bytes / 1024;
		var size = bytes + ' bytes';
		if (kb >= 1) {
			size = Math.round(kb) + ' kb';
		}
		
		log.verbose('static data loaded:', path + ' (' + size + ')');

		switch (type) {
			case 'csv':
				data = toObject(path, data);
				break;
			case 'json':
				try {
					data = JSON.parse(data);
				} catch (e) {
					log.error('Could not turn', name, '(type:', type, ')', 'into object.');
					return cb(e);
				}
				break;
			default:
				data = { data: data };
				break;
			
		}
		
		// check for error
		if (data instanceof Error) {
			return cb(data);
		}
		
		// create index map(s) if asked
		var indexMap = null;
		var fileName = name + '.' + type;
		if (config.index && config.index[fileName]) {
			indexMap = mapIndex(data, config.index[fileName]);
			
			log.verbose('indexed: ', config.index[fileName]);
		}	
		

		// add it to cache
		staticData[name] = { data: data, indexMap: indexMap, path: path };
		
		log.verbose('mapped: ' + path + ' > ' + name);

		// set up file watch listener
		setupChangeListener(path);

		cb();
	});
}

function setupChangeListener(path) {
	
	log.verbose('file change listener setup:', path);

	fs.watch(path, function (event) {
		if (event === 'change') {
			readFile(path, function (error) {
				if (error) {
					return log.error(error);
				}
				
				log.info('file updated [' +  event + ']:', path);
			
				fileWatcher.emit(path);
			});
		}
	});
}

function toObject(file, data) {
	var parsed = csv.parse(file, data);
	var obj = parser.execute(parsed.file, parsed.data);
	log.verbose(obj);
	return obj;
}

function mapIndex(data, indexNames) {
	var map = {};
	for (var c = 0, length = data.length; c < length; c++) {
		var item = data[c];
		for (var i = 0, len = indexNames.length; i < len; i++) {
			var indexName = indexNames[i];
			if (item[indexName] !== undefined) {
				if (!map[indexName]) {
					map[indexName] = {};
				}
				var index = item[indexName];
				if (map[indexName][index]) {
					// index is not unique
					if (!Array.isArray(map[indexName][index])) {
						map[indexName][index] = [map[indexName][index]];
					}
					map[indexName][index].push(item);
				} else {
					// index is unique or this is the first item of the index
					map[indexName][index] = item;
				}
			}
		}
	}
	return map;
}

function StaticData(name, src) {
	this._name = name;
	this._src = src.data;
	this._indexMap = src.indexMap || {};

	// file change listener
	var that = this;
	fileWatcher.on(src.path, function () {
		that.update(staticData[name]);
	});
}

// create multi-dimensional object with another staticdata
// child staticdata MUST be indexed by childKey
StaticData.prototype.inflate = function (childStaticdata, parentKey, childKey) {
	var success = false;
	// check to see if the child staticdata has been indexed by childKey or not
	if (!childStaticdata._indexMap[childKey]) {
		log.error('failed to inflate staticdata [' + this._name + ']: child staticdata [' + childStaticdata._name + '] MUST be index by "' + childKey + '"');
		return success;
	}
	// now inflate the staticdata with childStaticdata
	for (var i = 0, len = this._src.length; i < len; i++) {
		var srcItem = this._src[i];
		var child = childStaticdata.getOneByIndex(childKey, srcItem[parentKey]);
		if (child) {
			srcItem[parentKey] = child;
			if (!success) {
				success = true;
			}
		}
	}
	return success;
};

StaticData.prototype.getOneByIndex = function (indexName, key, props) {
	if (!this._indexMap) {
		return null;
	}
	var data = this._indexMap[indexName] || null;
	if (!data || data[key] === undefined) {
		return null;
	}

	var res = data[key];

	if (typeof res === 'object') {
		return gracenode.lib.cloneObj(res, props);
	}

	return res;
};

StaticData.prototype.getManyByIndex = function (indexName, keyList, props) {
	var res = {};
	for (var i = 0, len = keyList.length; i < len; i++) {
		var key = keyList[i];
		res[key] = this.getOneByIndex(indexName, key, props);
	}	
	return res;
};

StaticData.prototype.getOne = function (index, props) {
	var data = this._src[index];
	if (data === undefined) {
		return null;
	}

	if (typeof data === 'object') {
		return gracenode.lib.cloneObj(data, props);		
	}
	
	return data;
};

StaticData.prototype.getMany = function (indexList, props) {
	var res = {};
	for (var i = 0, len = indexList.length; i < len; i++) {
		var key = indexList[i];
		res[key] = this.getOne(key, props);
	}

	return res;
};

StaticData.prototype.getAll = function (props) {
	return gracenode.lib.cloneObj(this._src, props);
};

StaticData.prototype.getAllByIndexName = function (indexName, props) {
	if (!this._indexMap || this._indexMap[indexName] === undefined) {
		return null;
	}

	return gracenode.lib.cloneObj(this._indexMap[indexName], props);
};

StaticData.prototype.update = function (src) {
	log.verbose('static data [' + this._name + '] has been updated');
	this._src = src.data;
	this._indexMap = src.indexMap;
};
