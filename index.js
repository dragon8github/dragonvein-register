// npm init -y && npm i request request-promise mkdirp iconv-lite
const request = require('request');
var mkdirp = require('mkdirp');
var iconv = require('iconv-lite');
var http = require('http')
var fs = require('fs');
var path = require('path');
var os = require('os');
var proxyList = require('./freeProxySpider.js').proxyList;
var guss = require('./guss.js');

// 账号
const user = 'dragon8yima';
// 密码
const pwd = '202063';
// 易码API token（可以通过登录接口获取，但实际上只要你不修改密码，这个token是永远有效的）
const token = '00637696d3e8935e40426aca722249c7a7c60048';
// 项目名
const itemid = '10438';
// 邀请码
const share = 'ec19c0ca'


// 获取结果
const getData = (str) => ~str.indexOf('|') ? str.split('|')[1] : str

// 记录起来
const save = (txt) => {
    mkdirp(path.join(__dirname,`/data/`), function (err) {
        if (err) console.error(err)
        fs.writeFile(path.join(__dirname,`/data/${token}.json`), txt + os.EOL, { flag: "a" }, function (err) {
            if(err) console.error("文件写入失败", err);
            else console.log("文件写入成功");
        })   
    })
}

// 第一步：获取手机号码
const getmobile = (proxy_ip) => {
    request({
        method: 'GET',
        uri: `http://api.fxhyd.cn/UserInterface.aspx?action=getmobile&token=${token}&itemid=${itemid}`,
    }, function (err, _res, body) {
        if (err) throw new Error(err)
        // 从易码的返回结果中拿到我要的数据
        var mobile = getData(body);

        // 【猴子补丁】
        // 2005错误说明：获取号码数量已达到上限，这是没有及时释放导致的【getsms】获取短信验证码的时候可以释放。
        // 这种情况也比较少，我手动重新获取一下即可。总能等待释放的时候的。
        if (mobile === 2005) {
            // 延迟重新请求
            setTimeout(function () {
                getmobile(proxy_ip);
            }, 1000);
        } else {
            sendsms(mobile, proxy_ip);
        }
    })
};

// 第二步：发送短信验证码
const sendsms = (mobile, proxy_ip) => {
    request({
        method: 'GET',
        uri: `http://guss.one/api/api/user/getCode?phone=${mobile}&_=${mobile}`,
        proxy: proxy_ip,
    }, function (err, _res, body) {
        if (err) throw new Error(err)
        if (~body.indexOf('发送成功')) {
            console.log("拿到到手机号码是", mobile);
            getsms(mobile, proxy_ip)
        } else {
            console.log("guss发送短信验证码失败", body);
        }
    })
};

// 第三步：获取短信验证码
const getsms = (mobile, proxy_ip) => {
    var count = 0
    var _getsms = function () {
        request({
            method: 'GET',
            uri: `http://api.fxhyd.cn/UserInterface.aspx?action=getsms&token=${token}&itemid=${itemid}&mobile=${mobile}&release=1`,
        }, function (err, _res, body) {
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
                throw new Error('获取短信超时' + mobile)
            } else {
                // 截取验证码
                var code = body.match(/\d{4,}/)[0]
                console.log("获取了验证码", code);
                register(proxy_ip, mobile, code)
            }
        })
    }
    _getsms();
};

// 第四步：注册
const register = (proxy_ip, mobile, code, pwd = '12345678', share = 'ec19c0ca') => {
    request({
        method: 'POST',
        uri: 'http://guss.one/api/api/user/register',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
        proxy: proxy_ip,
        timeout: 30000,
        body: JSON.stringify({
            'Phone': mobile,
            'Code': code,
            'Pwd': pwd,
            'Share': share
        })
    }, function (err, _res, body) {
        if (err) throw new Error(err.message + proxy_ip);
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
};


// getmobile('211.159.171.58:80');

// setProxyList()

proxyList(40, (proxy_ip_list) => {
    console.log('代理已准备就绪，正在开始任务...');
    var g = new guss(proxy_ip_list[0], token)
    g.getmobile()
   // for (var i = 0; i < proxy_ip_list.length; i++) {
   //     
   // }
})

