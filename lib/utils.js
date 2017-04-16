'use babel';

import traverse from 'babel-traverse';

export const toAtomRange = ({ start, end }) => [
	[start.line - 1, start.column],
	[end.line - 1, end.column]
];

const toComponentVisitorFactory = (append, buffer, callback, component) => {
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

			append(`class ${name} extends ${component} {\nrender() {`);

			if (params.length) {
				const paramsSource = params.map(p => buffer.getTextInRange(toAtomRange(p.loc)));
				append(`\nconst ${paramsSource} = this.props;`);
			}

			if (body.type === 'BlockStatement') {
				const bodySource = body.body.map(p => `\n${buffer.getTextInRange(toAtomRange(p.loc))}`);
				append(bodySource.reduce((acc, line) => acc + line));
			} else {
				const bodySource = buffer.getTextInRange(toAtomRange(body.loc));
				append(`\n}return ${bodySource};`);
			}

			append('\n}\n}');
		}
	};
};

export const toComponent = (
	ast,
	buffer,
	callback,
	component = 'React.PureComponent') => {
	let template = '';
	const append = (str) => { template += str; };
	traverse(ast, toComponentVisitorFactory(
		append,
		buffer,
		callback,
		component
	));

	return template;
};
