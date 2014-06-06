# Staticdata Module

Staticdata module for gracenode framework.

This is designed to function within gracenode framework.

## How to include it in my project

To add this package as your gracenode module, add the following to your package.json:

```
"dependencies": {
        "gracenode": "",
        "gracenode-staticdata": ""
}
```

To use this module in your application, add the following to your gracenode bootstrap code:

```
var gracenode = require('gracenode');
// this tells gracenode to load the module
gracenode.use('gracenode-staticdata');
```

To access the module:

```
// the prefix gracenode- will be removed automatically
gracenode.staticdata
```


Access
<pre>
gracenode.staticdata
</pre>

Configurations
```javascript
// staticdata module supports CSV and JSON format
{
	"modules": {
		"staticdata": {
			"path": "directory path to the static files",
			"delimiter": optional and defaults to ',', // for parsing CSV files
			"index": { // optional // for getOneByIndex and getManyByIndex
				"staticFileName": ["indexName", [...]]
			},
			"maxOpenFiles": <int> // optional. the number of opened and read files at once on set up. default is 100
		}
	}
}
```

## CSV

### Supported CSV Delimiters

gracenode-staticdata module supports the following delimiters in CSV file format:

- Comma (,)
- Tab (\t)
- Semicolon (;)
- Caret (^)
- Vertical bar (|)

### Escaping Characters

If your CSV data contains the same characters as the deimiter, the characters must be escaped with a backslash (\).

Example (delimiter is ,):

```
"id","name","age"
100,"Marley, Bob",33
101,"Harper, Ben",45
```

***

#####API: *csvToObj*

Parses CSV data into an object.

<pre>
Object csvToObj(String csvData)
</pre>

#####API: *create*
<pre>
StaticData create(String dataName)
</pre>
> Returns and instance of StaticData class
>> Example:
```javascript
/* 
In order to create a static data object from a static data file called "example.csv",
do the following:
*/
var example = gracenode.staticdata.create('example');
```

##### StaticData class

> **getOneByIndex**
<pre>
mixed getOneByIndex(String indexName, String indexKey)
</pre>
**getManyByIndex**
<pre>
mixed getManyByIndex(String indexName, Array indexKeyList)
</pre>
**getOne**
<pre>
mixed getOne(mixed key)
</pre>
**getMany**
<pre>
mixed getMany(Array keyList)
</pre>
**getAll**
<pre>
mixed getAll()
</pre>
**getAllByIndexName**
<pre>
mixed getAllByIndexName(String indexName)
</pre>
