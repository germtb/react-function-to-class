'use babel';

import { CompositeDisposable } from 'atom';
import * as babylon from 'babylon';

import { toComponent, toAtomRange } from './utils';
import { config } from './config';

export default {

	config,
	subscriptions: null,
	componentToInherit: config.componentToInherit.default,
	methodsToImplement: {
		constructor: config.constructor.default,
		componentWillMount: config.componentWillMount.default,
		componentDidMount: config.componentDidMount.default,
	},
	semicolons: config.semicolons.default,

	activate() {
		atom.config.observe('react-function-to-component.componentToInherit', value => {
			this.componentToInherit = value;
		});
		atom.config.observe('react-function-to-component.semicolons', value => {
			this.semicolons = value;
		});
		atom.config.observe('react-function-to-component.constructor', value => {
			this.methodsToImplement.constructor = value;
		});
		atom.config.observe('react-function-to-component.componentWillMount', value => {
			this.methodsToImplement.componentWillMount = value;
		});
		atom.config.observe('react-function-to-component.componentDidMount', value => {
			this.methodsToImplement.componentDidMount = value;
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
					callback, {
						componentToInherit: this.componentToInherit,
						methodsToImplement: this.methodsToImplement,
						semicolons: this.semicolons
					}
				);
				if (range) {
					const checkpoint = editor.createCheckpoint();
					editor.setTextInBufferRange(range, template);
					const rows = template.split('\n');
					const start = range[0];
					const firstRow = start[0];
					const lastRow = start[0] + rows.length;
					editor.autoIndentBufferRows(firstRow, lastRow);
					for (let row = firstRow; row < lastRow; row += 1) {
						if (buffer.isRowBlank(row)) {
							editor.setSelectedBufferRange([
								[row, 0], [row, buffer.lineLengthForRow(row)]
							]);
							editor.delete();
						}
					}

					editor.groupChangesSinceCheckpoint(checkpoint);
				}
			}
		}));
	},

	deactivate() {
		this.subscriptions.dispose();
	},

};
