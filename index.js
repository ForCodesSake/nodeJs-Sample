const http = require('http');
const fs = require('fs');
var formidable = require('formidable');
const pool = require('./pgdb');
var csv =require('fast-csv');

const hostname = '127.0.0.1';
const port = 3000;

pool.connect(function(err){
    if(err)
    {
        console.log(err);
    }
});

fs.readFile('sample.html', (err, html) => {
	if (err){
	  throw err;
	}
  
	const server = http.createServer((req, res) => {

		if (req.url == '/fileupload') {
    
			var form = new formidable.IncomingForm();
			form.parse(req, function (err, fields, files) {
				var oldpath = files.filetoupload.path;
				var filename=fields.FileName;
				var dataArr = [];
				
				let csvStream = csv.fromPath(oldpath, { headers: true })
					.on("data", data => {
						dataArr.push(data);
					}).on("end", function(){
						for(var i=0; i<dataArr.length; i++) {
														
							pool.query("INSERT INTO \"CSV_Data\" (\"csvSerial\", \"Capital\", \"Small\", \"Special1\", \"Special2\", \"SmallStr\", \"CapStr\", \"Message\", \"FileName\") \
										VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)", [dataArr[i].csvSerial, dataArr[i].Capital, dataArr[i].Small, dataArr[i].Special1, dataArr[i].Special2, dataArr[i].SmallStr, dataArr[i].CapStr, dataArr[i].Message,filename], function(err){
							if(err)
							{
								console.log(err);
							}
						});
							
						}
						
						console.log("\nJob is done!");
					}).on("error", function(err){
						console.log(err);
					});
				
				res.end("Success!!!");
			});
		
		} else if (req.url == '/filedownload') {
    
			var form = new formidable.IncomingForm();
			form.parse(req, function (err, fields, files) {
				var filename=fields.downfile;

				pool.query("Select * From \"CSV_Data\" Where \"FileName\" = '"+filename+"'",function(pderr,pdres){
					if(pderr){
						return console.error(pderr);
					}
					var z=pdres.rowCount;					
					
					res.write("csvSerial Small Capital SmallStr CapStr Special1 Special2 Message\n\n");
					
					for(var i=0;i<z;i++){
						res.write(pdres.rows[i].csvSerial+" "+pdres.rows[i].Small+" "+pdres.rows[i].Capital+" "+pdres.rows[i].SmallStr+" "+pdres.rows[i].CapStr+" "+pdres.rows[i].Special1+" "+pdres.rows[i].Special2+" "+pdres.rows[i].Message+"\n");
					}
					
					res.end("\n\nSuccess!!!");
				});
				
			});
		
		} else {
			pool.query(' Select Distinct \"FileName\" from \"CSV_Data\" ',function(pgerr,pgres){
				if(pgerr){
					return console.error(pgerr);
				}
				
				res.statusCode = 200;
				res.setHeader('Content-type', 'text/html');
				res.write(html);
				res.write("Already Uploaded Files :<br>");
				for(var i=0;i<pgres.rows.length;i++){
					res.write((i+1)+" "+pgres.rows[i].FileName+"<br>");
				}
				res.end();

			});
		}
	});

	server.listen(port, hostname, () => {
		console.log('Server started on port '+port);
	});
  
});

