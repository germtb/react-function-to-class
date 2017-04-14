'use babel';

import { CompositeDisposable } from 'atom';
import * as babylon from 'babylon';

import { toComponent, toAtomRange } from './utils';

export default {

	subscriptions: null,

	activate() {
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
				const template = toComponent(ast, buffer, callback);
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
