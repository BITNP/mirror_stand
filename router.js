// 调试模式开关
var ifDebug = false;

var fs = require('fs');
var render = require('./templateRender');
// 路由文件缓存，缓冲经常修改的动态资源，如，图片
var buffer = {};

// 设置文件缓存过期时间
setInterval(clearBuffer,10*60*1000);

function clearBuffer(){
	buffer = {};
}


function route(handle, pathname) {
	if (ifDebug) console.log("About to route a request for " + pathname);
	if(typeof handle[pathname] === 'function') {
		return handle[pathname]();
	}else{
		try{
			if (ifDebug) console.log(pathname);
			if (buffer[pathname]) {
				return buffer[pathname];
			} else if((pathname.indexOf('/mirrors/') == 0 || pathname == '/mirrors') && pathname.indexOf('.') == -1) { // 访问 /mirrors 文件夹下的静态资源
				return buffer.mirrors || (buffer.mirrors = render.render(fs.readFileSync('./listMirrors.html')));
			}  else {
				buffer[pathname] = fs.readFileSync('.'+pathname);
				return buffer[pathname];
			}
		}
		catch(err) {
			if (pathname.indexOf('.jpg') != -1 || pathname.indexOf('.png') != -1)
				return buffer.defaultImg || (buffer.defaultImg = fs.readFileSync('./img/default.png'));
			if (ifDebug) console.log("No request hadler found for " + pathname);
			return buffer.notFound || (buffer.notFound = fs.readFileSync('./404.html'));
		}
	}
}



// else if((pathname.indexOf('/img/') == 0 || pathname == '/img') && pathname.indexOf('.') != -1) { // 访问 /img 文件夹下的图片资源
// 					console.log(pathname);
// 					fs.readFileSync('.' + pathname, (err, data) => {
// 						if(err) {
// 							return fs.readFileSync('./450x300.png');
// 						}
// 						return data;
// 					});
// 			}




exports.route = route;