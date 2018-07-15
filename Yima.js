const request = require('request');

var YM_ERR;
(function (YM_ERR) {
    YM_ERR[YM_ERR["1001"] = 1001] = "参数token不能为空";
    YM_ERR[YM_ERR["1002"] = 1002] = "参数action不能为空";
    YM_ERR[YM_ERR["1003"] = 1003] = "参数action错误";
    YM_ERR[YM_ERR["1004"] = 1004] = "token失效";
    YM_ERR[YM_ERR["1005"] = 1005] = "用户名或密码错误";
    YM_ERR[YM_ERR["1006"] = 1006] = "用户名不能为空";
    YM_ERR[YM_ERR["1007"] = 1007] = "密码不能为空";
    YM_ERR[YM_ERR["1008"] = 1008] = "账户余额不足";
    YM_ERR[YM_ERR["1009"] = 1009] = "账户被禁用";
    YM_ERR[YM_ERR["1010"] = 1010] = "参数错误";
    YM_ERR[YM_ERR["1011"] = 1011] = "账户待审核";
    YM_ERR[YM_ERR["1012"] = 1012] = "登录数达到上限";
    YM_ERR[YM_ERR["2001"] = 2001] = "参数itemid不能为空";
    YM_ERR[YM_ERR["2002"] = 2002] = "项目不存在";
    YM_ERR[YM_ERR["2003"] = 2003] = "项目未启用";
    YM_ERR[YM_ERR["2004"] = 2004] = "暂时没有可用的号码";
    YM_ERR[YM_ERR["2005"] = 2005] = "获取号码数量已达到上限";
    YM_ERR[YM_ERR["2006"] = 2006] = "参数mobile不能为空";
    YM_ERR[YM_ERR["2007"] = 2007] = "号码已被释放";
    YM_ERR[YM_ERR["2008"] = 2008] = "号码已离线";
    YM_ERR[YM_ERR["2009"] = 2009] = "发送内容不能为空";
    YM_ERR[YM_ERR["2010"] = 2010] = "号码正在使用中";
    YM_ERR[YM_ERR["3001"] = 3001] = "尚未收到短信";
    YM_ERR[YM_ERR["3002"] = 3002] = "等待发送";
    YM_ERR[YM_ERR["3003"] = 3003] = "正在发送";
    YM_ERR[YM_ERR["3004"] = 3004] = "发送失败";
    YM_ERR[YM_ERR["3005"] = 3005] = "订单不存在";
    YM_ERR[YM_ERR["3006"] = 3006] = "专属通道不存在";
    YM_ERR[YM_ERR["3007"] = 3007] = "专属通道未启用";
    YM_ERR[YM_ERR["3008"] = 3008] = "专属通道密码与项目不匹配";
    YM_ERR[YM_ERR["9001"] = 9001] = "系统错误";
    YM_ERR[YM_ERR["9002"] = 9002] = "系统异常";
    YM_ERR[YM_ERR["9003"] = 9003] = "系统繁忙";
})(YM_ERR || (YM_ERR = {}));

// 获取易码的返回结果
const getData = (str) => ~str.indexOf('|') ? str.split('|')[1] : str

class Yima {
	constructor (token, itemid) {
		 this.token = token
		 this.itemid = itemid
	}

	// 获取手机号码
	getmobile (cb) {
		request({
		    method: 'GET',
		    uri: `http://api.fxhyd.cn/UserInterface.aspx?action=getmobile&token=${this.token}&itemid=${this.itemid}`,
		}, (err, response, body) => {
		    if (err) throw new Error(err)

		    // 从易码的返回结果中拿到我要的数据
		    var mobile = getData(body);

		    // 【猴子补丁】如果是4位，则说明返回的是错误码，因为手机号码都是11位的嘛
		    if (mobile.length === 4) {
		        // 延迟重新请求
		        setTimeout(function () {
		        	// 打印出错误信息，并且尝试重新获取...
		        	console.log(`获取手机号码失败(${mobile}：${YM_ERR[mobile]})，正在重新获取...`);
		            this.getmobile();
		        }, 1000);
		    } else {
		    	// 将从易码拿到的手机号码放入当前实例中
		    	this.mobile = mobile
		    	// 打印出号码高兴一下
		    	console.log('从易码中拿到手机号码', this.mobile);
		    	// 回调
		        cb && cb(mobile)
		    }
		})
	},

	// 获取短信验证码
	getsms (cb) {
		// 实例中必须有手机号码了才可以使用此功能
		if (!this.mobile) throw new Error('未找到手机号码');
		// 当前轮询的次数
		var count = 0
		// 递归获取短信函数
		var _getsms = () => {
		    request({
		        method: 'GET',
		        uri: `http://api.fxhyd.cn/UserInterface.aspx?action=getsms&token=${this.token}&itemid=${this.itemid}&mobile=${this.mobile}&release=1`,
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
		            throw new Error('获取短信超时：' + this.mobile)
		        } else {
		            // 截取验证码
		            var code = body.match(/\d{4,}/)[0]
		            // 获取成功！！！
		            console.log("获取了验证码", code, this.mobile);
		            // 回调
		            cb && cb(code)
		        }
		    })
		}
		// 开始
		_getsms();
	}
}

module.exports = Yima