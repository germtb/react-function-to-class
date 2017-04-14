'use babel';

import traverse from 'babel-traverse';

export const toAtomRange = ({ start, end }) => [
	[start.line - 1, start.column],
	[end.line - 1, end.column]
];

const toComponentVisitorFactory = (append, buffer, callback, component, tab) => {
	let found = false;
	return {
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

			append(`class ${name} extends ${component} {\n${tab}render() {`);

			if (params.length) {
				const paramsSource = params.map(p => buffer.getTextInRange(toAtomRange(p.loc)));
				append(`\n${tab}${tab}const ${paramsSource} = this.props;`);
			}

			if (body.type === 'BlockStatement') {
				const bodySource = body.body.map(p => `\n${tab}${tab}${buffer.getTextInRange(toAtomRange(p.loc))}`);
				append(bodySource.reduce((acc, line) => acc + line));
			} else {
				const bodySource = buffer.getTextInRange(toAtomRange(body.loc));
				append(`\n${tab}${tab}return ${bodySource};`);
			}

			append(`\n${tab}}\n}`);
		}
	};
};

export const toComponent = (
	ast,
	buffer,
	callback,
	component = 'React.PureComponent',
	tab = '\t') => {
	let template = '';
	const append = (str) => { template += str; };
	traverse(ast, toComponentVisitorFactory(
		append,
		buffer,
		callback,
		component,
		tab
	));

	return template;
};
