var assert = require('assert');
var gn = require('gracenode');
var prefix = require('./prefix');

describe('gracenode staticdata module ->', function () {

	console.log('***Notice: This test requires gracenode installed in the same directory as this module.');

	it('Can load a CSV file', function (done) {
		gn.setConfigPath(prefix + 'gracenode-staticdata/test/configs/');
		gn.setConfigFiles(['staticdata.json']);		
		gn.use('gracenode-staticdata');

		gn.on('setup.config', function () {
			var sd = gn.config.getOne('modules.gracenode-staticdata');
			if (sd.path.indexOf('node_modules') === -1) {
				sd.path = prefix + sd.path;
			}
		});

		gn.setup(function (error) {
			assert.equal(error, undefined);
			assert(gn.staticdata.create('map'));
			done();
		});
	});

	it('Can get a second element from an array made from a CSV file', function () {
		var sd = gn.staticdata.create('map');
		var usa = sd.getOne(1);
		assert.equal(usa.value, '日本');
	});
	
	it('Can get all elements from an array made from a CSV file', function () {
		var sd = gn.staticdata.create('map');
		var list = sd.getAll();
		var names = ['US', 'JA', 'RU', 'CN'];
		for (var i = 0, len = list.length; i < len; i++) {
			assert.equal(list[i].name, names[i]);
		}	
	});

	it('Can get a data object by indexed column from a CSV file', function () {
		var sd = gn.staticdata.create('map');
		var usa = sd.getOneByIndex('name', 'US');
		assert.equal(usa.value, 'United States of America,US,USA');
	});

	it('Can get all data objects by indexed column from a CSV file', function () {
		var sd = gn.staticdata.create('map');
		var map = sd.getAllByIndexName('name');
		var names = ['US', 'JA', 'RU', 'CN'];
		var i = 0;
		for (var name in map) {
			assert.equal(name, names[i]);
			i++;
		}	
	});

	it('Does not throw an exception when accessing none-indexed map data', function () {
		var sd = gn.staticdata.create('map');
		var map = sd.getAllByIndexName('dummy');
		assert.equal(map, null);
	});

	it('Can get value property only', function () {
		var sd = gn.staticdata.create('map');
		var list = sd.getAll(['value']);
		for (var i = 0, len = list.length; i < len; i++) {
			assert(list[i].value);
			assert.equal(list[i].name, undefined);
		}
	});

	it('Can remove BOM (byte order mark) from CSV files', function () {
		var sd = gn.staticdata.create('sample');
		var data = sd.getOneByIndex('level', 1);
		assert(data);
	});

});
