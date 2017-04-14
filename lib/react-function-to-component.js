'use babel';

import { CompositeDisposable } from 'atom';
import * as babylon from 'babylon';

import { toComponent, toAtomRange } from './utils';
import { config } from './config';

const indentation = mode => {
	if (mode === 'tabs') {
		return '\t';
	} else if (mode === '2 spaces') {
		return '  ';
	} else if (mode === '4 spaces') {
		return '    ';
	} else if (mode === '8 spaces') {
		return '        ';
	}

	return '';
};

export default {

	config,
	subscriptions: null,
	indentation: indentation(config.indentation.default),
	componentToInherit: config.indentation.default,

	activate() {
		atom.config.observe('react-function-to-component.indentation', value => {
			this.indentation = indentation(value);
		});
		atom.config.observe('react-function-to-component.componentToInherit', value => {
			this.componentToInherit = value;
		});
		this.subscriptions = new CompositeDisposable();
		this.subscriptions.add(atom.commands.add('atom-workspace', {
			'react-function-to-component:toComponent': () => {
				const editor = atom.workspace.getActiveTextEditor();
				const cursor = editor.getCursorBufferPosition();
				const buffer = editor.getBuffer();
				const data = buffer.getText();
				const ast = babylon.parse(data, {
					sourceType: 'module',
					plugins: [
						'objectRestSpread',
						'asyncGenerators',
						'jsx',
						'classProperties',
						'exportExtensions'
					]
				});

				let range;
				const callback = loc => {
					range = toAtomRange(loc);
					const line = cursor.row + 1;
					const column = cursor.column;

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
				const template = toComponent(
					ast,
					buffer,
					callback,
					this.componentToInherit,
					this.indentation
				);
				if (range) {
					editor.setTextInBufferRange(range, template);
				}
			}
		}));
	},

	deactivate() {
		this.subscriptions.dispose();
	},

};
