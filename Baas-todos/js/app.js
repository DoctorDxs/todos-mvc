/*global jQuery, Handlebars, Router */
jQuery(function ($) {
	
	'use strict';

	Handlebars.registerHelper('eq', function (a, b, options) {
		return a === b ? options.fn(this) : options.inverse(this);
	});



	var appId = '483738788631',
		appKey = 'ueJfWmqQaYLNuw6xeA6PWRmr',
		ESCAPE_KEY = 27,
	 	ENTER_KEY = 13;


	var App = {
		// 初始化
		init: function () {
			// 登陆验证
			this.Authorization();
			// 获取数据
			this.todoTemplate = Handlebars.compile($('#todo-template').html());
			this.footerTemplate = Handlebars.compile($('#footer-template').html());
			this.bindEvents();
			// 客户端路由
			new Router({
				'/:filter': function (filter) {
					this.filter = filter;
					this.render();
				}.bind(this)
			}).init('/all');
		},
		// 获取数据
		getTodos: function () {

			var that = this;
			

			$.ajax({
				url: 'https://baas.qingful.com/2.0/class/home/table/todos/fetchAll?where=status,0,1',
				type: 'GET',
				dataType: 'json',
				data: {},
				async:false,
				headers: {
					'Content-Type': 'application/json',
					'x-qingful-appid': appId,
					'x-qingful-appkey': appKey,
					'Authorization': that.Authorization
				},
				success: function (msg) {
					that.todos = msg.data;
				},
				error: function (err) {
					console.log('数据请求错误，请检查网络')
				}
			});
		},
		// 数据添加 修改
		editTodos: function (data) {
			var that = this;
			
			
			$.ajax({
				url: 'https://baas.qingful.com/2.0/class/home/table/todos/add',
				type: 'POST',
				dataType: 'json',
				data: JSON.stringify(data),
				async:false,
				headers: {
					'Content-Type': 'application/json',
					'x-qingful-appid': appId,
					'x-qingful-appkey': appKey,
					'Authorization': that.Authorization
				},
				success: function (msg) {
					
				},
				error: function (err) {
					console.log('数据请求错误，请检查网络')
				}
			});
			
			
		},
		// 删除
		del: function (id) {
			var that = this;
			$.ajax({
				url: 'https://baas.qingful.com/2.0/class/home/table/todos/delete?where=id,' + id,
				type: 'GET',
				dataType: 'json',
				data: {},
				async:false,
				headers: {
					'Content-Type': 'application/json',
					'x-qingful-appid': appId,
					'x-qingful-appkey': appKey,
					'Authorization': that.Authorization
				},
				success: function (msg) {
					that.todos = msg.data;
				},
				error: function (err) {
					console.log('数据请求错误，请检查网络')
				}
			});
		},
		// 事件
		bindEvents: function () {
			$('#new-todo').on('keyup', this.create.bind(this));
			$('#toggle-all').on('change', this.toggleAll.bind(this));
			$('#footer').on('click', '#clear-completed', this.destroyCompleted.bind(this));
			$('#todo-list')
				.on('change', '.toggle', this.toggle.bind(this))
				.on('dblclick', 'label', this.editingMode.bind(this))
				.on('keyup', '.edit', this.editKeyup.bind(this))
				.on('focusout', '.edit', this.update.bind(this))
				.on('click', '.destroy', this.destroy.bind(this));
			$('#user-info').on('click', '.sign-out',this.signOut.bind(this));
		},
		// 处理数据
		render: function () {
			var todos = this.getFilteredTodos();
			$('#todo-list').html(this.todoTemplate(todos));
			$('#main').toggle(todos.length > 0);
			$('#toggle-all').prop('checked', this.getActiveTodos().length === 0);
			this.renderFooter();
			$('#new-todo').focus();			
		},
		// 当事项存在,底部选项显示，事项为零,底部隐藏
		renderFooter: function () {
			var todoCount = this.todos.length;
			var activeTodoCount = this.getActiveTodos().length;
			var template = this.footerTemplate({
				activeTodoCount: activeTodoCount,
				completedTodos: todoCount - activeTodoCount,
				filter: this.filter
			});

			$('#footer').toggle(todoCount > 0).html(template);
		},
		// 标记全部事项为已完成，或未完成
		toggleAll: function (e) {
			var that = this;
			var isChecked = $(e.target).prop('checked');
			var status;

			if (isChecked) {
				status = 1;
			} else {
				status = 0
			}
			this.todos.forEach(function (todo) {
				todo.status = status;
				var data = {
					id: todo.id,
					status: status
				}
				that.editTodos(data)
			});

			this.render();
		},
		// 获取 正在进行中的事项
		getActiveTodos: function () {
			return this.todos.filter(function (todo) {
				return !todo.status;
			});
		},
		// 获取已完成事项
		getCompletedTodos: function () {
			return this.todos.filter(function (todo) {
				return todo.status;
			});
		},
		// 过滤
		getFilteredTodos: function () {
			// 进行中事项
			if (this.filter === 'active') {
				return this.getActiveTodos();
			}
			// 已完成事项
			if (this.filter === 'completed') {
				return this.getCompletedTodos();
			}
			// 全部事项
			return this.todos;
		},
		// 清除已完成
		destroyCompleted: function () {
			var that = this;
			this.comleted = this.getCompletedTodos();
			this.filter = 'all';
			this.comleted.forEach(function (todo) {
	
				that.del(todo.id)
			});
			this.getTodos();

			this.render();
		},
		// 接受 `.item`  的div元素
		// 返回  'todos' 数组中相应索引
		getIndexFromEl: function (el) {
			var id = $(el).closest('li').data('id');
			var todos = this.todos;
			var i = todos.length;
			while (i--) {
				if (todos[i].id === id) {
					return i;
				}
			}
		},
		// 添加新的待办事项
		create: function (e) {
			var that = this;
			var $input = $(e.target);
			var val = $input.val().trim();
			var data = { 
				content: val,
				status: 0
			}
			// 判断是否按下 enter健 且 input 值是否为空
			if (e.which !== ENTER_KEY || !val) {
				return;
			}
			// 不为空  则将新添加的待办事项 push 到 'todos' 数组里 
			this.editTodos(data)

			// 重置 input
			$input.val('');
			this.getTodos();

			this.render();
		},
		// 标记单个事项为完成，或未完成
		toggle: function (e) {
			var i = this.getIndexFromEl(e.target);
			var status = this.todos[i].status;

			if (status == 0) {
				this.todos[i].status = 1;
			} else if (status == 1) {
				this.todos[i].status = 0;
			}
			var data = {
				id: this.todos[i].id,
				status: this.todos[i].status
			}
			this.editTodos(data);
			this.getTodos();

			this.render();
		},
		// 双击编辑
		editingMode: function (e) {
			var $input = $(e.target).closest('li').addClass('editing').find('.edit');
			var val = $input.val();
			$input.val('').focus().val(val);
		},
		// 保存编辑或退出编辑
		editKeyup: function (e) {
			if (e.which === ENTER_KEY) {
				e.target.blur();
			}

			if (e.which === ESCAPE_KEY) {
				$(e.target).data('abort', true).blur();
			}
		},
		// 更新数据
		update: function (e) {
			var $el = $(e.target);
			var val = $el.val().trim();
			var i = this.getIndexFromEl(el)
			if (!val) {
				this.destroy(e);
				return;
			}

			if ($el.data('abort')) {
				$el.data('abort', false);
			} else {
				this.todos[i].content = val;
			};
			var data = {
				id: this.todos[i].id,
				user_id: todos[i].user_id, 
				content: this.todos[i].content,
			};

			this.getTodos();

			this.render();
		},
		// 销毁数据
		destroy: function (e) {
			console.log(123)
			var i = this.getIndexFromEl(e.target),
				id = this.todos[i].id;			
			this.del(id);
			this.getTodos();

			this.render();
		},
		Authorization: function () {
			this.Authorization = localStorage.getItem('Authorization');
			if (!this.Authorization) {
				window.location.href = './register-login/login.html';
			} else {
				this.getTodos();
			}
		},
		signOut: function () {
			localStorage.removeItem('Authorization');
			window.location.reload();
		}
	};
	// 初始化页面
	App.init();
});
