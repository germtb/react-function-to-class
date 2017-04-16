'use babel';

export const config = {
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
