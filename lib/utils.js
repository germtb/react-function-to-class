'use babel';

import traverse from 'babel-traverse';

export const toAtomRange = ({ start, end }) => [
	[start.line - 1, start.column],
	[end.line - 1, end.column]
];

const funcToClass = (name, body, params, buffer, append, {
	componentToInherit = 'React.PureComponent',
	methodsToImplement = {},
	semicolons = true
}) => {
	const semicolon = semicolons ? ';' : '';
	append(`class ${name} extends ${componentToInherit} {`);

	Object.keys(methodsToImplement).forEach(method => {
		if (!methodsToImplement[method]) {
			return;
		}

		if (method === 'constructor') {
			append('\nconstructor(props) {');
			append(`\nsuper(props)${semicolon}`);
		} else {
			append(`\n${method}() {`);
		}

		append('\n}');
		append('\n');
	});

	append('\nrender() {');

	if (params.length) {
		const paramsSource = params.map(p => buffer.getTextInRange(toAtomRange(p.loc)));
		append(`\nconst ${paramsSource} = this.props${semicolon}`);
	}

	if (body.type === 'BlockStatement') {
		const bodySource = body.body.map(p => `\n${buffer.getTextInRange(toAtomRange(p.loc))}`);
		append(bodySource.reduce((acc, line) => acc + line));
	} else {
		const bodySource = buffer.getTextInRange(toAtomRange(body.loc));
		append(`\nreturn ${bodySource}${semicolon}`);
	}

	append('\n}\n}');
};

const toClassVisitorFactory = (
	append,
	buffer,
	callback,
	options) => {
	let found = false;
	return {
		FunctionDeclaration(path) {
			if (found) {
				return;
			}

			const name = path.node.id.name;
			const body = path.node.body;
			const params = path.node.params;

			if (!callback(path.node.loc)) {
				return;
			}

			found = true;

			funcToClass(name, body, params, buffer, append, options);
		},
		FunctionExpression(path) {
			if (found) {
				return;
			}
			if (!path.parent.id || !path.parent.id.name) {
				return;
			}

			const declarationPath = path.findParent(p => p.isVariableDeclaration());

			if (!callback(declarationPath.node.loc)) {
				return;
			}

			found = true;

			const name = path.parent.id.name;
			const body = path.node.body;
			const params = path.node.params;

			funcToClass(name, body, params, buffer, append, options);
		},
		ArrowFunctionExpression(path) {
			if (found) {
				return;
			}
			if (!path.parent.id || !path.parent.id.name) {
				return;
			}

			const declarationPath = path.findParent(p => p.isVariableDeclaration());

			if (!callback(declarationPath.node.loc)) {
				return;
			}

			found = true;

			const name = path.parent.id.name;
			const body = path.node.body;
			const params = path.node.params;

			funcToClass(name, body, params, buffer, append, options);
		}
	};
};

export const toClass = (
	ast,
	buffer,
	callback,
	options = {}) => {
	let template = '';
	const append = (str) => { template += str; };
	traverse(ast, toClassVisitorFactory(
		append,
		buffer,
		callback,
		options
	));

	return template;
};
