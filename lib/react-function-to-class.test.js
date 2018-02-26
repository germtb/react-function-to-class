import { expect } from 'chai'
import { toClass, parse } from './utils'

describe('react-function-to-class', () => {
	const startCallback = () => true

	const bufferFactory = data => ({
		getTextInRange: ([start, end]) => data[start[0]].substring(start[1], end[1])
	})

	it('should convert arrow functions with no args and no body', () => {
		const data = ['const x = () => 0;']
		const ast = parse(data.join('\n'))
		const actual = toClass(ast, bufferFactory(data), startCallback)
		const expected = [
			'class x extends React.PureComponent {',
			'render() {',
			'return 0;',
			'}',
			'}'
		].join('\n')
		expect(actual).to.eql(expected)
	})

	it('should convert arrow functions with args and no body', () => {
		const data = ['const x = t => <div>{ t }</div>;']
		const ast = parse(data.join('\n'))
		const actual = toClass(ast, bufferFactory(data), startCallback)
		const expected = [
			'class x extends React.PureComponent {',
			'render() {',
			'const t = this.props;',
			'return <div>{ t }</div>;',
			'}',
			'}'
		].join('\n')
		expect(actual).to.eql(expected)
	})

	it('should convert arrow functions with args and body', () => {
		const data = ['const x = t => {', 'return <div>{ t }</div>;', '};']
		const ast = parse(data.join('\n'))
		const actual = toClass(ast, bufferFactory(data), startCallback)
		const expected = [
			'class x extends React.PureComponent {',
			'render() {',
			'const t = this.props;',
			'return <div>{ t }</div>;',
			'}',
			'}'
		].join('\n')
		expect(actual).to.eql(expected)
	})

	it('should convert arrow functions with args and multi-line body', () => {
		const data = [
			'const x = t => {',
			'const foo = 2 * t;',
			'return <div>{ foo }</div>;',
			'};'
		]
		const ast = parse(data.join('\n'))
		const actual = toClass(ast, bufferFactory(data), startCallback)
		const expected = [
			'class x extends React.PureComponent {',
			'render() {',
			'const t = this.props;',
			'const foo = 2 * t;',
			'return <div>{ foo }</div>;',
			'}',
			'}'
		].join('\n')
		expect(actual).to.eql(expected)
	})
})
