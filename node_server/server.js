// 调试模式开关
var mode = 'release';


// var express = require('express');
// var app = express();
// var fs = require("fs");

// var appjson = JSON.parse(fs.readFileSync('./app.json'));
// mode = appjson.mode;

// var ejs = require("ejs");

// var bodyParser = require('body-parser');
// var multer = require('multer');
// var cookieParser = require('cookie-parser');
// var util = require('util');

// /* express设置部分开始 */

// //设置渲染引擎
// app.set("viewengine",'ejs');
// //设置模板目录为当前index.js目录同级views目录下的模板
// app.set("views",__dirname);

// /* 创建中间件 */
// app.use(express.static('Assets'));
// /* 创建 application/x-www-form-urlencoded 编码解析 */
// app.use(bodyParser.urlencoded({ extended: false}));
// // 处理ajax post传来的json数据
// app.use(bodyParser.json());
// app.use(cookieParser());
// app.use(multer({dest: '/tmp/'}).array('image'));

// /* express设置部分结束 */


// /* app.get部分开始 */
// app.get('/', function (req, res) {
//   res.render('public\\'+mode+'\\index.ejs');
// });



// /* app.get部分结束 */







var fs = require('fs');
var appjson = JSON.parse(fs.readFileSync('./app.json'));
mode = appjson.mode;

var http = require('http');
var url = require('url');
var qs = require('querystring');
var render = require('./render');
var NotFound = null;
var ft = require('./fileTraversal');
var PORT = null;


if(appjson.port) {
  PORT = appjson.port;
} else {
  console.log('端口配置缺失，端口号设为默认值3000');
  PORT = 3000;
}


var baseUrl = "datas/";
var fileName= baseUrl + "mirrors.json";
var mirData=JSON.parse(fs.readFileSync(fileName));



function start(route) {


  function onRequest (req, res) {
    var pathname = url.parse(req.url).pathname;
    var query = url.parse(req.url).query;
    if (mode == 'debug') console.log("Request for " + pathname + " received.");

    // 镜像资源下载服务器 (download server)
    // var isfile = fs.statSync('./mirror'+pathname);
    // if(isfile.isFile()) {
    //   var stream = fs.createReadStream('./mirror' + pathname, {flags : "r", encoding : null});
    //   stream.on("error", function() {
    //     res.writeHead(404);
    //     res.end();
    //   });
    //   stream.pipe(res);
    //   return stream;
    // }
    // 镜像资源下载服务器 (download server)


    // 反向缓存权限设置
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With");
    res.setHeader("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    // 反向缓存权限设置
    var content = route(pathname);
    if(content == -1) {
      res.writeHead(404);
      content = NotFound || (NotFound = render.render(fs.readFileSync('./public/' + mode + '/404.html')));
    } else {
      res.writeHead(200);
    }
    res.write(content);

    res.end();
  }
  
  var app = http.createServer(onRequest);
  var io = require('socket.io')(app);
  app.listen(PORT);
  console.log("--------------------------------");
  console.log("Server has started.");
  console.log("--------------------------------");

  // socket.io listeners
  io.on('connection', function (socket) {
    // 记录日志
    if (mode == 'debug'){
      console.log("--------------------------------");
      console.log('New connection.');
      console.log("--------------------------------");
    } 


    socket.on('data', function(data){
      switch(data.type){
        case "mirrorDir": // 获取镜像列表，基于文件目录
        {
          var datas = [];
          if(data.path == undefined)
            datas = ft.fileTraversal('./mirror');
          else if (data.path == '/mirror') {
            datas = ft.fileTraversal('./mirror');
          } else {
            datas = ft.fileTraversal('./mirror' + data.path);
          }
          socket.emit('data',{"type":"mirrorDir", "datas":datas});
          if (mode == 'debug'){
            console.log("--------------------------------");
            console.log('mirrorDir data sent.');
            console.log("--------------------------------");
          } 
        }
        break;

        case "mdlist": // 获取帮助文件列表，基于文件目录
        {
          var datas = [];
          datas = ft.fileTraversal('./_help');
          socket.emit('data',{"type":"mdlist", "datas":datas});
          if (mode == 'debug'){
            console.log("--------------------------------");
            console.log('mdlist data sent.');
            console.log("--------------------------------");
          } 
        }
        break;
      }
    });
  });
}

exports.start = start;
