
jQuery(function ($) {
	'use strict';
//------------------------------------------------------------------------------------
	var telReg = /^[1][3,4,5,7,8][0-9]{9}$/,    //手机 验证
	    pwdReg = /^[a-zA-Z]\w{5,17}$/,		   //密码 验证		
//------------------------------------------------------------------------------------
		telChecked = false,
		pwdChecked = false,
		appId = '483738788631',
		appKey = 'ueJfWmqQaYLNuw6xeA6PWRmr';
	// 数据获取和提交
	var requireData = {
		

		// 注册
		addUser: function (data) {
			$.ajax({
				url: 'https://baas.qingful.com/2.0/class/public/table/user/add',
				type: 'POST',
				dataType: 'json',
				data: JSON.stringify(data),
				headers: {
					'Content-Type': 'application/json',
					'x-qingful-appid': appId,
					'x-qingful-appkey': appKey
				},
				success: function (data) {
					// 跳转登录
					window.location.href = '../register-login/login.html'
				},
				error: function (err) {
					console.log(err)
				}
			})	
		},
	//登录 
		login: function (data) {
			var phone = data.phone,
				password = data.password;
			$.ajax({
				url: 'https://baas.qingful.com/2.0/class/public/table/user/fetch?where=phone,'+ phone + '&where=password,'+ password,
				type: 'get',
				dataType: 'json',
				data: {},
				headers: {
					'Content-Type': 'application/json',
					'x-qingful-appid': appId,
					'x-qingful-appkey': appKey
				}, 
				success: function (data) {

					localStorage.setItem('Authorization', data.data)
					// 跳转登录
					window.location.href = '../index.html'
				},
				error: function (err) {
					$('.prompt').css('display', 'block')
				}
			})	
		}
	}

	var App = {
		// 初始化数据
		init: function () {
			this.telChecked = false;
			this.pwdChecked = false;
			this.isStrorage();
			this.bindEvents();
		},
		// 事件
		bindEvents: function () {
			$('#register-submit').on('click', this.register.bind(this));
			$('#login-submit').on('click', this.login.bind(this));
			$('input').on('blur', this.testReg.bind(this))
					  .on('focus', this.waringHide.bind(this));
			$('#pwdRepeate, #pwd').bind('input propertychange', this.pwdEqual)

		},
		// 注册
		register: function () {
			this.pwdEqual();
			var phone = this.phone,
				password = this.password;
			var data = {
				phone: phone,
				password: password,
			};

			if (this.telChecked && this.pwdChecked) {

				requireData.addUser(data)

			} else if ((phone == '') || (password == '')) {
				$('span').html('请填写完整')
				this.flashingWarning()
			} else {
				this.flashingWarning()
			}
		},

		// 登录
		login: function () {
			var phone = this.phone,
				password = $('#pwd').val();
			var data = {
				phone: phone,
				password: password,
			};
			if (this.telChecked && this.pwdChecked) {


				requireData.login(data);    

			} else if ((phone == '') || (password == '')) {
				$('span').html('请填写完整')
				this.flashingWarning()
			} else {
				this.flashingWarning()
			}
			
		},
		// 从浏览器中取出用户数据 若存在则跳转到主页
		isStrorage: function () {

			var Authorization = localStorage.getItem('Authorization');

			if (Authorization) {

				localStorage.removeItem('Authorization')
			};
		},
		// 密码和手机号正则验证
		testReg: function(e) {
			var $input = $(e.target),
				$span = $input.next('span'),
				name = $input.attr('name'),
				value = $input.val();

			if (value == '') {
				$span.html('请填写完整');
			} else {

				if (name == 'tel'){
					var is_tel = telReg.test(value);

					if (is_tel) {
						$span.html('');
						this.telChecked = true;
						this.phone = value;
					} else {
						$span.html('手机号格式错误');
						this.telChecked = false;
					}

				} else if (name == 'pwd') {

					var is_pwd = pwdReg.test(value);
					if (is_pwd) {

						$span.html('');
						this.pwdChecked = true;
					} else {

						$span.html('密码格式错误');
						this.pwdChecked = false;
					}
				} else if (name == 'pwdRepeate') {
					var is_pwd = pwdReg.test(value);
					if (is_pwd) {

						$span.html('');
						this.pwdChecked = true;
					} else {

						$span.html('密码格式错误');
						this.pwdChecked = false;
					}
				}
			}
		},
       //  验证两次密码是否相等
		pwdEqual: function (e) {
			var pwd = $('#pwd').val(),
				pwdRepeate = $('#pwdRepeate').val();

			if (pwdRepeate !== pwd) {
				$('.pwdEqual').html('两次密码不一致');
				this.pwdChecked = false;
			} else {
				$('.pwdEqual').html('');
				this.pwdChecked = true;
				this.password = pwd;
			}
		},
		// 警告隐藏
		waringHide: function (e) {

			$(e.target).next('span').html('');
			$('.prompt').css('display', 'none');
		},
		// 闪烁警告
		flashingWarning: function () {

			var i = 0,
				timer;

			clearInterval(timer);
			timer = setInterval (function () {
				var toggle = i++%2 ? '0' : '1';
				$('span').css('opacity', toggle);
				i>4 && clearInterval(timer);
			},80)

		}

	}

	App.init()
	
});