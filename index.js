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

// getmobile('211.159.171.58:80');
// setProxyList()
proxyList(40, (proxy_ip_list) => {
    console.log('代理已准备就绪，正在开始任务...');
    var g = new guss(proxy_ip_list[0], token)
    g.getmobile()
   // for (var i = 0; i < proxy_ip_list.length; i++) {
   //     // do somthing...
   // }
})

