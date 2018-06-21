// npm init -y && npm i request request-promise mkdirp
const request = require('request');
const ipProxyRequest = require('ip-proxy-request')
var http = require('http')
var mkdirp = require('mkdirp');
var fs = require('fs');
var path = require('path');
var os = require('os');

// user-agents
const userAgents = [
  'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.8.0.12) Gecko/20070731 Ubuntu/dapper-security Firefox/1.5.0.12',
  'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0; Acoo Browser; SLCC1; .NET CLR 2.0.50727; Media Center PC 5.0; .NET CLR 3.0.04506)',
  'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/535.11 (KHTML, like Gecko) Chrome/17.0.963.56 Safari/535.11',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_3) AppleWebKit/535.20 (KHTML, like Gecko) Chrome/19.0.1036.7 Safari/535.20',
  'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.0.8) Gecko Fedora/1.9.0.8-1.fc10 Kazehakase/0.5.6',
  'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.1 (KHTML, like Gecko) Chrome/21.0.1180.71 Safari/537.1 LBBROWSER',
  'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Win64; x64; Trident/5.0; .NET CLR 3.5.30729; .NET CLR 3.0.30729; .NET CLR 2.0.50727; Media Center PC 6.0) ,Lynx/2.8.5rel.1 libwww-FM/2.14 SSL-MM/1.4.1 GNUTLS/1.2.9',
  'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 1.1.4322; .NET CLR 2.0.50727)',
  'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C; .NET4.0E; QQBrowser/7.0.3698.400)',
  'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; QQDownload 732; .NET4.0C; .NET4.0E)',
  'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:2.0b13pre) Gecko/20110307 Firefox/4.0b13pre',
  'Opera/9.80 (Macintosh; Intel Mac OS X 10.6.8; U; fr) Presto/2.9.168 Version/11.52',
  'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.8.0.12) Gecko/20070731 Ubuntu/dapper-security Firefox/1.5.0.12',
  'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C; .NET4.0E; LBBROWSER)',
  'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.0.8) Gecko Fedora/1.9.0.8-1.fc10 Kazehakase/0.5.6',
  'Mozilla/5.0 (X11; U; Linux; en-US) AppleWebKit/527+ (KHTML, like Gecko, Safari/419.3) Arora/0.6',
  'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C; .NET4.0E; QQBrowser/7.0.3698.400)',
  'Opera/9.25 (Windows NT 5.1; U; en), Lynx/2.8.5rel.1 libwww-FM/2.14 SSL-MM/1.4.1 GNUTLS/1.2.9',
  'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36'
]

// 账号
const user = 'dragon8yima';

// 密码
const pwd = '202063';

// token
const token = '00637696d3e8935e40426aca722249c7a7c60048';

// 项目名
const itemid = '10438';

// 获取ip列表
const getiplist = (cb) => {
    fs.readFile(path.join(__dirname,'/proxys.json'), {encoding:'utf-8'} , function (err, data) {
        if(err) throw err;
        cb && cb(JSON.parse(data)[0])
    });
}


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
const getmobile = () => {
    request({
        method: 'GET',
        uri: `http://api.fxhyd.cn/UserInterface.aspx?action=getmobile&token=${token}&itemid=${itemid}`
    }, function (err, _res, body) {
        if (err) throw new Error(err)
        var mobile = getData(body);
        sendsms(mobile);
    })
};

// 第二步：发送短信验证码
const sendsms = (mobile) => {
    request({
        method: 'GET',
        uri: `http://guss.one/api/api/user/getCode?phone=${mobile}&_=${mobile}`
    }, function (err, _res, body) {
        if (err) throw new Error(err)
        if (~body.indexOf('发送成功')) {
            console.log("拿到到手机号码是", mobile);
            getsms(mobile)
        } else {
            console.log("失败了，", body);
        }
    })
};

// 第三步：获取短信验证码
const getsms = (mobile) => {
    var count = 0
    var _getsms = function () {
        request({
            method: 'GET',
            uri: `http://api.fxhyd.cn/UserInterface.aspx?action=getsms&token=${token}&itemid=${itemid}&mobile=${mobile}&release=1`
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
            } else {
                // 截取验证码
                var code = body.match(/\d{4,}/)[0]
                console.log("获取了验证码", code);
                register(mobile, code)
            }
        })
    }
    _getsms();
};

// 第四步：注册
const register = (mobile, code, pwd = '12345678', share = 'ec19c0ca') => {


    // request({
    //     method: 'GET',
    //     url: 'http://ip.chinaz.com/getip.aspx',
    //     timeout: 8000,
    //     encoding: null,
    //     proxy: 'http://91.205.239.120:8080'
    // }, function (err, _res, body) {
    //     if (err) throw new Error(err)
    //     body = body.toString();
    //     console.log(body);
    // })

    // request({
    //     method: 'POST',
    //     uri: 'http://192.168.0.102',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'X-Requested-With': 'XMLHttpRequest',
    //         'User-Agent': userAgents
    //     },
    //     proxy: 'http://91.205.239.120:8080',
    //     timeout: 30000,
    //     followRedirect: true,
    //     followAllRedirects: true,
    //     body: JSON.stringify({
    //         'Phone': mobile,
    //         'Code': code,
    //         'Pwd': pwd,
    //         'Share': share
    //     })
    // }, function (err, _res, body) {
    //     if (err) throw new Error(err)
    //     console.log(body);
    // })
   
    // getiplist(ip => {
        
        request({
            method: 'POST',
            uri: 'http://guss.one/api/api/user/register',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            proxy: 'http://91.205.239.120:8080',
            timeout: 30000,
            body: JSON.stringify({
                'Phone': mobile,
                'Code': code,
                'Pwd': pwd,
                'Share': share
            })
        }, function (err, _res, body) {
            if (err) throw new Error(err)
            if (~body.indexOf('注册异常') || ~body.indexOf('无效用户')) {
                console.log("注册失败", body);
            } else {
                console.log("注册成功", body);
                save(`${mobile} ———— ${pwd}`);
            }
        })
    // })
};

// for (var i = 0; i < 10; i++) {
//     getmobile();
// }


 getmobile();


