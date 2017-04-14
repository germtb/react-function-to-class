import { expect } from 'chai';
import * as babylon from 'babylon';
import { toComponent } from './utils';

describe('react-function-to-component', () => {
	const parse = data => babylon.parse(data, {
		sourceType: 'module',
		plugins: [
			'objectRestSpread',
			'asyncGenerators',
			'jsx',
			'classProperties',
			'exportExtensions'
		]
	});

	const startCallback = () => true;

	const bufferFactory = data => ({
		getTextInRange: ([start, end]) => data[start[0]].substring(start[1], end[1])
	});

	it('should convert arrow functions with no args and no body', () => {
		const data = [
			'const x = () => 0;'
		];
		const ast = parse(data.join('\n'));
		const actual = toComponent(ast, bufferFactory(data), startCallback);
		const expected = [
			'class x extends React.PureComponent {',
			'\trender() {',
			'\t\treturn 0;',
			'\t}',
			'}',
		].join('\n');
		expect(actual).to.eql(expected);
	});

	it('should convert arrow functions with args and no body', () => {
		const data = [
			'const x = t => <div>{ t }</div>;'
		];
		const ast = parse(data.join('\n'));
		const actual = toComponent(ast, bufferFactory(data), startCallback);
		const expected = [
			'class x extends React.PureComponent {',
			'\trender() {',
			'\t\tconst t = this.props;',
			'\t\treturn <div>{ t }</div>;',
			'\t}',
			'}',
		].join('\n');
		expect(actual).to.eql(expected);
	});

	it('should convert arrow functions with args and body', () => {
		const data = [
			'const x = t => {',
			'\treturn <div>{ t }</div>;',
			'};'
		];
		const ast = parse(data.join('\n'));
		const actual = toComponent(ast, bufferFactory(data), startCallback);
		const expected = [
			'class x extends React.PureComponent {',
			'\trender() {',
			'\t\tconst t = this.props;',
			'\t\treturn <div>{ t }</div>;',
			'\t}',
			'}',
		].join('\n');
		expect(actual).to.eql(expected);
	});

	it('should convert arrow functions with args and multi-line body', () => {
		const data = [
			'const x = t => {',
			'const foo = 2 * t;',
			'\treturn <div>{ foo }</div>;',
			'};'
		];
		const ast = parse(data.join('\n'));
		const actual = toComponent(ast, bufferFactory(data), startCallback);
		const expected = [
			'class x extends React.PureComponent {',
			'\trender() {',
			'\t\tconst t = this.props;',
			'\t\tconst foo = 2 * t;',
			'\t\treturn <div>{ foo }</div>;',
			'\t}',
			'}',
		].join('\n');
		expect(actual).to.eql(expected);
	});
});
