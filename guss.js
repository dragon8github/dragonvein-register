// npm init -y && npm i request request-promise mkdirp iconv-lite
const request = require('request');
var mkdirp = require('mkdirp');
var iconv = require('iconv-lite');
var http = require('http')
var fs = require('fs');
var path = require('path');
var os = require('os');
var proxyList = require('./freeProxySpider.js').proxyList;

// 获取易码的返回结果
const getData = (str) => ~str.indexOf('|') ? str.split('|')[1] : str

// 将注册成功的账号保存起来
const save = (txt) => {
    mkdirp(path.join(__dirname,`/data/`), function (err) {
        if (err) console.error(err)
        fs.writeFile(path.join(__dirname,`/data/${token}.json`), txt + os.EOL, { flag: "a" }, function (err) {
            if(err) console.error("文件写入失败", err);
            else console.log("文件写入成功");
        })   
    })
}

class guss {
	constructor (ip, token, itemid = '10438', share = "ec19c0ca") {
		  this.ip = "http://" + ip
		  this.share = share
		  this.token = token
		  this.itemid = itemid
	}

	// 第一步：获取手机号码
	getmobile () {
		request({
		    method: 'GET',
		    uri: `http://api.fxhyd.cn/UserInterface.aspx?action=getmobile&token=${this.token}&itemid=${this.itemid}`,
		}, (err, response, body) => {
		    if (err) throw new Error(err)

		    // 从易码的返回结果中拿到我要的数据
		    var mobile = getData(body);

		    // 【猴子补丁】
		    // 2005错误说明：获取号码数量已达到上限，这是没有及时释放导致的【getsms】获取短信验证码的时候可以释放。
		    // 这种情况也比较少，我手动重新获取一下即可。总能等待释放的时候的。
		    if (mobile === 2005) {
		        // 延迟重新请求
		        setTimeout(function () {
		        	console.log('获取手机号码失败(2005)，正在重新获取...');
		            this.getmobile();
		        }, 1000);
		    } else {
		        this.sendsms(mobile);
		    }
		})
	}

	sendsms (mobile) {
		var count = 0
		var _sendsms = function () {
			request({
			    method: 'GET',
			    uri: `http://guss.one/api/api/user/getCode?phone=${mobile}&_=${mobile}`,
			    proxy: this.ip,
			}, (err, response, body) => {
			    if (err) throw new Error(err)

			    if (~body.indexOf('发送成功')) {
			        console.log("发送短信成功：", mobile);
			        this.getsms(mobile)
			    } else {
			    	// 最多重新三次
			    	if (++count > 3) {
				        console.log(`发送短信验证码失败，正在重新获取...${count}`, body);
				    	_sendsms();
			        } else {
			        	throw new Error(`发送短信验证码尝试${count}次后失败...`)
			        }
			    }
			})
		}
		_sendsms()
	}

	getsms (mobile) {
		var count = 0
		var _getsms = function () {
		    request({
		        method: 'GET',
		        uri: `http://api.fxhyd.cn/UserInterface.aspx?action=getsms&token=${this.token}&itemid=${this.itemid}&mobile=${mobile}&release=1`,
		    }, (err, response, body) => {
		        if (err) throw new Error(err)

		        // 如果短信未收到
		        if (body == '3001' && count <= 60) {
		            // 官方推荐5秒之后再请求
		            setTimeout(function () {
		                count += 5
		                console.log("短信未收到，正在重新获取...", count);
		                _getsms()
		            }, 5000);
		        } else if (count >= 60) {
		            throw new Error('获取短信超时：' + mobile)
		        } else {
		            // 截取验证码
		            var code = body.match(/\d{4,}/)[0]
		            console.log("获取了验证码", code);
		            register(mobile, code)
		        }
		    })
		}
		_getsms();
	}

	register (mobile, code) {
		request({
		    method: 'POST',
		    uri: 'http://guss.one/api/api/user/register',
		    headers: {
		        'Content-Type': 'application/json',
		        'X-Requested-With': 'XMLHttpRequest',
		    },
		    proxy: this.ip,
		    timeout: 30000,
		    body: JSON.stringify({
		        'Phone': mobile,
		        'Code': code,
		        'Pwd': '12345678',
		        'Share': this.share
		    })
		}, (err, response, body) => {
		    if (err) throw new Error(err.message + proxy_ip);

		    // 各种tm操蛋的异常错误
		    if (~body.indexOf('注册异常') || 
		        ~body.indexOf('无效用户') || 
		        ~body.indexOf('Too Many Requests') || 
		        ~body.indexOf('502 Bad Gateway')) {
		            console.log("注册失败", body);
		    } else {
	            console.log("注册成功", body);
	            save(`${mobile} ———— ${pwd}`);
		    }
		})
	}
}


module.exports = guss