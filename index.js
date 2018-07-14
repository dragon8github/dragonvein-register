const request = require('request');
const cheerio = require('cheerio');
const Dragonvein = require('./Dragonvein');

// 账号
const user = 'dragon8yima';
// 密码
const pwd = '123456';
// 易码API token（可以通过登录接口获取，但实际上只要你不修改密码，这个token是永远有效的）
const token = '00637696d3e8935e40426aca722249c7a7c60048';
// 项目名
const itemid = '20969';

request('http://candy.dragonvein.io/frontend/web/site/signup', function (err, response, body) {
    if (err) throw new Error(err.message);
    // nodejs 版 jQuery
    let $ = cheerio.load(response.body)
    // 从meta[name=csrf-token]中拿到_csrf
    const _csrf = $('meta[name=csrf-token]').attr('content')
    // 实例化对象
    const dragonvein = new Dragonvein(token, itemid, _csrf)
    // 开始
    dragonvein.getmobile()
});