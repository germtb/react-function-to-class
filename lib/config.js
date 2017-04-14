'use babel';

export const config = {
	componentToInherit: {
		title: 'Component to inherit from',
		description: 'Class that functions will inherit when transformed',
		type: 'string',
		default: 'React.PureComponent'
	},
	indentation: {
		title: 'Indentation',
		type: 'string',
		default: 'tabs',
		enum: ['tabs', '2 spaces', '4 spaces', '8 spaces']
	}
};
