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

######.inflate()
<pre>
void inflate(Object staticdata, String parentKey, String childKey)
</pre>

Combines 2 staticdata objects on `parentKey` and `childKey`.

`parentKey` is the column from source staticdata and `childKey` is the column from the staticdata given to the function.

**NOTE:** The child staticdata MUST be indexed by `childKey`.

Example:

```javascript
// CSV data of men.csv
name,wife
Bob,1
Kevin,2
Nathan,3
/*
[
	{ "name": "Bob", "wife": 1 },
	{ "name": "Kevin", "wife": 2 },
	{ "name": "Nathan", "wife": 3 }
]
*/
// CSV data of women.csv
id,name
1,Sandy
2,Olivia
3,Jess
/*
[
	{ "id": 1, "name": "Sandy" }
	{ "id": 2, "name": "Olivia" }
	{ "id": 3, "name": "Jess" }
]
*/
// inflate the 2 files
var men = gracenode.staticdata.create('men');
var women = gracenode.staticdata.create('women');
men.inflate(women, 'wife', 'id');
/*
Resulting data
[
	{
		"name": "Bob",
		"wife": {
			"id": 1,
			"Sandy"
		}
	},
	{
		"name": "Kevin",
		"wife": {
			"id": 2,
			"Olivia"
		}
	},
	{
		"name": "Nathan",
		"wife": {
			"id": 3,
			"Jess"
		}
	}
]
*/
```

######.getOneByIndex()
<pre>
mixed getOneByIndex(String indexName, String indexKey, Array props)
</pre>

######.getManyByIndex()
<pre>
mixed getManyByIndex(String indexName, Array indexKeyList, Array props)
</pre>

######.getOne()
<pre>
mixed getOne(mixed key, Array props)
</pre>

######.getMany()
<pre>
mixed getMany(Array keyList, Array props)
</pre>

######.getAll()
<pre>
mixed getAll(Array props)
</pre>

######.getAllByIndexName()
<pre>
mixed getAllByIndexName(String indexName, Array props)
</pre>

### All get methods accepts an array of property names as an option to retrieve ONLY the given properties
