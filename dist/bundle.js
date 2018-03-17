'use strict';

var atom$1 = require('atom');

function parse(text) {
	var babylon = require('babylon');

	return babylon.parse(text, {
		sourceType: 'module',
		plugins: ['objectRestSpread', 'asyncGenerators', 'jsx', 'classProperties', 'exportExtensions']
	});
}

var toAtomRange = function toAtomRange(_ref) {
	var start = _ref.start,
	    end = _ref.end;
	return [[start.line - 1, start.column], [end.line - 1, end.column]];
};

var funcToClass = function funcToClass(name, body, params, buffer, append, _ref2) {
	var _ref2$componentToInhe = _ref2.componentToInherit,
	    componentToInherit = _ref2$componentToInhe === undefined ? 'React.PureComponent' : _ref2$componentToInhe,
	    _ref2$methodsToImplem = _ref2.methodsToImplement,
	    methodsToImplement = _ref2$methodsToImplem === undefined ? {} : _ref2$methodsToImplem,
	    _ref2$semicolons = _ref2.semicolons,
	    semicolons = _ref2$semicolons === undefined ? true : _ref2$semicolons;

	var semicolon = semicolons ? ';' : '';
	append('class ' + name + ' extends ' + componentToInherit + ' {');

	Object.keys(methodsToImplement).forEach(function (method) {
		if (!methodsToImplement[method]) {
			return;
		}

		if (method === 'constructor') {
			append('\nconstructor(props) {');
			append('\nsuper(props)' + semicolon);
		} else {
			append('\n' + method + '() {');
		}

		append('\n}');
		append('\n');
	});

	append('\nrender() {');

	if (params.length) {
		var paramsSource = params.map(function (p) {
			return buffer.getTextInRange(toAtomRange(p.loc));
		});
		append('\nconst ' + paramsSource + ' = this.props' + semicolon);
	}

	if (body.type === 'BlockStatement') {
		var bodySource = body.body.map(function (p) {
			return '\n' + buffer.getTextInRange(toAtomRange(p.loc));
		});
		append(bodySource.reduce(function (acc, line) {
			return acc + line;
		}));
	} else {
		var _bodySource = buffer.getTextInRange(toAtomRange(body.loc));
		append('\nreturn ' + _bodySource + semicolon);
	}

	append('\n}\n}');
};

var toClassVisitorFactory = function toClassVisitorFactory(append, buffer, callback, options) {
	var found = false;
	return {
		FunctionDeclaration: function FunctionDeclaration(path) {
			if (found) {
				return;
			}

			var name = path.node.id.name;
			var body = path.node.body;
			var params = path.node.params;

			if (!callback(path.node.loc)) {
				return;
			}

			found = true;

			funcToClass(name, body, params, buffer, append, options);
		},
		FunctionExpression: function FunctionExpression(path) {
			if (found) {
				return;
			}
			if (!path.parent.id || !path.parent.id.name) {
				return;
			}

			var declarationPath = path.findParent(function (p) {
				return p.isVariableDeclaration();
			});

			if (!callback(declarationPath.node.loc)) {
				return;
			}

			found = true;

			var name = path.parent.id.name;
			var body = path.node.body;
			var params = path.node.params;

			funcToClass(name, body, params, buffer, append, options);
		},
		ArrowFunctionExpression: function ArrowFunctionExpression(path) {
			if (found) {
				return;
			}
			if (!path.parent.id || !path.parent.id.name) {
				return;
			}

			var declarationPath = path.findParent(function (p) {
				return p.isVariableDeclaration();
			});

			if (!callback(declarationPath.node.loc)) {
				return;
			}

			found = true;

			var name = path.parent.id.name;
			var body = path.node.body;
			var params = path.node.params;

			funcToClass(name, body, params, buffer, append, options);
		}
	};
};

var toClass = function toClass(ast, buffer, callback) {
	var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

	var traverse = require('@babel/traverse').default;

	var template = '';
	var append = function append(str) {
		template += str;
	};
	traverse(ast, toClassVisitorFactory(append, buffer, callback, options));

	return template;
};

var config = {
	componentToInherit: {
		title: 'Component to inherit from',
		description: 'Class that functions will inherit when transformed',
		type: 'string',
		default: 'React.PureComponent'
	},
	componentWillMount: {
		title: 'componentWillMount',
		description: 'should implement componentWillMount',
		type: 'boolean',
		default: false
	},
	componentDidMount: {
		title: 'componentDidMount',
		description: 'should implement componentDidMount',
		type: 'boolean',
		default: false
	},
	constructor: {
		title: 'constructor',
		description: 'should implement constructor',
		type: 'boolean',
		default: false
	},
	semicolons: {
		title: 'semicolons',
		description: 'should append semicolons to end of lines',
		type: 'boolean',
		default: true
	}
};

var reactFunctionToClass = {
	config: config,
	subscriptions: null,
	componentToInherit: config.componentToInherit.default,
	methodsToImplement: {
		constructor: config.constructor.default,
		componentWillMount: config.componentWillMount.default,
		componentDidMount: config.componentDidMount.default
	},
	semicolons: config.semicolons.default,

	activate: function activate() {
		var _this = this;

		this.componentToInherit = atom.config.get('react-function-to-class.componentToInherit');
		atom.config.observe('react-function-to-class.componentToInherit', function (value) {
			_this.componentToInherit = value;
		});
		this.semicolons = atom.config.get('react-function-to-class.semicolons');
		atom.config.observe('react-function-to-class.semicolons', function (value) {
			_this.semicolons = value;
		});
		this.methodsToImplement.constructor = atom.config.get('react-function-to-class.constructor');
		atom.config.observe('react-function-to-class.constructor', function (value) {
			_this.methodsToImplement.constructor = value;
		});
		this.methodsToImplement.componentWillMount = atom.config.get('react-function-to-class.componentWillMount');
		atom.config.observe('react-function-to-class.componentWillMount', function (value) {
			_this.methodsToImplement.componentWillMount = value;
		});
		this.methodsToImplement.componentDidMount = atom.config.get('react-function-to-class.componentDidMount');
		atom.config.observe('react-function-to-class.componentDidMount', function (value) {
			_this.methodsToImplement.componentDidMount = value;
		});
		this.subscriptions = new atom$1.CompositeDisposable();
		this.subscriptions.add(atom.commands.add('atom-workspace', {
			'react-function-to-class:toClass': function reactFunctionToClassToClass() {
				var editor = atom.workspace.getActiveTextEditor();
				var cursor = editor.getCursorBufferPosition();
				var buffer = editor.getBuffer();
				var data = buffer.getText();
				var ast = parse(data, {
					sourceType: 'module',
					plugins: ['objectRestSpread', 'asyncGenerators', 'jsx', 'classProperties', 'exportExtensions']
				});

				var range = void 0;
				var callback = function callback(loc) {
					range = toAtomRange(loc);
					var line = cursor.row + 1;
					var column = cursor.column;

					if (loc.start.line < line && loc.end.line > line) {
						return true;
					}

					if (loc.start.line === line && loc.start.column <= column) {
						return true;
					}

					if (loc.end.line === line && loc.end.column >= column) {
						return true;
					}

					range = null;
					return false;
				};
				var template = toClass(ast, buffer, callback, {
					componentToInherit: _this.componentToInherit,
					methodsToImplement: _this.methodsToImplement,
					semicolons: _this.semicolons
				});

				if (range) {
					var checkpoint = editor.createCheckpoint();
					editor.setTextInBufferRange(range, template);
					var rows = template.split('\n');
					var start = range[0];
					var firstRow = start[0];
					var lastRow = start[0] + rows.length;
					editor.autoIndentBufferRows(firstRow, lastRow);
					for (var row = firstRow; row < lastRow; row += 1) {
						if (buffer.isRowBlank(row)) {
							editor.setSelectedBufferRange([[row, 0], [row, buffer.lineLengthForRow(row)]]);
							editor.delete();
						}
					}

					editor.groupChangesSinceCheckpoint(checkpoint);
				}
			}
		}));
	},
	deactivate: function deactivate() {
		this.subscriptions.dispose();
	}
};

module.exports = reactFunctionToClass;
