var debug = require('debug')
var log = debug('square')
var pando = require('pando-computing')

module.exports['/pando/1.0.0'] = function (x, cb) {
	  log('started processing ' + x)
	  
	  const getNames = async() => {
		        try {
				            const names = await fetch('https://raw.githubusercontent.com/giusdam/data/main/wordcount1-64.txt');
				            const textData = await names.text();
				            return textData;
				          } catch (err) {
						                  console.log('fetch error', err);
						                }
		    };

	  (async () => {

		      const getText = await getNames();

		      var startTime = new Date()

		         let mapped = new Map()

		  	getText.split(/\W+/).map(word => {
					if(word !== "")
						mapped.set(word, mapped.has(word) ? mapped.get(word) + 1 : 1)
				})
		  		
		  		let obj = {}
		 		mapped.forEach(function(value, key){
		 			obj[key] = value
		  		})
		      
		      
		      var endTime = new Date()

		          pando.report({
				              cpuTime: endTime - startTime,
				              nbItems: 1,
				              units: 'Numbers'
				         })
		        // cb(null, getText)
		  	cb(null, JSON.stringify(obj))
		    })()

}

