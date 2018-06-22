const request = require('request');
var iconv = require('iconv-lite');
var ProgressBar = require('./progress-bar');

// 代理ip队列
let proxy_ip_list = []

/**
 * 单例模式
 * 高阶函数，传入一个函数，返回一个函数，该函数只能被执行一次。
 */
const once = fn => {
    let done = false;

    return function () {
        return done ? undefined : ((done = true), fn.apply(this, arguments))
    }
}

/**
 * 获取免费的代理ip列表
 * 每次最多获取300个，而且每次刷新页面都会改变，似乎意味着永远不会重复？有点意思。。。
 * http://www.66ip.cn/nm.html
 */
const getProxyList = () => {
    var apiURL = 'http://www.66ip.cn/nmtq.php?getnum=300&isp=0&anonymoustype=0&start=&ports=&export=&ipaddress=&area=1&proxytype=0&api=66ip';
    return new Promise((resolve, reject) => {
        var options = {
            method: 'GET',
            url: apiURL,
            gzip: true,
            encoding: null,
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Encoding': 'gzip, deflate',
                'Accept-Language': 'zh-CN,zh;q=0.8,en;q=0.6,zh-TW;q=0.4',
                'User-Agent': 'Mozilla/8.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36',
                'referer': 'http://www.66ip.cn/'
            },
        };
        request(options, function (error, response, body) {
            try {
                if (error) throw error;
                if (/meta.*(charset=gb2312|charset=GBK)/.test(body)) {
                    body = iconv.decode(body, 'gbk');
                }
                var ret = body.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,4}/g);
                resolve(ret);
            } catch (e) {
                return reject(e);
            }
        });
    })
}

/**
 * 设置代理ip列表
 * 拿到手的ip不一定能够直接使用，有一些是无法访问、废弃注销、甚至错误异常的。所以需要过滤一番
 * 过滤的方法就是去访问一下【http://ip.chinaz.com/getip.aspx】，事实上访问哪里都可以，只要正常反馈即可。
 */
const setProxyList = (limit, cb) => {
    // 单例模式
    cb = once(cb)

    /**
     * 实例化进度条
     * @param {string} 命令行开头的文字信息
     * @param {int} 进度条的长度(单位：字符)，默认设为 25
     */
    var pb = new ProgressBar('下载进度', 50);

    // 从【http://www.66ip.cn/nm.html】中获取免费的ip代理列表
    getProxyList().then(ipList => {
        // 如果ipList为null，说明免费代理服务挂了
        if (ipList == null) throw new Error("ip列表为空，请稍后再试")
        console.log('正在准备ip代理，请稍后...');
        // 获取代理ip列表的长度
        var listCount = ipList.length;
        // 已过滤到代理数量
        var filterCount = 0;
        // 遍历拿到手的代理，带还需要过滤一下，有一些代理是无法访问使用的。
        ipList.forEach(proxyurl => {
            // 过滤的方法就是去访问一下【http://ip.chinaz.com/getip.aspx】，事实上访问哪里都可以，只要正常反馈即可。
            request({
                method: 'GET',
                url: 'http://ip.chinaz.com/getip.aspx',
                timeout: 30000,
                encoding: null,
                proxy: 'http://' + proxyurl
            }, function (err, response, body) {               
                // 登记
                filterCount++
                if (err) {
                    // console.error("fail", err.message) 
                } else {
                    try {
                        // 用toString()可以将buffer转化为中文字符串
                        body = body.toString();
                        // 序列化
                        body = eval('(' + body + ')')
                        // 塞入队列（无重复）
                        !proxy_ip_list.includes(proxyurl) && proxy_ip_list.push(proxyurl)
                        // 打印出成功信息
                        // console.log(`success `, body.address, proxyurl);
                        // 更新进度条
                        if (proxy_ip_list.length <= limit) {
                            pb.render({ completed: proxy_ip_list.length, total: limit });
                        }
                    } catch (err) {
                        // 如果序列化失败，说明有其他错误，譬如502、页面异常之类的。
                        // console.log('fail page server');
                    }
                }

                // 如果已经满足条件，直接开车(车只开一次)，
                if (proxy_ip_list.length === limit) 
                    cb(proxy_ip_list)
                

                // 如果队列已经完毕，但是还未满足条件，那么再来一次
                if (filterCount === listCount && proxy_ip_list.length < limit) 
                    setProxyList(limit, cb)
            })
        });
    }).catch(e => {
        console.log(e);
    })
}


module.exports = {
    proxyList: setProxyList
}