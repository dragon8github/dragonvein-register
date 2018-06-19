// npm init -y && npm i request request-promise mkdirp
const request = require('request');
var mkdirp = require('mkdirp');
var fs = require('fs');
var path = require('path');
var os = require('os');

// 账号
const user = 'dragon8yima';

// 密码
const pwd = '202063';

// token
const token = '00637696d3e8935e40426aca722249c7a7c60048';

// 项目名
const itemid = '10438';

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
    request({
        method: 'POST',
        uri: 'http://guss.one/api/api/user/register',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
            'Phone': mobile,
            'Code': code,
            'Pwd': pwd,
            'Share': share
        })
    }, function (err, _res, body) {
        if (err) throw new Error(err)
        console.log("注册成功", body);
        save(`${mobile} ———— ${pwd}`);
    })
};

getmobile();


